import type { Player, BattingHistory, GenderGroup } from './types'

export interface SplitBattingParams {
  activePlayers: Player[]
  latePlayerIds: string[]
  battingHistory: BattingHistory[]
}

export interface BattingOrderEntry {
  playerId: string
  orderIndex: number
}

// ─── Scoring (mirrors unified mode, but scoped to gender-specific history) ───

function battingScore(
  playerId: string,
  isLate: boolean,
  history: BattingHistory[],
  genderGroup: GenderGroup,
  groupSize: number
): number {
  const LATE_PENALTY = groupSize * 100

  const relevant = history
    .filter((h) => h.playerId === playerId && h.genderGroup === genderGroup)
    .sort((a, b) => b.gameId.localeCompare(a.gameId))

  const lastIndex = relevant.length > 0
    ? relevant[0].orderIndex
    : Math.ceil(groupSize / 2)

  const rotationScore = groupSize + 1 - lastIndex

  return (isLate ? LATE_PENALTY : 0) + rotationScore
}

function orderGroup(
  players: Player[],
  lateSet: Set<string>,
  history: BattingHistory[],
  genderGroup: GenderGroup
): BattingOrderEntry[] {
  const N = players.length
  const sorted = [...players].sort(
    (a, b) =>
      battingScore(a.id, lateSet.has(a.id), history, genderGroup, N) -
      battingScore(b.id, lateSet.has(b.id), history, genderGroup, N)
  )
  return sorted.map((p, i) => ({ playerId: p.id, orderIndex: i + 1 }))
}

// ─── Main engine ─────────────────────────────────────────────────────────────

export function generateSplitBattingOrders({
  activePlayers,
  latePlayerIds,
  battingHistory,
}: SplitBattingParams): { women: BattingOrderEntry[]; men: BattingOrderEntry[] } {
  const lateSet = new Set(latePlayerIds)

  const womenPlayers = activePlayers.filter((p) => p.gender === 'F')
  const menPlayers = activePlayers.filter((p) => p.gender === 'M')

  return {
    women: orderGroup(womenPlayers, lateSet, battingHistory, 'F'),
    men: orderGroup(menPlayers, lateSet, battingHistory, 'M'),
  }
}
