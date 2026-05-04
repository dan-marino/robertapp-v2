import { db } from '@/db'
import { battingSlots, games } from '@/db/schema'
import { and, eq, inArray } from 'drizzle-orm'

/**
 * PUT /api/games/[id]/lineup/batting-order
 * body: { genderGroup: 'All' | 'M' | 'F', playerIds: string[] }
 *
 * Reassigns orderIndex 1..N for all batting slots in the given group,
 * matching the order of playerIds.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params

  const [game] = await db.select().from(games).where(eq(games.id, gameId))
  if (!game) return Response.json({ error: 'Game not found' }, { status: 404 })

  const body = await req.json().catch(() => null)
  if (
    !body ||
    !Array.isArray(body.playerIds) ||
    typeof body.genderGroup !== 'string'
  ) {
    return Response.json(
      { error: 'Body must include genderGroup (string) and playerIds (string[])' },
      { status: 400 }
    )
  }

  const { genderGroup, playerIds } = body as {
    genderGroup: 'All' | 'M' | 'F'
    playerIds: string[]
  }

  const existing = await db
    .select()
    .from(battingSlots)
    .where(
      and(
        eq(battingSlots.gameId, gameId),
        eq(battingSlots.genderGroup, genderGroup)
      )
    )

  if (existing.length === 0) {
    return Response.json({ error: 'No batting slots found for this group' }, { status: 404 })
  }

  // Update each slot's orderIndex to match the new order
  await Promise.all(
    playerIds.map((playerId, idx) => {
      const slot = existing.find((s) => s.playerId === playerId)
      if (!slot) return Promise.resolve()
      return db
        .update(battingSlots)
        .set({ orderIndex: idx + 1 })
        .where(eq(battingSlots.id, slot.id))
    })
  )

  const updated = await db
    .select()
    .from(battingSlots)
    .where(and(eq(battingSlots.gameId, gameId), eq(battingSlots.genderGroup, genderGroup)))

  return Response.json(updated.map((s) => ({
    gameId: s.gameId,
    playerId: s.playerId,
    orderIndex: s.orderIndex,
    genderGroup: s.genderGroup,
  })))
}
