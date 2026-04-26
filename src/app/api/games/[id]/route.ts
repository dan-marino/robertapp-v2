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
  if (!body) {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Validate mode if provided
  if (body.mode !== undefined && !['Unified', 'Split'].includes(body.mode)) {
    return Response.json({ error: 'mode must be "Unified" or "Split"' }, { status: 400 })
  }

  // Validate inningCount if provided
  if (body.inningCount !== undefined && body.inningCount !== 5 && body.inningCount !== 6) {
    return Response.json({ error: 'inningCount must be 5 or 6' }, { status: 400 })
  }

  // Validate date if provided
  if (body.date !== undefined && typeof body.date !== 'string') {
    return Response.json({ error: 'date must be a string' }, { status: 400 })
  }

  // Build the update set with only provided fields
  const updateSet: Partial<{
    mode: 'Unified' | 'Split'
    date: string
    inningCount: number
    time: string | null
    opponent: string | null
  }> = {}

  if (body.mode !== undefined) updateSet.mode = body.mode
  if (body.date !== undefined) updateSet.date = body.date
  if (body.inningCount !== undefined) updateSet.inningCount = body.inningCount
  if ('time' in body) updateSet.time = body.time ?? null
  if ('opponent' in body) updateSet.opponent = body.opponent ?? null

  if (Object.keys(updateSet).length === 0) {
    return Response.json({ error: 'No valid fields provided to update' }, { status: 400 })
  }

  const [updated] = await db
    .update(games)
    .set(updateSet)
    .where(eq(games.id, id))
    .returning()

  return Response.json(updated)
}
