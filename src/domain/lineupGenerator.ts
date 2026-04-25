import { generateFieldingGrid } from './fieldingEngine'
import { generateUnifiedBattingOrder } from './battingOrderEngine'
import { generateSplitBattingOrders } from './splitBattingEngine'
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
  // 1. Build fielding grid (identical for both modes)
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

  // 2. Build batting order
  let battingSlots: BattingSlot[]

  if (game.mode === 'Split') {
    const { women, men } = generateSplitBattingOrders({
      activePlayers: activeRoster,
      latePlayerIds,
      battingHistory,
    })
    battingSlots = [
      ...women.map((e) => ({
        gameId: game.id,
        playerId: e.playerId,
        orderIndex: e.orderIndex,
        genderGroup: 'F' as const,
      })),
      ...men.map((e) => ({
        gameId: game.id,
        playerId: e.playerId,
        orderIndex: e.orderIndex,
        genderGroup: 'M' as const,
      })),
    ]
  } else {
    const entries = generateUnifiedBattingOrder({
      activePlayers: activeRoster,
      latePlayerIds,
      battingHistory,
    })
    battingSlots = entries.map((e) => ({
      gameId: game.id,
      playerId: e.playerId,
      orderIndex: e.orderIndex,
      genderGroup: 'All' as const,
    }))
  }

  return { gameId: game.id, fieldingSlots, battingSlots }
}
