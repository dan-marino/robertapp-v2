import { db } from '@/db'
import { gameStats, games, players, rosters, seasons } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const [season] = await db.select().from(seasons).where(eq(seasons.id, id))
  if (!season) {
    return Response.json({ error: 'Season not found' }, { status: 404 })
  }

  // Get all players on the season roster
  const rosterRows = await db
    .select({ player: players })
    .from(rosters)
    .innerJoin(players, eq(rosters.playerId, players.id))
    .where(eq(rosters.seasonId, id))

  // Get all game IDs for this season
  const seasonGames = await db
    .select({ id: games.id })
    .from(games)
    .where(eq(games.seasonId, id))

  const gameIds = seasonGames.map((g) => g.id)

  // Get aggregated stats per player for this season
  type StatRow = {
    playerId: string
    g: number
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
  }

  let statRows: StatRow[] = []

  if (gameIds.length > 0) {
    statRows = await db
      .select({
        playerId: gameStats.playerId,
        g: sql<number>`count(distinct ${gameStats.gameId})`,
        s1b: sql<number>`sum(${gameStats.s1b})`,
        s2b: sql<number>`sum(${gameStats.s2b})`,
        s3b: sql<number>`sum(${gameStats.s3b})`,
        hr: sql<number>`sum(${gameStats.hr})`,
        bb: sql<number>`sum(${gameStats.bb})`,
        k: sql<number>`sum(${gameStats.k})`,
        fo: sql<number>`sum(${gameStats.fo})`,
        fc: sql<number>`sum(${gameStats.fc})`,
        go: sql<number>`sum(${gameStats.go})`,
        sf: sql<number>`sum(${gameStats.sf})`,
        rbi: sql<number>`sum(${gameStats.rbi})`,
        r: sql<number>`sum(${gameStats.r})`,
      })
      .from(gameStats)
      .where(sql`${gameStats.gameId} = any(${sql.raw(`ARRAY[${gameIds.map((gid) => `'${gid}'`).join(',')}]::varchar[]`)})`)
      .groupBy(gameStats.playerId)
  }

  const statsByPlayerId = new Map(statRows.map((row) => [row.playerId, row]))

  const result = rosterRows.map(({ player }) => {
    const s = statsByPlayerId.get(player.id)
    const s1b = Number(s?.s1b ?? 0)
    const s2b = Number(s?.s2b ?? 0)
    const s3b = Number(s?.s3b ?? 0)
    const hr = Number(s?.hr ?? 0)
    const bb = Number(s?.bb ?? 0)
    const k = Number(s?.k ?? 0)
    const fo = Number(s?.fo ?? 0)
    const fc = Number(s?.fc ?? 0)
    const go = Number(s?.go ?? 0)
    const sf = Number(s?.sf ?? 0)
    const rbi = Number(s?.rbi ?? 0)
    const r = Number(s?.r ?? 0)
    const g = Number(s?.g ?? 0)

    const h = s1b + s2b + s3b + hr
    const ab = s1b + s2b + s3b + hr + k + fo + fc + go
    const tb = s1b + 2 * s2b + 3 * s3b + 4 * hr

    const ba = ab > 0 ? h / ab : null
    const obp = ab > 0 ? (h + bb) / ab : null
    const slg = ab > 0 ? tb / ab : null

    return {
      playerId: player.id,
      playerName: player.name,
      g,
      ab,
      h,
      s1b,
      s2b,
      s3b,
      hr,
      bb,
      k,
      sf,
      rbi,
      r,
      ba,
      obp,
      slg,
    }
  })

  return Response.json(result)
}
