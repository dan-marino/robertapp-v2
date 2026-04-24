import { db } from '@/db'
import { games, players, rosters, rsvps } from '@/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import type { RSVPStatus } from '@/domain/types'

const VALID_STATUSES: RSVPStatus[] = ['Present', 'Absent', 'Late']

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params

  const [game] = await db.select().from(games).where(eq(games.id, gameId))
  if (!game) {
    return Response.json({ error: 'Game not found' }, { status: 404 })
  }

  // Get all roster players for this season
  const rosterRows = await db
    .select({ player: players })
    .from(rosters)
    .innerJoin(players, eq(rosters.playerId, players.id))
    .where(eq(rosters.seasonId, game.seasonId))

  const rsvpRows = await db
    .select()
    .from(rsvps)
    .where(eq(rsvps.gameId, gameId))

  const rsvpMap = new Map(rsvpRows.map((r) => [r.playerId, r.status]))

  const result = rosterRows.map(({ player }) => ({
    player,
    status: rsvpMap.get(player.id) ?? null,
  }))

  return Response.json(result)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params

  const [game] = await db.select().from(games).where(eq(games.id, gameId))
  if (!game) {
    return Response.json({ error: 'Game not found' }, { status: 404 })
  }

  const body = await request.json()

  if (!Array.isArray(body)) {
    return Response.json({ error: 'Body must be an array of { playerId, status }' }, { status: 400 })
  }

  for (const item of body) {
    if (!VALID_STATUSES.includes(item.status as RSVPStatus)) {
      return Response.json({ error: `Invalid status: ${item.status}` }, { status: 400 })
    }
  }

  // Upsert all RSVPs in bulk
  if (body.length > 0) {
    await db
      .insert(rsvps)
      .values(body.map((item: { playerId: string; status: RSVPStatus }) => ({
        gameId,
        playerId: item.playerId,
        status: item.status,
      })))
      .onConflictDoUpdate({
        target: [rsvps.gameId, rsvps.playerId],
        set: { status: rsvps.status },
      })
  }

  const updated = await db.select().from(rsvps).where(eq(rsvps.gameId, gameId))
  return Response.json(updated)
}
