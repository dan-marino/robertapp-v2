import { db } from '@/db'
import { gameStats, players, rosters, seasons } from '@/db/schema'
import { computeDerivedStats, type PlayerSeasonStats } from '@/domain/gameStats'
import { and, countDistinct, eq, sql } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const [season] = await db.select().from(seasons).where(eq(seasons.id, id))
  if (!season) {
    return Response.json({ error: 'Season not found' }, { status: 404 })
  }

  // LEFT JOIN from roster players → game_stats (via games filtered to this season)
  // This ensures all roster players appear even with no stats.
  const rows = await db
    .select({
      playerId: players.id,
      name: players.name,
      g: countDistinct(
        sql`CASE WHEN (${gameStats.bb} + ${gameStats.sf} + ${gameStats.s1b} + ${gameStats.s2b} + ${gameStats.s3b} + ${gameStats.hr} + ${gameStats.k} + ${gameStats.fo} + ${gameStats.fc} + ${gameStats.go}) > 0 THEN ${gameStats.gameId} END`
      ),
      s1b: sql<number>`COALESCE(SUM(${gameStats.s1b}), 0)`.mapWith(Number),
      s2b: sql<number>`COALESCE(SUM(${gameStats.s2b}), 0)`.mapWith(Number),
      s3b: sql<number>`COALESCE(SUM(${gameStats.s3b}), 0)`.mapWith(Number),
      hr: sql<number>`COALESCE(SUM(${gameStats.hr}), 0)`.mapWith(Number),
      bb: sql<number>`COALESCE(SUM(${gameStats.bb}), 0)`.mapWith(Number),
      k: sql<number>`COALESCE(SUM(${gameStats.k}), 0)`.mapWith(Number),
      fo: sql<number>`COALESCE(SUM(${gameStats.fo}), 0)`.mapWith(Number),
      fc: sql<number>`COALESCE(SUM(${gameStats.fc}), 0)`.mapWith(Number),
      go: sql<number>`COALESCE(SUM(${gameStats.go}), 0)`.mapWith(Number),
      sf: sql<number>`COALESCE(SUM(${gameStats.sf}), 0)`.mapWith(Number),
      rbi: sql<number>`COALESCE(SUM(${gameStats.rbi}), 0)`.mapWith(Number),
      r: sql<number>`COALESCE(SUM(${gameStats.r}), 0)`.mapWith(Number),
    })
    .from(rosters)
    .innerJoin(players, eq(players.id, rosters.playerId))
    .leftJoin(
      gameStats,
      and(
        eq(gameStats.playerId, rosters.playerId),
        // only join stats from games in this season
        sql`${gameStats.gameId} IN (SELECT id FROM games WHERE season_id = ${id})`
      )
    )
    .where(eq(rosters.seasonId, id))
    .groupBy(players.id, players.name)

  const stats: PlayerSeasonStats[] = rows.map((row) => {
    const counts = {
      s1b: row.s1b,
      s2b: row.s2b,
      s3b: row.s3b,
      hr: row.hr,
      bb: row.bb,
      k: row.k,
      fo: row.fo,
      fc: row.fc,
      go: row.go,
      sf: row.sf,
      rbi: row.rbi,
      r: row.r,
    }
    const derived = computeDerivedStats(counts)
    return {
      playerId: row.playerId,
      name: row.name,
      g: row.g,
      ...counts,
      ...derived,
    }
  })

  return Response.json(stats)
}
