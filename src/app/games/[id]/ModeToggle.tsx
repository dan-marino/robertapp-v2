'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  gameId: string
  initialMode: 'Unified' | 'Split'
}

export default function ModeToggle({ gameId, initialMode }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<'Unified' | 'Split'>(initialMode)
  const [saving, setSaving] = useState(false)

  async function handleToggle(newMode: 'Unified' | 'Split') {
    if (newMode === mode) return
    setSaving(true)
    const res = await fetch(`/api/games/${gameId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: newMode }),
    })
    setSaving(false)
    if (res.ok) {
      setMode(newMode)
      router.refresh()
    }
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      <span className="text-zinc-500 mr-2">Mode</span>
      {(['Unified', 'Split'] as const).map((m) => (
        <button
          key={m}
          onClick={() => handleToggle(m)}
          disabled={saving}
          className={`px-3 py-1 rounded-md border text-sm transition-colors ${
            mode === m
              ? 'bg-zinc-900 text-white border-zinc-900'
              : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-500'
          } disabled:opacity-50`}
        >
          {m}
        </button>
      ))}
    </div>
  )
}
