'use client'

import { useState } from 'react'
import { ALL_POSITIONS } from '@/domain/types'
import type { Position, PreferenceTier } from '@/domain/types'

interface PrefRow {
  playerId: string
  position: Position
  tier: PreferenceTier
}

interface Props {
  playerId: string
  initialPrefs: PrefRow[]
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

function buildMap(prefs: PrefRow[]): Map<Position, PreferenceTier | ''> {
  const map = new Map<Position, PreferenceTier | ''>()
  for (const pos of ALL_POSITIONS) map.set(pos, '')
  for (const pref of prefs) map.set(pref.position, pref.tier)
  return map
}

export default function PreferencesEditor({ playerId, initialPrefs }: Props) {
  const [tierMap, setTierMap] = useState(() => buildMap(initialPrefs))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function cycleNext(pos: Position) {
    const current = tierMap.get(pos) ?? ''
    const idx = TIERS.indexOf(current)
    const next = TIERS[(idx + 1) % TIERS.length]
    setTierMap((prev) => new Map(prev).set(pos, next))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    const body = ALL_POSITIONS.flatMap((pos) => {
      const tier = tierMap.get(pos)
      return tier ? [{ position: pos, tier }] : []
    })
    await fetch(`/api/players/${playerId}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    setSaved(true)
  }

  return (
    <div>
      <p className="text-xs text-zinc-400 mb-3">Click a position to cycle its tier.</p>
      <div className="grid grid-cols-5 gap-2 mb-4">
        {ALL_POSITIONS.map((pos) => {
          const tier = tierMap.get(pos) ?? ''
          return (
            <button
              key={pos}
              onClick={() => cycleNext(pos)}
              className={`rounded-md px-3 py-2 text-xs font-medium flex flex-col items-center gap-1 border border-transparent hover:border-zinc-300 transition-colors ${TIER_COLORS[tier]}`}
            >
              <span className="font-semibold">{pos}</span>
              <span>{TIER_LABELS[tier]}</span>
            </button>
          )
        })}
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-700 disabled:opacity-50"
      >
        {saving ? 'Saving…' : saved ? 'Saved' : 'Save preferences'}
      </button>
    </div>
  )
}
