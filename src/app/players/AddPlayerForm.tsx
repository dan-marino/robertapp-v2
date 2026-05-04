'use client'

import { useState } from 'react'
import { ALL_POSITIONS } from '@/domain/types'
import type { Position, PreferenceTier } from '@/domain/types'

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

const TIERS: (PreferenceTier | '')[] = ['', 'Tier1', 'Tier2', 'Tier3', 'Anti']

const TIER_LABELS: Record<PreferenceTier | '', string> = {
  '': '—',
  Tier1: 'T1',
  Tier2: 'T2',
  Tier3: 'T3',
  Anti: 'Anti',
}

const TIER_COLORS: Record<PreferenceTier | '', string> = {
  '': 'bg-zinc-100 text-zinc-400',
  Tier1: 'bg-green-100 text-green-800',
  Tier2: 'bg-blue-100 text-blue-800',
  Tier3: 'bg-yellow-100 text-yellow-800',
  Anti: 'bg-red-100 text-red-700',
}

function buildEmptyMap() {
  const map = new Map<Position, PreferenceTier | ''>()
  for (const pos of ALL_POSITIONS) map.set(pos, '')
  return map
}

export default function AddPlayerForm({ onAdd }: Props) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'M' | 'F'>('M')
  const [adding, setAdding] = useState(false)
  const [showPrefs, setShowPrefs] = useState(false)
  const [tierMap, setTierMap] = useState(buildEmptyMap)

  function cycleNext(pos: Position) {
    const current = tierMap.get(pos) ?? ''
    const idx = TIERS.indexOf(current)
    const next = TIERS[(idx + 1) % TIERS.length]
    setTierMap((prev) => new Map(prev).set(pos, next))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)

    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, gender }),
    })
    const player: Player = await res.json()

    const prefs = ALL_POSITIONS.flatMap((pos) => {
      const tier = tierMap.get(pos)
      return tier ? [{ position: pos, tier }] : []
    })

    if (prefs.length > 0) {
      await fetch(`/api/players/${player.id}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })
    }

    onAdd(player)
    setName('')
    setGender('M')
    setTierMap(buildEmptyMap())
    setShowPrefs(false)
    setAdding(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex gap-3 items-end mb-3">
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
      </div>

      <button
        type="button"
        onClick={() => setShowPrefs((v) => !v)}
        className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors mb-3"
      >
        {showPrefs ? '▲ Hide preferences' : '▼ Add preferences'}
      </button>

      {showPrefs && (
        <div>
          <p className="text-xs text-zinc-400 mb-2">Click a position to cycle its tier.</p>
          <div className="grid grid-cols-5 gap-2">
            {ALL_POSITIONS.map((pos) => {
              const tier = tierMap.get(pos) ?? ''
              return (
                <button
                  key={pos}
                  type="button"
                  onClick={() => cycleNext(pos)}
                  className={`rounded-md px-3 py-2 text-xs font-medium flex flex-col items-center gap-1 border border-transparent hover:border-zinc-300 transition-colors ${TIER_COLORS[tier]}`}
                >
                  <span className="font-semibold">{pos}</span>
                  <span>{TIER_LABELS[tier]}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </form>
  )
}
