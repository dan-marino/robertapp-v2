import { db } from '@/db'
import { games, seasons } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const [season] = await db.select().from(seasons).where(eq(seasons.id, id))
  if (!season) {
    return Response.json({ error: 'Season not found' }, { status: 404 })
  }

  const seasonGames = await db.select().from(games).where(eq(games.seasonId, id))
  return Response.json({ ...season, games: seasonGames })
}
