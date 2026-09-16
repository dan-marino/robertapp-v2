import { db } from '@/db'
import { gameStats } from '@/db/schema/game_stats'
import { eq } from 'drizzle-orm'
import type { GameStatCounts } from './gameStats'

export interface GameStatRow extends GameStatCounts {
  gameId: string
  playerId: string
}

export async function getGameStats(gameId: string): Promise<GameStatRow[]> {
  return db.select().from(gameStats).where(eq(gameStats.gameId, gameId))
}
