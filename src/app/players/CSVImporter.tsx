'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CSVImporter() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: string[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const csv = await file.text()
      const res = await fetch('/api/players/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Import failed')
        return
      }

      const data = await res.json()
      setResult(data)
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
      // Reset the file input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="border border-zinc-200 rounded-lg px-4 py-4">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">
        Bulk Import via CSV
      </p>

      <label className="inline-flex items-center gap-2 cursor-pointer">
        <span className="px-3 py-1.5 bg-zinc-100 text-zinc-700 text-sm rounded-md hover:bg-zinc-200 transition-colors">
          {loading ? 'Importing…' : 'Choose CSV file'}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="sr-only"
          disabled={loading}
          onChange={handleFileChange}
        />
      </label>

      {result && (
        <div className="mt-3 text-sm">
          <p className="text-green-700 font-medium">
            Imported {result.imported} player{result.imported !== 1 ? 's' : ''}
          </p>
          {result.skipped.length > 0 && (
            <div className="mt-1">
              <p className="text-zinc-500">
                Skipped ({result.skipped.length}):
              </p>
              <ul className="list-disc list-inside text-zinc-400 text-xs mt-0.5">
                {result.skipped.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
