'use client'

import { useState } from 'react'
import type { RSVPStatus } from '@/domain/types'
import GuestAdder from './GuestAdder'

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
  Present: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800',
  Absent: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800',
  Late: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800',
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

  async function handleRemoveGuest(guestId: string) {
    await fetch(`/api/games/${gameId}/guests/${guestId}`, { method: 'DELETE' })
    setRsvps((prev) => prev.filter((r) => r.player.id !== guestId))
  }

  function handleGuestAdded(guest: Player) {
    setRsvps((prev) => [...prev, { player: guest, status: 'Present' }])
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
      {rsvps.length > 0 && (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden mb-4">
          {rsvps.map(({ player, status }) => (
            <li key={player.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium flex items-center gap-2">
                {player.name}
                <span className="text-xs text-zinc-400 dark:text-zinc-500">{player.gender}</span>
                {player.isGuest && (
                  <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded">
                    Guest
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(player.id, s)}
                    className={`px-2 py-1 text-xs rounded border font-medium transition-colors ${
                      status === s
                        ? STATUS_COLORS[s]
                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                    }`}
                  >
                    {s}
                  </button>
                ))}
                {player.isGuest && (
                  <button
                    onClick={() => handleRemoveGuest(player.id)}
                    className="ml-2 text-xs text-red-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {rsvps.length === 0 && (
        <p className="text-zinc-400 dark:text-zinc-500 text-sm mb-4">No players on roster yet.</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving || rsvps.length === 0}
        className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-700 disabled:opacity-50"
      >
        {saving ? 'Saving…' : saved ? 'Saved' : 'Save RSVPs'}
      </button>

      <GuestAdder gameId={gameId} onGuestAdded={handleGuestAdded} />
    </div>
  )
}
