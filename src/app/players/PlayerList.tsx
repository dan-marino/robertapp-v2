'use client'

import { useState } from 'react'
import AddPlayerForm from './AddPlayerForm'

interface Player {
  id: string
  name: string
  gender: 'M' | 'F'
  isGuest: boolean
  traded: boolean
}

interface Props {
  initialPlayers: Player[]
}

export default function PlayerList({ initialPlayers }: Props) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [showTraded, setShowTraded] = useState(false)

  const activePlayers = players.filter((p) => !p.traded)
  const tradedPlayers = players.filter((p) => p.traded)

  async function handleMarkTraded(id: string) {
    await fetch(`/api/players/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ traded: true }),
    })
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, traded: true } : p))
    )
  }

  async function handleReinstate(id: string) {
    await fetch(`/api/players/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ traded: false }),
    })
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, traded: false } : p))
    )
  }

  function handleAdd(player: Player) {
    setPlayers((prev) => [...prev, player])
  }

  return (
    <div>
      <section className="mb-10">
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
          Add Player
        </h2>
        <AddPlayerForm onAdd={handleAdd} />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide">
            Roster
          </h2>
          <label className="flex items-center gap-2 text-xs text-zinc-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showTraded}
              onChange={(e) => setShowTraded(e.target.checked)}
              className="rounded"
            />
            Show traded players
          </label>
        </div>

        {activePlayers.length === 0 ? (
          <p className="text-zinc-400 text-sm mb-4">No active players.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 border border-zinc-100 rounded-lg overflow-hidden mb-4">
            {activePlayers.map((player) => (
              <li
                key={player.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{player.name}</span>
                  <span className="text-xs bg-zinc-100 text-zinc-500 rounded px-1.5 py-0.5">
                    {player.gender}
                  </span>
                </div>
                <button
                  onClick={() => handleMarkTraded(player.id)}
                  className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
                >
                  Mark traded
                </button>
              </li>
            ))}
          </ul>
        )}

        {showTraded && (
          <>
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2 mt-6">
              Traded
            </h3>
            {tradedPlayers.length === 0 ? (
              <p className="text-zinc-400 text-sm">No traded players.</p>
            ) : (
              <ul className="divide-y divide-zinc-100 border border-zinc-100 rounded-lg overflow-hidden">
                {tradedPlayers.map((player) => (
                  <li
                    key={player.id}
                    className="flex items-center justify-between px-4 py-3 bg-zinc-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-zinc-400">
                        {player.name}
                      </span>
                      <span className="text-xs bg-zinc-100 text-zinc-400 rounded px-1.5 py-0.5">
                        {player.gender}
                      </span>
                      <span className="text-xs bg-zinc-200 text-zinc-500 rounded px-1.5 py-0.5">
                        Traded
                      </span>
                    </div>
                    <button
                      onClick={() => handleReinstate(player.id)}
                      className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                    >
                      Reinstate
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  )
}
