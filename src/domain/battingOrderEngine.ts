import type { Player, BattingHistory } from './types'

export interface UnifiedBattingParams {
  activePlayers: Player[]
  latePlayerIds: string[]
  battingHistory: BattingHistory[]
}

export interface BattingOrderEntry {
  playerId: string
  orderIndex: number
}

// ─── Slot layout ──────────────────────────────────────────────────────────────

/**
 * Compute 1-based slot positions reserved for women.
 *
 * Invariants:
 *  - No woman in slot 1 or 2
 *  - At most 3 men between consecutive women (including wrap-around)
 *  - Women spread as evenly as possible through [3..N-1]
 */
function computeWomenSlots(womenCount: number, totalCount: number): number[] {
  if (womenCount === 0) return []
  if (womenCount === 1) return [3]

  const first = 3
  // last must be ≥ totalCount-1 so the wrap-around gap (men after last woman +
  // slots 1 and 2) stays ≤ 3. Also must be far enough to hold all women.
  const last = Math.max(totalCount - 1, first + womenCount - 1)

  const slots: number[] = []
  for (let i = 0; i < womenCount; i++) {
    slots.push(Math.round(first + (last - first) * i / (womenCount - 1)))
  }

  // Deduplicate with forward nudge (can occur due to rounding)
  const seen = new Set<number>()
  const deduped: number[] = []
  for (const s of slots) {
    let pos = s
    while (seen.has(pos)) pos++
    seen.add(pos)
    deduped.push(Math.min(pos, totalCount))
  }

  return deduped
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

/**
 * Lower score → earlier in batting order.
 *
 * Rotation:  a player who batted late last game (high orderIndex) earns a low
 *            rotation score → bats early next game.
 * Late rule: late players receive a large penalty → always placed near the end
 *            of their gender group.
 */
function battingScore(
  playerId: string,
  isLate: boolean,
  history: BattingHistory[],
  totalCount: number
): number {
  const LATE_PENALTY = totalCount * 100

  const relevant = history
    .filter((h) => h.playerId === playerId && h.genderGroup === 'All')
    .sort((a, b) => b.gameId.localeCompare(a.gameId)) // most recent first

  const lastIndex = relevant.length > 0
    ? relevant[0].orderIndex
    : Math.ceil(totalCount / 2) // neutral default when no history

  // Invert: high lastIndex → low rotationScore → bats earlier this game
  const rotationScore = totalCount + 1 - lastIndex

  return (isLate ? LATE_PENALTY : 0) + rotationScore
}

// ─── Main engine ─────────────────────────────────────────────────────────────

export function generateUnifiedBattingOrder({
  activePlayers,
  latePlayerIds,
  battingHistory,
}: UnifiedBattingParams): BattingOrderEntry[] {
  const N = activePlayers.length
  const lateSet = new Set(latePlayerIds)

  const women = activePlayers.filter((p) => p.gender === 'F')
  const men = activePlayers.filter((p) => p.gender === 'M')

  // Determine which slots belong to women vs men
  const womenSlots = computeWomenSlots(women.length, N)
  const womenSlotSet = new Set(womenSlots)
  const menSlots = Array.from({ length: N }, (_, i) => i + 1).filter(
    (s) => !womenSlotSet.has(s)
  )

  const score = (p: Player) => battingScore(p.id, lateSet.has(p.id), battingHistory, N)

  // Sort each group ascending by score (lower score = earlier slot)
  const sortedWomen = [...women].sort((a, b) => score(a) - score(b))
  const sortedMen = [...men].sort((a, b) => score(a) - score(b))

  const result: BattingOrderEntry[] = []

  for (let i = 0; i < sortedWomen.length; i++) {
    result.push({ playerId: sortedWomen[i].id, orderIndex: womenSlots[i] })
  }
  for (let i = 0; i < sortedMen.length; i++) {
    result.push({ playerId: sortedMen[i].id, orderIndex: menSlots[i] })
  }

  return result.sort((a, b) => a.orderIndex - b.orderIndex)
}
