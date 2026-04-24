import { db } from '@/db'
import { games, players, rsvps } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params

  const [game] = await db.select().from(games).where(eq(games.id, gameId))
  if (!game) {
    return Response.json({ error: 'Game not found' }, { status: 404 })
  }

  const body = await request.json()
  const { name, gender } = body

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return Response.json({ error: 'name is required' }, { status: 400 })
  }
  if (gender !== 'M' && gender !== 'F') {
    return Response.json({ error: 'gender must be M or F' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  await db.insert(players).values({ id, name: name.trim(), gender, isGuest: true })
  await db.insert(rsvps).values({ gameId, playerId: id, status: 'Present' })

  const [guest] = await db.select().from(players).where(eq(players.id, id))
  return Response.json(guest, { status: 201 })
}
