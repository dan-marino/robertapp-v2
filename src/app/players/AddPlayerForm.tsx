'use client'

import { useState } from 'react'

interface Player {
  id: string
  name: string
  gender: 'M' | 'F'
  isGuest: boolean
  traded: boolean
}

interface Props {
  onAdd: (player: Player) => void
}

export default function AddPlayerForm({ onAdd }: Props) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'M' | 'F'>('M')
  const [adding, setAdding] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, gender }),
    })
    const player: Player = await res.json()
    onAdd(player)
    setName('')
    setAdding(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end">
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
  )
}
