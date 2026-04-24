'use client'

import { useState } from 'react'
import type { RSVPStatus } from '@/domain/types'

interface Player {
  id: string
  name: string
  gender: 'M' | 'F'
  isGuest: boolean
}

interface PlayerRSVP {
  player: Player
  status: RSVPStatus | null
}

interface Props {
  gameId: string
  initialRsvps: PlayerRSVP[]
}

const STATUSES: RSVPStatus[] = ['Present', 'Absent', 'Late']

const STATUS_COLORS: Record<RSVPStatus, string> = {
  Present: 'bg-green-100 text-green-800 border-green-200',
  Absent: 'bg-red-100 text-red-700 border-red-200',
  Late: 'bg-yellow-100 text-yellow-800 border-yellow-200',
}

export default function RSVPManager({ gameId, initialRsvps }: Props) {
  const [rsvps, setRsvps] = useState<PlayerRSVP[]>(initialRsvps)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function setStatus(playerId: string, status: RSVPStatus) {
    setRsvps((prev) =>
      prev.map((r) => (r.player.id === playerId ? { ...r, status } : r))
    )
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/games/${gameId}/rsvps`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        rsvps
          .filter((r) => r.status !== null)
          .map((r) => ({ playerId: r.player.id, status: r.status }))
      ),
    })
    setSaving(false)
    setSaved(true)
  }

  return (
    <div>
      <ul className="divide-y divide-zinc-100 border border-zinc-100 rounded-lg overflow-hidden mb-4">
        {rsvps.map(({ player, status }) => (
          <li key={player.id} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium">
              {player.name}
              <span className="ml-2 text-xs text-zinc-400">{player.gender}</span>
            </span>
            <div className="flex gap-1">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(player.id, s)}
                  className={`px-2 py-1 text-xs rounded border font-medium transition-colors ${
                    status === s
                      ? STATUS_COLORS[s]
                      : 'bg-zinc-50 text-zinc-400 border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {rsvps.length === 0 && (
        <p className="text-zinc-400 text-sm mb-4">No players on roster yet.</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving || rsvps.length === 0}
        className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-700 disabled:opacity-50"
      >
        {saving ? 'Saving…' : saved ? 'Saved' : 'Save RSVPs'}
      </button>
    </div>
  )
}
