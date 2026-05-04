import { db } from '@/db'
import {
  games,
  players,
  rosters,
  rsvps,
  fieldingSlots,
  battingSlots,
  positionPreferences,
} from '@/db/schema'
import { and, eq, inArray } from 'drizzle-orm'
import { validateLineup } from '@/domain/constraintValidator'
import { getActiveRoster } from '@/domain/rsvpManager'
import type { RSVPStatus, Position, PositionPreference, PreferenceTier, GenderGroup } from '@/domain/types'
import { ALL_POSITIONS } from '@/domain/types'

/**
 * PUT /api/games/[id]/lineup/slot
 * body: { inning: number, position: string, playerId: string | null }
 *
 * playerId null  → delete that slot
 * playerId set   → upsert (update existing or insert new)
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params

  const [game] = await db.select().from(games).where(eq(games.id, gameId))
  if (!game) return Response.json({ error: 'Game not found' }, { status: 404 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body.inning !== 'number' || typeof body.position !== 'string') {
    return Response.json({ error: 'Body must include inning (number) and position (string)' }, { status: 400 })
  }

  const { inning, position, playerId } = body as {
    inning: number
    position: string
    playerId: string | null
  }

  if (!ALL_POSITIONS.includes(position as Position)) {
    return Response.json({ error: `Invalid position: ${position}` }, { status: 400 })
  }

  // Find existing slot for this inning+position
  const existing = await db
    .select()
    .from(fieldingSlots)
    .where(
      and(
        eq(fieldingSlots.gameId, gameId),
        eq(fieldingSlots.inning, inning),
        eq(fieldingSlots.position, position as Position)
      )
    )

  if (playerId === null) {
    // Delete
    if (existing.length > 0) {
      await db.delete(fieldingSlots).where(eq(fieldingSlots.id, existing[0].id))
    }
  } else {
    if (existing.length > 0) {
      // Update
      await db
        .update(fieldingSlots)
        .set({ playerId })
        .where(eq(fieldingSlots.id, existing[0].id))
    } else {
      // Insert
      await db.insert(fieldingSlots).values({
        id: crypto.randomUUID(),
        gameId,
        inning,
        playerId,
        position: position as Position,
      })
    }
  }

  // Rebuild lineup and validate
  const [updatedFs, bs] = await Promise.all([
    db.select().from(fieldingSlots).where(eq(fieldingSlots.gameId, gameId)),
    db.select().from(battingSlots).where(eq(battingSlots.gameId, gameId)),
  ])

  const rosterRows = await db
    .select({ player: players })
    .from(rosters)
    .innerJoin(players, eq(rosters.playerId, players.id))
    .where(eq(rosters.seasonId, game.seasonId))

  const rsvpRows = await db.select().from(rsvps).where(eq(rsvps.gameId, gameId))
  const rsvpMap = new Map(rsvpRows.map((r) => [r.playerId, r.status as RSVPStatus]))

  const guestIds = rsvpRows
    .map((r) => r.playerId)
    .filter((pid) => !rosterRows.some((row) => row.player.id === pid))
  const guestRows =
    guestIds.length > 0
      ? await db.select().from(players).where(inArray(players.id, guestIds))
      : []

  const allPlayers = [...rosterRows.map((r) => r.player), ...guestRows.filter((g) => g.isGuest)]
  const rsvpList = allPlayers
    .filter((p) => rsvpMap.has(p.id))
    .map((p) => ({ gameId, playerId: p.id, status: rsvpMap.get(p.id)! }))
  const activeRoster = getActiveRoster(allPlayers, rsvpList)

  const activePids = activeRoster.map((p) => p.id)
  const prefRows =
    activePids.length > 0
      ? await db
          .select()
          .from(positionPreferences)
          .where(inArray(positionPreferences.playerId, activePids))
      : []
  const preferences: PositionPreference[] = prefRows.map((r) => ({
    playerId: r.playerId,
    position: r.position as Position,
    tier: r.tier as PreferenceTier,
  }))

  const lineup = {
    gameId,
    fieldingSlots: updatedFs.map((s) => ({
      gameId: s.gameId,
      inning: s.inning,
      playerId: s.playerId,
      position: s.position as Position,
    })),
    battingSlots: bs.map((s) => ({
      gameId: s.gameId,
      playerId: s.playerId,
      orderIndex: s.orderIndex,
      genderGroup: s.genderGroup as GenderGroup,
    })),
  }

  const violations = validateLineup(lineup, activeRoster, preferences)
  return Response.json({ lineup, violations })
}
