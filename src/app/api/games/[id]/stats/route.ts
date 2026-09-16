import { db } from '@/db'
import { games, players, rosters, rsvps } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getActiveRoster } from '@/domain/rsvpManager'
import { getGameStats } from '@/domain/statsRepository'
import { computeDerivedStats, ZERO_COUNTS } from '@/domain/gameStats'
import type { GameStatCounts } from '@/domain/gameStats'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params

  const [game] = await db.select().from(games).where(eq(games.id, gameId))
  if (!game) {
    return Response.json({ error: 'Game not found' }, { status: 404 })
  }

  // Get all roster players for this season (including guests)
  const rosterRows = await db
    .select({ player: players })
    .from(rosters)
    .innerJoin(players, eq(rosters.playerId, players.id))
    .where(eq(rosters.seasonId, game.seasonId))

  const rsvpRows = await db
    .select()
    .from(rsvps)
    .where(eq(rsvps.gameId, gameId))

  const rosterPlayers = rosterRows.map(({ player }) => player)

  // Active roster: Present or Late RSVPs, plus guests (guests always included)
  const activePlayers = [
    ...getActiveRoster(
      rosterPlayers.filter((p) => !p.isGuest),
      rsvpRows
    ),
    ...rosterPlayers.filter((p) => p.isGuest),
  ]

  // Get existing stat rows and index by playerId
  const statRows = await getGameStats(gameId)
  const statMap = new Map(statRows.map((row) => [row.playerId, row]))

  // Build response: one entry per active player, zeroed if no row exists
  const result = activePlayers
    .map((player) => {
      const row = statMap.get(player.id)
      const counts: GameStatCounts = row
        ? {
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
        : { ...ZERO_COUNTS }

      const derived = computeDerivedStats(counts)

      return {
        playerId: player.id,
        name: player.name,
        isGuest: player.isGuest,
        ...counts,
        ...derived,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return Response.json(result)
}
