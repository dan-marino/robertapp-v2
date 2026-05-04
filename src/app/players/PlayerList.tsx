'use client'

import Link from 'next/link'
import { useState } from 'react'
import AddPlayerForm from './AddPlayerForm'
import CSVImporter from './CSVImporter'

interface Player {
  id: string
  name: string
  gender: 'M' | 'F'
  isGuest: boolean
  traded: boolean
}

interface PrefRow {
  playerId: string
  position: string
  tier: 'Tier1' | 'Tier2' | 'Tier3' | 'Anti'
}

interface Props {
  initialPlayers: Player[]
  prefsByPlayer: Record<string, PrefRow[]>
}

const TIER_NUM: Record<'Tier1' | 'Tier2' | 'Tier3', string> = {
  Tier1: '1',
  Tier2: '2',
  Tier3: '3',
}

function PrefBadges({ prefs }: { prefs: PrefRow[] }) {
  const tiered = prefs
    .filter((p) => p.tier !== 'Anti')
    .sort((a, b) => a.tier.localeCompare(b.tier))
  const anti = prefs.filter((p) => p.tier === 'Anti')

  if (tiered.length === 0 && anti.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {tiered.map((p) => (
        <span
          key={p.position}
          className="text-xs border border-green-300 text-green-800 rounded-full px-2 py-0.5"
        >
          {TIER_NUM[p.tier as 'Tier1' | 'Tier2' | 'Tier3']}: {p.position}
        </span>
      ))}
      {anti.map((p) => (
        <span
          key={p.position}
          className="text-xs border border-red-200 text-red-400 rounded-full px-2 py-0.5 line-through"
        >
          {p.position}
        </span>
      ))}
    </div>
  )
}

export default function PlayerList({ initialPlayers, prefsByPlayer }: Props) {
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

      <section className="mb-10">
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
          Import from CSV
        </h2>
        <CSVImporter />
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
                className="flex items-start justify-between px-4 py-3"
              >
                <Link href={`/players/${player.id}`} className="hover:underline">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{player.name}</span>
                    <span className="text-xs bg-zinc-100 text-zinc-500 rounded px-1.5 py-0.5">
                      {player.gender}
                    </span>
                  </div>
                  <PrefBadges prefs={prefsByPlayer[player.id] ?? []} />
                </Link>
                <button
                  onClick={() => handleMarkTraded(player.id)}
                  className="text-xs text-zinc-400 hover:text-red-500 transition-colors shrink-0 ml-4 mt-0.5"
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
