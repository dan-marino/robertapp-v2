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

interface SlotRef {
  inning: number
  playerId: string
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params

  const [game] = await db.select().from(games).where(eq(games.id, gameId))
  if (!game) return Response.json({ error: 'Game not found' }, { status: 404 })

  const body = await req.json().catch(() => null)
  if (!body || !body.slot1 || !body.slot2) {
    return Response.json(
      { error: 'Body must include slot1 and slot2 with { inning, playerId }' },
      { status: 400 }
    )
  }

  const { slot1, slot2 }: { slot1: SlotRef; slot2: SlotRef } = body

  // Fetch all fielding slots for this game
  const fs = await db.select().from(fieldingSlots).where(eq(fieldingSlots.gameId, gameId))

  const s1 = fs.find((s) => s.inning === slot1.inning && s.playerId === slot1.playerId) ?? null
  const s2 = fs.find((s) => s.inning === slot2.inning && s.playerId === slot2.playerId) ?? null

  // Perform swap by updating player IDs in whichever slots exist
  const updates: Promise<unknown>[] = []
  if (s1 && s2) {
    // Both have slots: swap player IDs between the two position records
    updates.push(
      db.update(fieldingSlots).set({ playerId: slot2.playerId }).where(eq(fieldingSlots.id, s1.id)),
      db.update(fieldingSlots).set({ playerId: slot1.playerId }).where(eq(fieldingSlots.id, s2.id))
    )
  } else if (s1) {
    // Only slot1 player has a position: move it to slot2 player
    updates.push(
      db.update(fieldingSlots).set({ playerId: slot2.playerId }).where(eq(fieldingSlots.id, s1.id))
    )
  } else if (s2) {
    // Only slot2 player has a position: move it to slot1 player
    updates.push(
      db.update(fieldingSlots).set({ playerId: slot1.playerId }).where(eq(fieldingSlots.id, s2.id))
    )
  }
  // If neither has a slot, no-op — fall through to validation/response

  await Promise.all(updates)

  // Rebuild lineup for validation
  const updatedFs = await db.select().from(fieldingSlots).where(eq(fieldingSlots.gameId, gameId))
  const bs = await db.select().from(battingSlots).where(eq(battingSlots.gameId, gameId))

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
      ? await db.select().from(positionPreferences).where(inArray(positionPreferences.playerId, activePids))
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
