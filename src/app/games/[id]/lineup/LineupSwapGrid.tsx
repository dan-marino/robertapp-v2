'use client'

import { useState } from 'react'
import type { Violation } from '@/domain/constraintValidator'

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

interface PlayerInfo {
  name: string
  gender: 'M' | 'F'
}

interface Props {
  gameId: string
  mode: 'Unified' | 'Split'
  initialFieldingSlots: FieldingSlot[]
  initialBattingSlots: BattingSlot[]
  initialInnings: number[]
  playerMap: Record<string, PlayerInfo>
}

function PositionBadge({
  position,
  isSelected,
  isEmpty,
  onClick,
}: {
  position: string | null
  isSelected: boolean
  isEmpty: boolean
  onClick: () => void
}) {
  if (isEmpty) {
    return (
      <button
        onClick={onClick}
        className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs transition-colors ${
          isSelected
            ? 'text-zinc-500 dark:text-zinc-400 ring-2 ring-blue-400'
            : 'text-zinc-300 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-500 dark:hover:text-zinc-400'
        }`}
      >
        –
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
        isSelected
          ? 'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 ring-2 ring-blue-400'
          : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
      }`}
    >
      {position}
    </button>
  )
}

export default function LineupSwapGrid({
  gameId,
  mode,
  initialFieldingSlots,
  initialBattingSlots,
  initialInnings,
  playerMap,
}: Props) {
  const [fieldingSlots, setFieldingSlots] = useState(initialFieldingSlots)
  const [battingSlots, setBattingSlots] = useState(initialBattingSlots)
  const [selectedSlot, setSelectedSlot] = useState<{ inning: number; playerId: string } | null>(null)
  const [violations, setViolations] = useState<Violation[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [draggedPlayer, setDraggedPlayer] = useState<{ playerId: string; group: string } | null>(null)
  const [dragOverPlayerId, setDragOverPlayerId] = useState<string | null>(null)

  const innings = initialInnings
  const errorViolations = violations.filter((v) => v.severity === 'error')
  const warningViolations = violations.filter((v) => v.severity === 'warning')

  const playerFieldingMap = new Map<string, Map<number, string>>()
  for (const slot of fieldingSlots) {
    if (!playerFieldingMap.has(slot.playerId)) {
      playerFieldingMap.set(slot.playerId, new Map())
    }
    playerFieldingMap.get(slot.playerId)!.set(slot.inning, slot.position)
  }

  async function handleSwap(
    slot1: { inning: number; playerId: string },
    slot2: { inning: number; playerId: string }
  ) {
    setSaveError(null)
    const res = await fetch(`/api/games/${gameId}/lineup/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot1, slot2 }),
    })
    setSaving(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setSaveError(body.error ?? 'Swap failed')
      return
    }
    const { lineup, violations: newViolations } = await res.json()
    setFieldingSlots(lineup.fieldingSlots)
    setViolations(newViolations)
  }

  function handleCellClick(inning: number, playerId: string) {
    if (saving) return

    if (selectedSlot?.playerId === playerId && selectedSlot?.inning === inning) {
      // Same cell clicked again — deselect
      setSelectedSlot(null)
    } else if (selectedSlot !== null && selectedSlot.inning === inning) {
      // Same inning, different player — swap and clear selection
      const first = selectedSlot
      setSelectedSlot(null)
      setSaving(true)
      handleSwap(first, { inning, playerId })
    } else {
      // No selection, or different inning — select this cell
      setSelectedSlot({ inning, playerId })
    }
  }

  async function handleBattingReorder(group: string, orderedPlayerIds: string[]) {
    setBattingSlots((prev) => {
      const updated = [...prev]
      orderedPlayerIds.forEach((pid, idx) => {
        const slot = updated.find((s) => s.playerId === pid && s.genderGroup === group)
        if (slot) slot.orderIndex = idx + 1
      })
      return updated
    })
    await fetch(`/api/games/${gameId}/lineup/batting-order`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ genderGroup: group, playerIds: orderedPlayerIds }),
    })
  }

  function handleDragStart(playerId: string, group: string) {
    setDraggedPlayer({ playerId, group })
  }

  function handleDragOver(e: React.DragEvent, playerId: string) {
    e.preventDefault()
    setDragOverPlayerId(playerId)
  }

  function handleDrop(targetPlayerId: string, group: string, orderedRows: { playerId: string }[]) {
    if (!draggedPlayer || draggedPlayer.group !== group) return
    const ids = orderedRows.map((r) => r.playerId)
    const fromIdx = ids.indexOf(draggedPlayer.playerId)
    const toIdx = ids.indexOf(targetPlayerId)
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return
    const reordered = [...ids]
    reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, draggedPlayer.playerId)
    handleBattingReorder(group, reordered)
    setDraggedPlayer(null)
    setDragOverPlayerId(null)
  }

  function handleDragEnd() {
    setDraggedPlayer(null)
    setDragOverPlayerId(null)
  }

  const allBatting = battingSlots.map((s) => ({
    playerId: s.playerId,
    batOrder: s.orderIndex,
    gender: playerMap[s.playerId]?.gender ?? ('M' as 'M' | 'F'),
  }))

  const unifiedRows = [...allBatting].sort((a, b) => a.batOrder - b.batOrder)
  const mRows = allBatting.filter((r) => r.gender === 'M').sort((a, b) => a.batOrder - b.batOrder)
  const fRows = allBatting.filter((r) => r.gender === 'F').sort((a, b) => a.batOrder - b.batOrder)

  function renderRow(
    row: { playerId: string; batOrder: number; gender: 'M' | 'F' },
    isFemale: boolean,
    group: string,
    orderedRows: { playerId: string }[]
  ) {
    const playerInfo = playerMap[row.playerId]
    const isDragging = draggedPlayer?.playerId === row.playerId
    const isDragOver = dragOverPlayerId === row.playerId && draggedPlayer?.group === group
    return (
      <tr
        key={row.playerId}
        draggable
        onDragStart={() => handleDragStart(row.playerId, group)}
        onDragOver={(e) => handleDragOver(e, row.playerId)}
        onDrop={() => handleDrop(row.playerId, group, orderedRows)}
        onDragEnd={handleDragEnd}
        className={[
          isFemale && mode === 'Unified' ? 'bg-pink-50 dark:bg-pink-950/30' : '',
          isDragging ? 'opacity-40' : '',
          isDragOver ? 'border-t-2 border-blue-400' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <td className="py-2.5 pl-1 pr-2 text-zinc-300 dark:text-zinc-500 cursor-grab select-none text-sm">
          ⠿
        </td>
        <td className="py-2.5 pr-4 text-sm font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
          {playerInfo?.name ?? row.playerId}
        </td>
        <td className="py-2.5 px-3 text-sm text-zinc-400 dark:text-zinc-500 text-right tabular-nums">
          {row.batOrder}
        </td>
        {innings.map((inning) => {
          const pos = playerFieldingMap.get(row.playerId)?.get(inning) ?? null
          const isSelected =
            selectedSlot?.inning === inning && selectedSlot?.playerId === row.playerId
          return (
            <td key={inning} className="py-2.5 px-2 text-center">
              <PositionBadge
                position={pos}
                isSelected={isSelected}
                isEmpty={pos === null}
                onClick={() => handleCellClick(inning, row.playerId)}
              />
            </td>
          )
        })}
      </tr>
    )
  }

  const tableHeader = (
    <tr className="border-b border-zinc-100 dark:border-zinc-800">
      <th className="py-2 pl-1 pr-2 w-5" />
      <th className="py-2 pr-4 text-left text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
        Name
      </th>
      <th className="py-2 px-3 text-right text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
        Bat
      </th>
      {innings.map((inning) => (
        <th
          key={inning}
          className="py-2 px-2 text-center text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide w-14"
        >
          {inning}
        </th>
      ))}
    </tr>
  )

  return (
    <div>
      {violations.length > 0 && (
        <div className="mb-6 space-y-2">
          {errorViolations.map((v, i) => (
            <div
              key={i}
              className="flex items-start gap-2 px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-md text-sm text-red-800 dark:text-red-300"
            >
              <span className="font-semibold shrink-0">Error</span>
              <span>{v.message}</span>
            </div>
          ))}
          {warningViolations.map((v, i) => (
            <div
              key={i}
              className="flex items-start gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-900 rounded-md text-sm text-yellow-800 dark:text-yellow-300"
            >
              <span className="font-semibold shrink-0">Warning</span>
              <span>{v.message}</span>
            </div>
          ))}
        </div>
      )}

      {saveError && (
        <div className="mb-4 px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-md text-sm text-red-800 dark:text-red-300">
          {saveError}
        </div>
      )}

      {saving && (
        <div className="mb-4 text-xs text-zinc-400 dark:text-zinc-500">Saving…</div>
      )}

      <div className="overflow-x-auto mb-6">
        {mode === 'Unified' ? (
          <table className="w-full text-sm border-collapse">
            <thead>{tableHeader}</thead>
            <tbody>
              {unifiedRows.map((row) => renderRow(row, row.gender === 'F', 'All', unifiedRows))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>{tableHeader}</thead>
            <tbody>
              <tr>
                <td
                  colSpan={3 + innings.length}
                  className="pt-3 pb-1 pl-1 text-sm font-semibold text-blue-600 dark:text-blue-400"
                >
                  GUYS ({mRows.length})
                </td>
              </tr>
              {mRows.map((row) => renderRow(row, false, 'M', mRows))}
              <tr>
                <td
                  colSpan={3 + innings.length}
                  className="pt-4 pb-1 pl-1 text-sm font-semibold text-pink-500 dark:text-pink-400"
                >
                  GIRLS ({fRows.length})
                </td>
              </tr>
              {fRows.map((row) => renderRow(row, false, 'F', fRows))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
