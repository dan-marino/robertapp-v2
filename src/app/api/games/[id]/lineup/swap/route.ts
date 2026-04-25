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
  position: string
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
    return Response.json({ error: 'Body must include slot1 and slot2 with { inning, position }' }, { status: 400 })
  }

  const { slot1, slot2 }: { slot1: SlotRef; slot2: SlotRef } = body

  // Fetch all fielding slots for this game
  const fs = await db.select().from(fieldingSlots).where(eq(fieldingSlots.gameId, gameId))

  const matchSlot = (s: typeof fs[number], ref: SlotRef) =>
    s.inning === ref.inning && s.position === ref.position

  const s1 = fs.find((s) => matchSlot(s, slot1))
  const s2 = fs.find((s) => matchSlot(s, slot2))

  if (!s1 || !s2) {
    return Response.json({ error: 'One or both slots not found in this lineup' }, { status: 404 })
  }

  // Swap player assignments
  await Promise.all([
    db.update(fieldingSlots).set({ playerId: s2.playerId }).where(eq(fieldingSlots.id, s1.id)),
    db.update(fieldingSlots).set({ playerId: s1.playerId }).where(eq(fieldingSlots.id, s2.id)),
  ])

  // Rebuild lineup for validation
  const updatedFs = await db.select().from(fieldingSlots).where(eq(fieldingSlots.gameId, gameId))
  const bs = await db.select().from(battingSlots).where(eq(battingSlots.gameId, gameId))

  // Fetch active roster
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
  const prefRows = activePids.length > 0
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
