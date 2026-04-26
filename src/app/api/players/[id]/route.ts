import { db } from '@/db'
import { players } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { name, gender, traded } = body

  const updates: Partial<typeof players.$inferInsert> = {}

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim() === '') {
      return Response.json({ error: 'name must be a non-empty string' }, { status: 400 })
    }
    updates.name = name.trim()
  }

  if (gender !== undefined) {
    if (gender !== 'M' && gender !== 'F') {
      return Response.json({ error: 'gender must be M or F' }, { status: 400 })
    }
    updates.gender = gender
  }

  if (traded !== undefined) {
    if (typeof traded !== 'boolean') {
      return Response.json({ error: 'traded must be a boolean' }, { status: 400 })
    }
    updates.traded = traded
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'No fields to update' }, { status: 400 })
  }

  await db.update(players).set(updates).where(eq(players.id, id))
  const [player] = await db.select().from(players).where(eq(players.id, id))

  if (!player) {
    return Response.json({ error: 'Player not found' }, { status: 404 })
  }

  return Response.json(player)
}
