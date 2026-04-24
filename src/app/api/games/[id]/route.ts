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
