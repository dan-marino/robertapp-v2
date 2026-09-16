import { db } from '@/db'
import { battingHistory, battingSlots, fieldingSlots, gameStats, games, players, rsvps } from '@/db/schema'
import { and, eq, inArray } from 'drizzle-orm'

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

  // When mode changes, migrate batting slots to match the new mode's genderGroup scheme
  if (body.mode !== undefined && body.mode !== game.mode) {
    const newMode = body.mode as 'Unified' | 'Split'
    const currentSlots = await db.select().from(battingSlots).where(eq(battingSlots.gameId, id))

    if (currentSlots.length > 0) {
      if (newMode === 'Unified') {
        // Merge M/F slots into a single unified order.
        // Sort by orderIndex ascending; ties (same index, different group) put M before F.
        const sorted = [...currentSlots].sort((a, b) => {
          if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex
          return a.genderGroup === 'M' ? -1 : 1
        })
        await Promise.all(
          sorted.map((slot, idx) =>
            db
              .update(battingSlots)
              .set({ genderGroup: 'All', orderIndex: idx + 1 })
              .where(eq(battingSlots.id, slot.id))
          )
        )
      } else {
        // Split unified slots back into M/F ordered lists.
        // Preserve each player's relative position within their gender group.
        const playerIds = [...new Set(currentSlots.map((s) => s.playerId))]
        const playerRows = await db.select().from(players).where(inArray(players.id, playerIds))
        const genderMap = new Map(playerRows.map((p) => [p.id, p.gender as 'M' | 'F']))

        const sortedAll = [...currentSlots].sort((a, b) => a.orderIndex - b.orderIndex)
        const mSlots = sortedAll.filter((s) => genderMap.get(s.playerId) === 'M')
        const fSlots = sortedAll.filter((s) => genderMap.get(s.playerId) === 'F')

        await Promise.all([
          ...mSlots.map((slot, idx) =>
            db
              .update(battingSlots)
              .set({ genderGroup: 'M', orderIndex: idx + 1 })
              .where(eq(battingSlots.id, slot.id))
          ),
          ...fSlots.map((slot, idx) =>
            db
              .update(battingSlots)
              .set({ genderGroup: 'F', orderIndex: idx + 1 })
              .where(eq(battingSlots.id, slot.id))
          ),
        ])
      }
    }
  }

  const [updated] = await db
    .update(games)
    .set(updateSet)
    .where(eq(games.id, id))
    .returning()

  return Response.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const [game] = await db.select().from(games).where(eq(games.id, id))
  if (!game) {
    return Response.json({ error: 'Game not found' }, { status: 404 })
  }

  // Find guest player IDs before deleting RSVPs
  const guestRsvps = await db
    .select({ playerId: players.id })
    .from(rsvps)
    .innerJoin(players, and(eq(players.id, rsvps.playerId), eq(players.isGuest, true)))
    .where(eq(rsvps.gameId, id))

  const guestIds = guestRsvps.map((r) => r.playerId)

  // Cascade delete all game-scoped records
  await db.delete(gameStats).where(eq(gameStats.gameId, id))
  await db.delete(fieldingSlots).where(eq(fieldingSlots.gameId, id))
  await db.delete(battingSlots).where(eq(battingSlots.gameId, id))
  await db.delete(battingHistory).where(eq(battingHistory.gameId, id))
  await db.delete(rsvps).where(eq(rsvps.gameId, id))

  // Delete guest players (game-scoped, no longer needed)
  for (const guestId of guestIds) {
    await db.delete(players).where(and(eq(players.id, guestId), eq(players.isGuest, true)))
  }

  await db.delete(games).where(eq(games.id, id))

  return new Response(null, { status: 204 })
}
