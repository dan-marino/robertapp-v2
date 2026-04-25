'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ReshuffleButton({ gameId }: { gameId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleReshuffle() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/games/${gameId}/lineup/reshuffle`, { method: 'POST' })
    setLoading(false)
    if (res.ok) {
      router.refresh()
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Reshuffle failed')
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleReshuffle}
        disabled={loading}
        className="px-4 py-2 bg-zinc-100 text-zinc-800 text-sm rounded-md border border-zinc-300 hover:bg-zinc-200 disabled:opacity-50"
      >
        {loading ? 'Reshuffling…' : 'Reshuffle'}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
