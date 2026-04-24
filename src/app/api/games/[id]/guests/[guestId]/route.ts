import { db } from '@/db'
import { players, rsvps } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; guestId: string }> }
) {
  const { id: gameId, guestId } = await params

  // Remove RSVP and player record (guests are game-scoped)
  await db
    .delete(rsvps)
    .where(and(eq(rsvps.gameId, gameId), eq(rsvps.playerId, guestId)))

  await db
    .delete(players)
    .where(and(eq(players.id, guestId), eq(players.isGuest, true)))

  return new Response(null, { status: 204 })
}
