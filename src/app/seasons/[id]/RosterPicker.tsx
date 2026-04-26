'use client'

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
  initialPool: Player[]
}

export default function RosterPicker({ seasonId, initialRoster, initialPool }: Props) {
  const [roster, setRoster] = useState<Player[]>(initialRoster)
  const [search, setSearch] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newGender, setNewGender] = useState<'M' | 'F'>('M')
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addingNew, setAddingNew] = useState(false)

  const rosterIds = new Set(roster.map((p) => p.id))

  const availablePlayers = initialPool.filter(
    (p) =>
      !rosterIds.has(p.id) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleAddExisting(player: Player) {
    setAddingId(player.id)
    const res = await fetch(`/api/seasons/${seasonId}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: player.id }),
    })
    if (res.ok) {
      const added = await res.json()
      setRoster((prev) => [...prev, added])
    }
    setAddingId(null)
  }

  async function handleRemove(playerId: string) {
    await fetch(`/api/seasons/${seasonId}/players/${playerId}`, { method: 'DELETE' })
    setRoster((prev) => prev.filter((p) => p.id !== playerId))
  }

  async function handleAddNew(e: React.FormEvent) {
    e.preventDefault()
    setAddingNew(true)
    const res = await fetch(`/api/seasons/${seasonId}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, gender: newGender }),
    })
    if (res.ok) {
      const player = await res.json()
      setRoster((prev) => [...prev, player])
      setNewName('')
      setShowNewForm(false)
    }
    setAddingNew(false)
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
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-xs">&#10003;</span>
                <a
                  href={`/players/${player.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {player.name}
                </a>
              </div>
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

      <div className="border border-zinc-200 rounded-lg p-4 mb-4">
        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">
          Add from player pool
        </h3>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search players…"
          className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 mb-3"
        />

        {availablePlayers.length === 0 ? (
          <p className="text-zinc-400 text-sm">
            {search ? 'No players match your search.' : 'All players are already on the roster.'}
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 border border-zinc-100 rounded-lg overflow-hidden">
            {availablePlayers.map((player) => (
              <li
                key={player.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{player.name}</span>
                  <span className="text-xs text-zinc-400">{player.gender}</span>
                </div>
                <button
                  onClick={() => handleAddExisting(player)}
                  disabled={addingId === player.id}
                  className="text-xs text-zinc-600 hover:text-zinc-900 font-medium disabled:opacity-50"
                >
                  {addingId === player.id ? 'Adding…' : 'Add'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showNewForm ? (
        <form onSubmit={handleAddNew} className="border border-zinc-200 rounded-lg p-4">
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">
            New player
          </h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs text-zinc-500 mb-1">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                placeholder="Player name"
                className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Gender</label>
              <select
                value={newGender}
                onChange={(e) => setNewGender(e.target.value as 'M' | 'F')}
                className="border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              >
                <option value="M">M</option>
                <option value="F">F</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={addingNew}
              className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-700 disabled:opacity-50"
            >
              {addingNew ? 'Adding…' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-800"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowNewForm(true)}
          className="text-sm text-zinc-500 hover:text-zinc-800 underline"
        >
          + Add new player
        </button>
      )}
    </section>
  )
}
