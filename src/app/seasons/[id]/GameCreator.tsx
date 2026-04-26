'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  seasonId: string
}

export default function GameCreator({ seasonId }: Props) {
  const router = useRouter()
  const [date, setDate] = useState('')
  const [inningCount, setInningCount] = useState<5 | 6>(6)
  const [mode, setMode] = useState<'Unified' | 'Split'>('Unified')
  const [time, setTime] = useState('')
  const [opponent, setOpponent] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const res = await fetch(`/api/seasons/${seasonId}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        inningCount,
        mode,
        time: time || undefined,
        opponent: opponent || undefined,
      }),
    })
    const game = await res.json()
    setCreating(false)
    router.push(`/games/${game.id}`)
  }

  return (
    <form onSubmit={handleCreate} className="flex gap-3 items-end flex-wrap">
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Time</label>
        <input
          type="text"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          placeholder="6:30 PM"
          className="border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Opponent</label>
        <input
          type="text"
          value={opponent}
          onChange={(e) => setOpponent(e.target.value)}
          placeholder="Team name"
          className="border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Innings</label>
        <select
          value={inningCount}
          onChange={(e) => setInningCount(Number(e.target.value) as 5 | 6)}
          className="border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        >
          <option value={6}>6</option>
          <option value={5}>5</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Mode</label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as 'Unified' | 'Split')}
          className="border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        >
          <option value="Unified">Unified</option>
          <option value="Split">Split</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={creating}
        className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-700 disabled:opacity-50"
      >
        {creating ? 'Creating…' : 'Add game'}
      </button>
    </form>
  )
}
