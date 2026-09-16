'use client'

import { useEffect, useState } from 'react'

interface PlayerStatRow {
  playerId: string
  name: string
  isGuest: boolean
  // counting
  s1b: number
  s2b: number
  s3b: number
  hr: number
  bb: number
  k: number
  fo: number
  fc: number
  go: number
  sf: number
  rbi: number
  r: number
  // derived
  ab: number
  h: number
  tb: number
  ba: number | null
  obp: number | null
  slg: number | null
}

interface Props {
  gameId: string
}

function fmtRate(value: number | null): string {
  if (value === null) return '—'
  return value.toFixed(3).replace(/^0/, '')
}

export default function StatsTab({ gameId }: Props) {
  const [rows, setRows] = useState<PlayerStatRow[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`/api/games/${gameId}/stats`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load stats')
        return res.json() as Promise<PlayerStatRow[]>
      })
      .then(setRows)
      .catch(() => setError(true))
  }, [gameId])

  if (error) {
    return <p className="text-sm text-red-500">Failed to load stats.</p>
  }

  if (rows === null) {
    return <p className="text-sm text-zinc-400 dark:text-zinc-500">Loading…</p>
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-zinc-400 dark:text-zinc-500">
        No active players found for this game.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-700">
            <th className="text-left py-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
              Player
            </th>
            {['AB', 'H', '1B', '2B', '3B', 'HR', 'BB', 'K', 'SF', 'RBI', 'R'].map((col) => (
              <th
                key={col}
                className="text-right py-2 px-2 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap"
              >
                {col}
              </th>
            ))}
            {['BA', 'OBP', 'SLG'].map((col) => (
              <th
                key={col}
                className="text-right py-2 px-2 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((row) => (
            <tr key={row.playerId}>
              <td className="py-2 pr-4 font-medium whitespace-nowrap">
                {row.name}
                {row.isGuest && (
                  <span className="ml-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded">
                    Guest
                  </span>
                )}
              </td>
              <td className="text-right py-2 px-2 tabular-nums">{row.ab}</td>
              <td className="text-right py-2 px-2 tabular-nums">{row.h}</td>
              <td className="text-right py-2 px-2 tabular-nums">{row.s1b}</td>
              <td className="text-right py-2 px-2 tabular-nums">{row.s2b}</td>
              <td className="text-right py-2 px-2 tabular-nums">{row.s3b}</td>
              <td className="text-right py-2 px-2 tabular-nums">{row.hr}</td>
              <td className="text-right py-2 px-2 tabular-nums">{row.bb}</td>
              <td className="text-right py-2 px-2 tabular-nums">{row.k}</td>
              <td className="text-right py-2 px-2 tabular-nums">{row.sf}</td>
              <td className="text-right py-2 px-2 tabular-nums">{row.rbi}</td>
              <td className="text-right py-2 px-2 tabular-nums">{row.r}</td>
              <td className="text-right py-2 px-2 tabular-nums text-zinc-500 dark:text-zinc-400">
                {fmtRate(row.ba)}
              </td>
              <td className="text-right py-2 px-2 tabular-nums text-zinc-500 dark:text-zinc-400">
                {fmtRate(row.obp)}
              </td>
              <td className="text-right py-2 px-2 tabular-nums text-zinc-500 dark:text-zinc-400">
                {fmtRate(row.slg)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
