'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function GenerateLineupButton({ gameId }: { gameId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/games/${gameId}/lineup/generate`, { method: 'POST' })
    setLoading(false)
    if (res.ok) {
      router.refresh()
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Failed to generate lineup')
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-700 disabled:opacity-50"
      >
        {loading ? 'Generating…' : 'Generate Lineup'}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
