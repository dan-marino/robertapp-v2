'use client'

import { useEffect, useState } from 'react'
import { parsePA } from '@/domain/paParser'
import { computeDerivedStats } from '@/domain/gameStats'
import type { PACounts } from '@/domain/paParser'

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

interface RowDraft {
  playerId: string
  paString: string
  paErrors: string[]
  rbi: number
  r: number
}

/** Canonical token order for re-edit reconstruction */
const CANONICAL_TOKENS: Array<{ token: string; key: keyof PACounts }> = [
  { token: '1B', key: 's1b' },
  { token: '2B', key: 's2b' },
  { token: '3B', key: 's3b' },
  { token: 'HR', key: 'hr' },
  { token: 'BB', key: 'bb' },
  { token: 'K', key: 'k' },
  { token: 'FO', key: 'fo' },
  { token: 'FC', key: 'fc' },
  { token: 'GO', key: 'go' },
  { token: 'SF', key: 'sf' },
]

function countsToPA(row: PlayerStatRow): string {
  const tokens: string[] = []
  for (const { token, key } of CANONICAL_TOKENS) {
    const count = row[key as keyof PlayerStatRow] as number
    for (let i = 0; i < count; i++) {
      tokens.push(token)
    }
  }
  return tokens.join(' ')
}

function rowToInitialDraft(row: PlayerStatRow): RowDraft {
  return {
    playerId: row.playerId,
    paString: countsToPA(row),
    paErrors: [],
    rbi: row.rbi,
    r: row.r,
  }
}

function fmtRate(value: number | null): string {
  if (value === null) return '—'
  return value.toFixed(3).replace(/^0/, '')
}

