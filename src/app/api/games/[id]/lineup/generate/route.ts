import { db } from '@/db'
import {
  games,
  players,
  rosters,
  rsvps,
  positionHistory as positionHistoryTable,
  battingHistory as battingHistoryTable,
  fieldingSlots,
  battingSlots,
  positionPreferences,
} from '@/db/schema'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { getActiveRoster, getLatePlayers } from '@/domain/rsvpManager'
import { generateLineup } from '@/domain/lineupGenerator'
import type { RSVPStatus, PositionHistory, BattingHistory, Position, GenderGroup, PositionPreference, PreferenceTier } from '@/domain/types'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params

  const [game] = await db.select().from(games).where(eq(games.id, gameId))
  if (!game) {
    return Response.json({ error: 'Game not found' }, { status: 404 })
  }

  // Fetch all roster players + any guests who RSVPd
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
  const latePlayers = getLatePlayers(allPlayers, rsvpList)
  const latePlayerIds = latePlayers.map((p) => p.id)

  if (activeRoster.length === 0) {
    return Response.json({ error: 'No active players for this game' }, { status: 422 })
  }

  // Fetch preferences for active players
  const activePids = activeRoster.map((p) => p.id)
  const prefRows = activePids.length > 0
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

  // Fetch position history for this season
  const posHistRows = activePids.length > 0
    ? await db
        .select()
        .from(positionHistoryTable)
        .where(
          and(
            eq(positionHistoryTable.seasonId, game.seasonId),
            inArray(positionHistoryTable.playerId, activePids)
          )
        )
    : []

  const positionHistory: PositionHistory[] = posHistRows.map((r) => ({
    playerId: r.playerId,
    seasonId: r.seasonId,
    position: r.position as Position,
    count: r.count,
  }))

  // Fetch batting history for this season
  const batHistRows = activePids.length > 0
    ? await db
        .select()
        .from(battingHistoryTable)
        .where(
          and(
            eq(battingHistoryTable.seasonId, game.seasonId),
            inArray(battingHistoryTable.playerId, activePids)
          )
        )
        .orderBy(desc(battingHistoryTable.gameId))
    : []

  const battingHistory: BattingHistory[] = batHistRows.map((r) => ({
    playerId: r.playerId,
    seasonId: r.seasonId,
    gameId: r.gameId,
    orderIndex: r.orderIndex,
    genderGroup: r.genderGroup as GenderGroup,
  }))

  // Generate lineup
  const lineup = generateLineup({
    activeRoster,
    game: {
      id: game.id,
      seasonId: game.seasonId,
      date: game.date,
      inningCount: game.inningCount as 5 | 6,
      mode: game.mode as 'Unified' | 'Split',
    },
    latePlayerIds,
    preferences,
    positionHistory,
    battingHistory,
  })

  // Replace existing slots
  await db.delete(fieldingSlots).where(eq(fieldingSlots.gameId, gameId))
  await db.delete(battingSlots).where(eq(battingSlots.gameId, gameId))

  if (lineup.fieldingSlots.length > 0) {
    await db.insert(fieldingSlots).values(
      lineup.fieldingSlots.map((s) => ({
        id: crypto.randomUUID(),
        gameId: s.gameId,
        inning: s.inning,
        playerId: s.playerId,
        position: s.position,
      }))
    )
  }

  if (lineup.battingSlots.length > 0) {
    await db.insert(battingSlots).values(
      lineup.battingSlots.map((s) => ({
        id: crypto.randomUUID(),
        gameId: s.gameId,
        playerId: s.playerId,
        orderIndex: s.orderIndex,
        genderGroup: s.genderGroup,
      }))
    )
  }

  return Response.json(lineup, { status: 201 })
}
