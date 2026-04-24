import { db } from '@/db'
import { players, rosters } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const { id: seasonId, playerId } = await params

  await db
    .delete(rosters)
    .where(and(eq(rosters.seasonId, seasonId), eq(rosters.playerId, playerId)))

  return new Response(null, { status: 204 })
}
