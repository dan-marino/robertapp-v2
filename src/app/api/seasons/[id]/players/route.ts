import { db } from '@/db'
import { players, rosters, seasons } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: seasonId } = await params

  const rows = await db
    .select({ player: players })
    .from(rosters)
    .innerJoin(players, eq(rosters.playerId, players.id))
    .where(eq(rosters.seasonId, seasonId))

  return Response.json(rows.map((r) => r.player))
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: seasonId } = await params

  const [season] = await db.select().from(seasons).where(eq(seasons.id, seasonId))
  if (!season) {
    return Response.json({ error: 'Season not found' }, { status: 404 })
  }

  const body = await request.json()
  const { name, gender, playerId } = body

  // Path A: link an existing player to the season
  if (playerId) {
    const [existing] = await db.select().from(players).where(eq(players.id, playerId))
    if (!existing) {
      return Response.json({ error: 'Player not found' }, { status: 404 })
    }

    const [alreadyOnRoster] = await db
      .select()
      .from(rosters)
      .where(and(eq(rosters.seasonId, seasonId), eq(rosters.playerId, playerId)))
    if (alreadyOnRoster) {
      return Response.json({ error: 'Player already on roster' }, { status: 409 })
    }

    await db.insert(rosters).values({ seasonId, playerId })
    return Response.json(existing, { status: 201 })
  }

  // Path B: create a new player globally and add to season
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return Response.json({ error: 'name is required' }, { status: 400 })
  }
  if (gender !== 'M' && gender !== 'F') {
    return Response.json({ error: 'gender must be M or F' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  await db.insert(players).values({ id, name: name.trim(), gender, isGuest: false })
  await db.insert(rosters).values({ seasonId, playerId: id })

  const [player] = await db.select().from(players).where(eq(players.id, id))
  return Response.json(player, { status: 201 })
}
