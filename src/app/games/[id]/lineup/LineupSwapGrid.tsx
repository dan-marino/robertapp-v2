'use client'

import { useState } from 'react'
import type { Violation } from '@/domain/constraintValidator'
import { ALL_POSITIONS } from '@/domain/types'

interface FieldingSlot {
  gameId: string
  inning: number
  playerId: string
  position: string
}

interface BattingSlot {
  gameId: string
  playerId: string
  orderIndex: number
  genderGroup: string
}

interface Props {
  gameId: string
  initialFieldingSlots: FieldingSlot[]
  initialBattingSlots: BattingSlot[]
  initialInnings: number[]
  playerMap: Record<string, string>
}

interface CellKey {
  inning: number
  position: string
}

export default function LineupSwapGrid({
  gameId,
  initialFieldingSlots,
  initialBattingSlots,
  initialInnings,
  playerMap,
}: Props) {
  const [fieldingSlots, setFieldingSlots] = useState(initialFieldingSlots)
  const [battingSlots] = useState(initialBattingSlots)
  const [selected, setSelected] = useState<CellKey | null>(null)
  const [violations, setViolations] = useState<Violation[]>([])
  const [pendingSwap, setPendingSwap] = useState<boolean>(false)
  const [swapError, setSwapError] = useState<string | null>(null)
  // When a swap produces error violations the user must explicitly acknowledge
  // before making further changes.
  const [awaitingAck, setAwaitingAck] = useState<boolean>(false)
  const [lastSwap, setLastSwap] = useState<{ slot1: CellKey; slot2: CellKey } | null>(null)

  const innings = initialInnings

  const gridMap = new Map<string, string>()
  for (const slot of fieldingSlots) {
    gridMap.set(`${slot.inning}:${slot.position}`, playerMap[slot.playerId] ?? slot.playerId)
  }

  const errorViolations = violations.filter((v) => v.severity === 'error')
  const warningViolations = violations.filter((v) => v.severity === 'warning')

  async function applySwap(slot1: CellKey, slot2: CellKey) {
    setPendingSwap(true)
    setSwapError(null)

    const res = await fetch(`/api/games/${gameId}/lineup/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot1, slot2 }),
    })

    setPendingSwap(false)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setSwapError(body.error ?? 'Swap failed')
      return
    }

    const { lineup, violations: newViolations } = await res.json()
    setFieldingSlots(lineup.fieldingSlots)
    setViolations(newViolations)
    setLastSwap({ slot1, slot2 })

    if (newViolations.some((v: { severity: string }) => v.severity === 'error')) {
      setAwaitingAck(true)
    }
  }

  async function handleRevertSwap() {
    if (!lastSwap) return
    await applySwap(lastSwap.slot2, lastSwap.slot1) // swap back
    setLastSwap(null)
    setAwaitingAck(false)
  }

  async function handleCellClick(inning: number, position: string) {
    if (awaitingAck) return // must acknowledge errors before continuing

    if (!selected) {
      setSelected({ inning, position })
      return
    }

    if (selected.inning === inning && selected.position === position) {
      setSelected(null)
      return
    }

    const slot1 = selected
    setSelected(null)
    await applySwap(slot1, { inning, position })
  }

  const sortedBatting = [...battingSlots].sort((a, b) => a.orderIndex - b.orderIndex)

  return (
    <div>
      {/* Violations */}
      {violations.length > 0 && (
        <div className="mb-6 space-y-2">
          {errorViolations.map((v, i) => (
            <div key={i} className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
              <span className="font-semibold shrink-0">Error</span>
              <span>{v.message}</span>
            </div>
          ))}
          {warningViolations.map((v, i) => (
            <div key={i} className="flex items-start gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
              <span className="font-semibold shrink-0">Warning</span>
              <span>{v.message}</span>
            </div>
          ))}
          {awaitingAck && (
            <div className="flex items-center gap-3 px-3 py-2 bg-red-100 border border-red-300 rounded-md text-sm text-red-900">
              <span className="font-semibold">Action required:</span>
              <span>This lineup has rule violations. Revert the last swap or acknowledge to keep it.</span>
              <button
                onClick={handleRevertSwap}
                className="ml-auto px-3 py-1 bg-white border border-red-300 rounded text-red-700 text-xs hover:bg-red-50"
              >
                Revert Swap
              </button>
              <button
                onClick={() => setAwaitingAck(false)}
                className="px-3 py-1 bg-red-700 text-white rounded text-xs hover:bg-red-800"
              >
                Keep Anyway
              </button>
            </div>
          )}
        </div>
      )}

      {swapError && (
        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
          {swapError}
        </div>
      )}

      {selected && (
        <p className="mb-3 text-xs text-zinc-500">
          Selected: <strong>{selected.position}</strong> (Inning {selected.inning}) — click another cell to swap
        </p>
      )}

      {pendingSwap && <p className="mb-3 text-xs text-zinc-400">Applying swap…</p>}

      {/* Fielding Grid */}
      <section className="mb-10">
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
          Fielding Grid
          <span className="ml-2 normal-case font-normal text-zinc-400">(click two cells to swap)</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="text-sm border-collapse w-full">
            <thead>
              <tr>
                <th className="border border-zinc-200 bg-zinc-50 px-3 py-2 text-left font-medium text-zinc-600 w-16">
                  Pos
                </th>
                {innings.map((inning) => (
                  <th
                    key={inning}
                    className="border border-zinc-200 bg-zinc-50 px-3 py-2 text-center font-medium text-zinc-600"
                  >
                    Inn {inning}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_POSITIONS.map((pos) => (
                <tr key={pos} className="even:bg-zinc-50/50">
                  <td className="border border-zinc-200 px-3 py-2 font-medium text-zinc-700">
                    {pos}
                  </td>
                  {innings.map((inning) => {
                    const cellName = gridMap.get(`${inning}:${pos}`)
                    const isSelected = selected?.inning === inning && selected?.position === pos
                    const isEmpty = !cellName

                    return (
                      <td
                        key={inning}
                        onClick={() => !isEmpty && handleCellClick(inning, pos)}
                        className={`border border-zinc-200 px-3 py-2 text-center transition-colors ${
                          isEmpty
                            ? 'text-zinc-300 cursor-default'
                            : isSelected
                            ? 'bg-blue-100 text-blue-800 cursor-pointer ring-2 ring-blue-400 ring-inset'
                            : 'text-zinc-800 cursor-pointer hover:bg-zinc-100'
                        }`}
                      >
                        {cellName ?? '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Batting Order */}
      <section>
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
          Batting Order
        </h2>
        <ol className="space-y-1">
          {sortedBatting.map(({ playerId, orderIndex }) => (
            <li key={playerId} className="flex items-center gap-3">
              <span className="text-sm text-zinc-400 w-6 text-right">{orderIndex}.</span>
              <span className="text-sm font-medium text-zinc-800">
                {playerMap[playerId] ?? playerId}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
