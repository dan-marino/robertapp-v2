import { db } from '@/db'
import { games } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const [game] = await db.select().from(games).where(eq(games.id, id))
  if (!game) {
    return Response.json({ error: 'Game not found' }, { status: 404 })
  }

  return Response.json(game)
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const [game] = await db.select().from(games).where(eq(games.id, id))
  if (!game) {
    return Response.json({ error: 'Game not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  if (!body || !['Unified', 'Split'].includes(body.mode)) {
    return Response.json({ error: 'mode must be "Unified" or "Split"' }, { status: 400 })
  }

  const [updated] = await db
    .update(games)
    .set({ mode: body.mode })
    .where(eq(games.id, id))
    .returning()

  return Response.json(updated)
}
