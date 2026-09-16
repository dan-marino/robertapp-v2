import { db } from '@/db'
import { gameStats as gameStatsTable } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { GameStatCounts } from './gameStats'

/**
 * Returns all stat rows from game_stats for the given game.
 */
export async function getGameStats(
  gameId: string
): Promise<Array<{ playerId: string } & GameStatCounts>> {
  const rows = await db
    .select()
    .from(gameStatsTable)
    .where(eq(gameStatsTable.gameId, gameId))

  return rows.map((r) => ({
    playerId: r.playerId,
    s1b: r.s1b,
    s2b: r.s2b,
    s3b: r.s3b,
    hr: r.hr,
    bb: r.bb,
    k: r.k,
    fo: r.fo,
    fc: r.fc,
    go: r.go,
    sf: r.sf,
    rbi: r.rbi,
    r: r.r,
  }))
}

/**
 * Inserts or fully replaces a player's stats row for a game.
 * Targets the (gameId, playerId) composite primary key.
 */
export async function upsertPlayerGameStats(
  gameId: string,
  playerId: string,
  counts: GameStatCounts
): Promise<void> {
  await db
    .insert(gameStatsTable)
    .values({ gameId, playerId, ...counts })
    .onConflictDoUpdate({
      target: [gameStatsTable.gameId, gameStatsTable.playerId],
      set: {
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
        rbi: counts.rbi,
        r: counts.r,
      },
    })
}
