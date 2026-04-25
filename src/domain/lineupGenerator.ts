import { generateFieldingGrid } from './fieldingEngine'
import { generateUnifiedBattingOrder } from './battingOrderEngine'
import type {
  Player,
  Game,
  PositionPreference,
  PositionHistory,
  BattingHistory,
  Lineup,
  FieldingSlot,
  BattingSlot,
} from './types'

interface GenerateLineupParams {
  activeRoster: Player[]
  game: Game
  latePlayerIds: string[]
  preferences: PositionPreference[]
  positionHistory: PositionHistory[]
  battingHistory: BattingHistory[]
  pitcherIds?: string[]
}

export function generateLineup({
  activeRoster,
  game,
  latePlayerIds,
  preferences,
  positionHistory,
  battingHistory,
  pitcherIds,
}: GenerateLineupParams): Lineup {
  // 1. Build fielding grid
  const fieldingAssignments = generateFieldingGrid({
    activeRoster,
    preferences,
    positionHistory,
    latePlayerIds,
    pitcherIds,
    inningCount: game.inningCount,
  })

  const fieldingSlots: FieldingSlot[] = fieldingAssignments.map((a) => ({
    gameId: game.id,
    inning: a.inning,
    playerId: a.playerId,
    position: a.position,
  }))

  // 2. Build batting order (Unified mode — Split mode handled separately in #18)
  const battingEntries = generateUnifiedBattingOrder({
    activePlayers: activeRoster,
    latePlayerIds,
    battingHistory,
  })

  const battingSlots: BattingSlot[] = battingEntries.map((e) => ({
    gameId: game.id,
    playerId: e.playerId,
    orderIndex: e.orderIndex,
    genderGroup: 'All',
  }))

  return { gameId: game.id, fieldingSlots, battingSlots }
}
