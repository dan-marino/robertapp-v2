'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Season {
  id: string
  name: string
  gameCount: number
}

export default function Home() {
  const router = useRouter()
  const [seasons, setSeasons] = useState<Season[]>([])
  const [name, setName] = useState('')
  const [gameCount, setGameCount] = useState(6)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch('/api/seasons')
      .then((r) => r.json())
      .then(setSeasons)
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const res = await fetch('/api/seasons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, gameCount }),
    })
    const season = await res.json()
    setCreating(false)
    router.push(`/seasons/${season.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-8">Softball Lineup Generator</h1>

      <section className="mb-10">
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
          New Season
        </h2>
        <form onSubmit={handleCreate} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-zinc-500 mb-1">Season name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Spring 2025"
              className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Games</label>
            <input
              type="number"
              min={1}
              value={gameCount}
              onChange={(e) => setGameCount(Number(e.target.value))}
              className="w-20 border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-700 disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
          Seasons
        </h2>
        {seasons.length === 0 ? (
          <p className="text-zinc-400 text-sm">No seasons yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 border border-zinc-100 rounded-lg overflow-hidden">
            {seasons.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/seasons/${s.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors"
                >
                  <span className="text-sm font-medium">{s.name}</span>
                  <span className="text-xs text-zinc-400">{s.gameCount} games</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
