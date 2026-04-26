'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  gameId: string
  initialDate: string
  initialTime: string | null
  initialOpponent: string | null
  initialInningCount: number
}

export default function GameEditor({
  gameId,
  initialDate,
  initialTime,
  initialOpponent,
  initialInningCount,
}: Props) {
  const router = useRouter()
  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState(initialTime ?? '')
  const [opponent, setOpponent] = useState(initialOpponent ?? '')
  const [inningCount, setInningCount] = useState<5 | 6>(initialInningCount as 5 | 6)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Build payload with only changed fields
    const payload: Record<string, unknown> = {}
    if (date !== initialDate) payload.date = date
    if (inningCount !== initialInningCount) payload.inningCount = inningCount
    if (time !== (initialTime ?? '')) payload.time = time || null
    if (opponent !== (initialOpponent ?? '')) payload.opponent = opponent || null

    if (Object.keys(payload).length === 0) return

    setSaving(true)
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to save')
        return
      }
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-3 items-end flex-wrap">
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
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </form>
  )
}