export default function StatsTab({ gameId }: Props) {
  const [rows, setRows] = useState<PlayerStatRow[] | null>(null)
  const [drafts, setDrafts] = useState<RowDraft[]>([])
  const [error, setError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/games/${gameId}/stats`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load stats')
        return res.json() as Promise<PlayerStatRow[]>
      })
      .then((data) => {
        setRows(data)
        setDrafts(data.map(rowToInitialDraft))
      })
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

  function updateDraft(playerId: string, patch: Partial<RowDraft>) {
    setDrafts((prev) =>
      prev.map((d) => (d.playerId === playerId ? { ...d, ...patch } : d))
    )
  }

  function handlePAChange(playerId: string, value: string) {
    const { errors } = parsePA(value)
    updateDraft(playerId, { paString: value, paErrors: errors })
  }

  function handleRBIChange(playerId: string, value: string) {
    const parsed = parseInt(value, 10)
    updateDraft(playerId, { rbi: isNaN(parsed) || parsed < 0 ? 0 : parsed })
  }

  function handleRChange(playerId: string, value: string) {
    const parsed = parseInt(value, 10)
    updateDraft(playerId, { r: isNaN(parsed) || parsed < 0 ? 0 : parsed })
  }

  const hasAnyError = drafts.some((d) => d.paErrors.length > 0)

  async function handleSave() {
    if (hasAnyError || saving) return
    setSaving(true)
    setSaveError(null)

    const stats = drafts.map((d) => {
      const { counts } = parsePA(d.paString)
      return {
        playerId: d.playerId,
        s1b: counts.s1b,
        s2b: counts.s2b,
        s3b: counts.s3b,
        hr: counts.hr,
        bb: counts.bb,
        k: counts.k,
        fo: counts.fo,
        fc: counts.fc,
        go: counts.go,
        sf: counts.sf,
        rbi: d.rbi,
        r: d.r,
      }
    })

    try {
      const res = await fetch(`/api/games/${gameId}/stats`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats }),
      })

      if (!res.ok) {
        const body = (await res.json()) as { error?: string }
        setSaveError(body.error ?? 'Save failed')
        return
      }

      // PUT returns only saved rows (may not include all active players)
      // Re-fetch GET to get the full active roster with updated data
      const getRes = await fetch(`/api/games/${gameId}/stats`)
      if (!getRes.ok) throw new Error('Failed to reload stats')
      const updated = (await getRes.json()) as PlayerStatRow[]
      setRows(updated)
      setDrafts(updated.map(rowToInitialDraft))
    } catch {
      setSaveError('Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="text-left py-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                Player
              </th>
              <th className="text-left py-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap min-w-[220px]">
                PA String
              </th>
              <th className="text-right py-2 px-2 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                RBI
              </th>
              <th className="text-right py-2 px-2 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                R
              </th>
              <th className="text-right py-2 px-2 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                AB
              </th>
              <th className="text-right py-2 px-2 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                H
              </th>
              <th className="text-right py-2 px-2 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                1B
              </th>
              <th className="text-right py-2 px-2 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                2B
              </th>
              <th className="text-right py-2 px-2 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                3B
              </th>
              <th className="text-right py-2 px-2 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                HR
              </th>
              <th className="text-right py-2 px-2 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                BB
              </th>
              <th className="text-right py-2 px-2 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                K
              </th>
              <th className="text-right py-2 px-2 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                SF
              </th>
              <th className="text-right py-2 px-2 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                BA
              </th>
              <th className="text-right py-2 px-2 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                OBP
              </th>
              <th className="text-right py-2 px-2 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                SLG
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((row) => {
              const draft = drafts.find((d) => d.playerId === row.playerId)
              if (!draft) return null

              const { counts: liveCounts, errors: liveErrors } = parsePA(draft.paString)
              const hasErrors = liveErrors.length > 0
              const liveDerived = hasErrors ? null : computeDerivedStats({
                ...liveCounts,
                rbi: draft.rbi,
                r: draft.r,
              })

              return (
                <tr key={row.playerId}>
                  <td className="py-2 pr-4 font-medium whitespace-nowrap align-top pt-3">
                    {row.name}
                    {row.isGuest && (
                      <span className="ml-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded">
                        Guest
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-4 align-top">
                    <input
                      type="text"
                      value={draft.paString}
                      onChange={(e) => handlePAChange(row.playerId, e.target.value)}
                      placeholder="e.g. 1B GO BB HR"
                      className={[
                        'w-full rounded border px-2 py-1 text-sm font-mono bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100',
                        hasErrors
                          ? 'border-red-400 dark:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-400'
                          : 'border-zinc-300 dark:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400',
                      ].join(' ')}
                    />
                    {hasErrors && (
                      <ul className="mt-1 space-y-0.5">
                        {liveErrors.map((err, i) => (
                          <li key={i} className="text-xs text-red-500 dark:text-red-400">
                            {err}
                          </li>
                        ))}
                      </ul>
                    )}
                    {!hasErrors && draft.paString.trim() !== '' && liveDerived && (
                      <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                        AB {liveDerived.ab} · H {liveDerived.h} · 1B {liveCounts.s1b} · 2B {liveCounts.s2b} · 3B {liveCounts.s3b} · HR {liveCounts.hr} · BB {liveCounts.bb} · K {liveCounts.k} · SF {liveCounts.sf}
                      </p>
                    )}
                  </td>
                  <td className="py-2 px-2 align-top">
                    <input
                      type="number"
                      min={0}
                      value={draft.rbi}
                      onChange={(e) => handleRBIChange(row.playerId, e.target.value)}
                      className="w-16 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-2 py-1 text-sm text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    />
                  </td>
                  <td className="py-2 px-2 align-top">
                    <input
                      type="number"
                      min={0}
                      value={draft.r}
                      onChange={(e) => handleRChange(row.playerId, e.target.value)}
                      className="w-16 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-2 py-1 text-sm text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    />
                  </td>
                  <td className="text-right py-2 px-2 tabular-nums align-top pt-3">
                    {hasErrors ? '—' : liveDerived?.ab ?? 0}
                  </td>
                  <td className="text-right py-2 px-2 tabular-nums align-top pt-3">
                    {hasErrors ? '—' : liveDerived?.h ?? 0}
                  </td>
                  <td className="text-right py-2 px-2 tabular-nums align-top pt-3">
                    {hasErrors ? '—' : liveCounts.s1b}
                  </td>
                  <td className="text-right py-2 px-2 tabular-nums align-top pt-3">
                    {hasErrors ? '—' : liveCounts.s2b}
                  </td>
                  <td className="text-right py-2 px-2 tabular-nums align-top pt-3">
                    {hasErrors ? '—' : liveCounts.s3b}
                  </td>
                  <td className="text-right py-2 px-2 tabular-nums align-top pt-3">
                    {hasErrors ? '—' : liveCounts.hr}
                  </td>
                  <td className="text-right py-2 px-2 tabular-nums align-top pt-3">
                    {hasErrors ? '—' : liveCounts.bb}
                  </td>
                  <td className="text-right py-2 px-2 tabular-nums align-top pt-3">
                    {hasErrors ? '—' : liveCounts.k}
                  </td>
                  <td className="text-right py-2 px-2 tabular-nums align-top pt-3">
                    {hasErrors ? '—' : liveCounts.sf}
                  </td>
                  <td className="text-right py-2 px-2 tabular-nums text-zinc-500 dark:text-zinc-400 align-top pt-3">
                    {hasErrors ? '—' : fmtRate(liveDerived?.ba ?? null)}
                  </td>
                  <td className="text-right py-2 px-2 tabular-nums text-zinc-500 dark:text-zinc-400 align-top pt-3">
                    {hasErrors ? '—' : fmtRate(liveDerived?.obp ?? null)}
                  </td>
                  <td className="text-right py-2 px-2 tabular-nums text-zinc-500 dark:text-zinc-400 align-top pt-3">
                    {hasErrors ? '—' : fmtRate(liveDerived?.slg ?? null)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={hasAnyError || saving}
          className={[
            'rounded px-4 py-2 text-sm font-medium transition-colors',
            hasAnyError || saving
              ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
              : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300',
          ].join(' ')}
        >
          {saving ? 'Saving…' : 'Save Stats'}
        </button>
        {saveError && (
          <p className="text-sm text-red-500 dark:text-red-400">{saveError}</p>
        )}
        {hasAnyError && (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Fix PA string errors before saving.
          </p>
        )}
      </div>
    </div>
  )
}
