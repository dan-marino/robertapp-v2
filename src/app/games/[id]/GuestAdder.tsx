'use client'

import { useState } from 'react'

interface Player {
  id: string
  name: string
  gender: 'M' | 'F'
  isGuest: boolean
}

interface Props {
  gameId: string
  onGuestAdded: (guest: Player) => void
}

export default function GuestAdder({ gameId, onGuestAdded }: Props) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'M' | 'F'>('M')
  const [adding, setAdding] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    const res = await fetch(`/api/games/${gameId}/guests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, gender }),
    })
    const guest = await res.json()
    onGuestAdded(guest)
    setName('')
    setAdding(false)
  }

  return (
    <form onSubmit={handleAdd} className="flex gap-3 items-end mt-3">
      <div className="flex-1">
        <label className="block text-xs text-zinc-500 mb-1">Guest name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Guest player"
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
        {adding ? 'Adding…' : 'Add guest'}
      </button>
    </form>
  )
}
