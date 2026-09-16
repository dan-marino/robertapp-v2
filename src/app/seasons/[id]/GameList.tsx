'use client'

import { useState } from 'react'
import Link from 'next/link'

type Game = {
  id: string
  date: string
  inningCount: number
  mode: string
}

export default function GameList({ initialGames }: { initialGames: Game[] }) {
  const [gameList, setGameList] = useState(initialGames)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete() {
    if (!confirmId) return
    const idToDelete = confirmId
    setConfirmId(null)
    setDeletingId(idToDelete)
    await fetch(`/api/games/${idToDelete}`, { method: 'DELETE' })
    setGameList((prev) => prev.filter((g) => g.id !== idToDelete))
    setDeletingId(null)
  }

  if (gameList.length === 0) return null

  return (
    <>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden mb-4">
        {gameList.map((game) => (
          <li key={game.id} className="flex items-center">
            <Link
              href={`/games/${game.id}`}
              className="flex-1 flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="text-sm font-medium">{game.date}</span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {game.inningCount} inn · {game.mode}
              </span>
            </Link>
            <button
              onClick={() => setConfirmId(game.id)}
              disabled={deletingId === game.id}
              aria-label="Delete game"
              className="px-3 py-3 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-base font-semibold mb-2">Delete this game?</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              This will permanently remove the game and all associated data.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmId(null)}
                className="px-4 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
