import { db } from '@/db'
import { games, seasons } from '@/db/schema'
import { eq } from 'drizzle-orm'

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
  const { date, inningCount, mode, time, opponent } = body

  if (!date || typeof date !== 'string') {
    return Response.json({ error: 'date is required (ISO string)' }, { status: 400 })
  }
  if (inningCount !== 5 && inningCount !== 6) {
    return Response.json({ error: 'inningCount must be 5 or 6' }, { status: 400 })
  }
  if (mode !== undefined && mode !== 'Unified' && mode !== 'Split') {
    return Response.json({ error: 'mode must be Unified or Split' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  await db.insert(games).values({
    id,
    seasonId,
    date,
    inningCount,
    mode: mode ?? 'Unified',
    time: typeof time === 'string' ? time : null,
    opponent: typeof opponent === 'string' ? opponent : null,
  })

  const [game] = await db.select().from(games).where(eq(games.id, id))
  return Response.json(game, { status: 201 })
}
