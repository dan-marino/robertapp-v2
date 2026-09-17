'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface RemovedPlayer {
  id: string
  name: string
}

interface ConfirmState {
  removedWithSlots: RemovedPlayer[]
  removedWithStats: RemovedPlayer[]
}

export default function SyncButton({ gameId }: { gameId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmState | null>(null)

  async function doSync(confirm: boolean) {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/games/${gameId}/lineup/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm }),
    })
    setLoading(false)

    if (res.status === 409) {
      const body = await res.json().catch(() => ({}))
      if (body.needsConfirmation) {
        setPendingConfirm({
          removedWithSlots: body.removedWithSlots ?? [],
          removedWithStats: body.removedWithStats ?? [],
        })
      } else {
        setError('Unexpected conflict')
      }
      return
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Sync failed')
      return
    }

    router.refresh()
  }

  function handleSync() {
    doSync(false)
  }

  function handleConfirm() {
    setPendingConfirm(null)
    doSync(true)
  }

  function handleCancel() {
    setPendingConfirm(null)
  }

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={handleSync}
          disabled={loading}
          className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading ? 'Syncing…' : 'Sync RSVPs'}
        </button>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      {pendingConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Remove players with recorded data?
            </h2>
            {pendingConfirm.removedWithSlots.length > 0 && (
              <>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                  The following players are still assigned to innings. Their fielding slots will be lost.
                </p>
                <ul className="mb-4 space-y-1">
                  {pendingConfirm.removedWithSlots.map((p) => (
                    <li key={p.id} className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {p.name}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {pendingConfirm.removedWithStats.length > 0 && (
              <>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                  The following players have recorded stats that will be permanently deleted.
                </p>
                <ul className="mb-4 space-y-1">
                  {pendingConfirm.removedWithStats.map((p) => (
                    <li key={p.id} className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {p.name}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Remove anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
