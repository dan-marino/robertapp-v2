'use client'

import Link from 'next/link'
import { useState } from 'react'

interface Player {
  id: string
  name: string
  gender: 'M' | 'F'
  isGuest: boolean
}

interface Props {
  seasonId: string
  initialRoster: Player[]
}

export default function RosterManager({ seasonId, initialRoster }: Props) {
  const [roster, setRoster] = useState<Player[]>(initialRoster)
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'M' | 'F'>('M')
  const [adding, setAdding] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    const res = await fetch(`/api/seasons/${seasonId}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, gender }),
    })
    const player = await res.json()
    setRoster((prev) => [...prev, player])
    setName('')
    setAdding(false)
  }

  async function handleRemove(playerId: string) {
    await fetch(`/api/seasons/${seasonId}/players/${playerId}`, { method: 'DELETE' })
    setRoster((prev) => prev.filter((p) => p.id !== playerId))
  }

  return (
    <section>
      <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
        Roster
      </h2>

      {roster.length === 0 ? (
        <p className="text-zinc-400 text-sm mb-4">No players yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-100 border border-zinc-100 rounded-lg overflow-hidden mb-4">
          {roster.map((player) => (
            <li
              key={player.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <Link
                href={`/players/${player.id}`}
                className="text-sm font-medium hover:underline"
              >
                {player.name}
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-400">{player.gender}</span>
                <button
                  onClick={() => handleRemove(player.id)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs text-zinc-500 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Player name"
            className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as 'M' | 'F')}
            className="border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            <option value="M">M</option>
            <option value="F">F</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={adding}
          className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-700 disabled:opacity-50"
        >
          {adding ? 'Adding…' : 'Add'}
        </button>
      </form>
    </section>
  )
}
