import { db } from '@/db'
import { games, players, rosters, rsvps, fieldingSlots, battingSlots, gameStats } from '@/db/schema'
import { and, eq, inArray } from 'drizzle-orm'
import { computeSyncDiff } from '@/domain/syncLineup'
import type { RSVPStatus, GenderGroup, Position } from '@/domain/types'
import { randomUUID } from 'crypto'

/**
 * LineupSync — diffs current RSVPs against the current Lineup and applies
 * additions/removals without regenerating.
 *
 * POST body (optional): { confirm?: boolean }
 *
 * If any player being removed still has FieldingSlots, the endpoint returns
 * 409 { needsConfirmation: true, removedWithSlots: Player[] } unless
 * { confirm: true } is sent.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params

  const [game] = await db.select().from(games).where(eq(games.id, gameId))
  if (!game) return Response.json({ error: 'Game not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const confirm = body?.confirm === true

  // Fetch current lineup slots
  const [currentBattingSlots, currentFieldingSlots] = await Promise.all([
    db.select().from(battingSlots).where(eq(battingSlots.gameId, gameId)),
    db.select().from(fieldingSlots).where(eq(fieldingSlots.gameId, gameId)),
  ])

  // Fetch all roster players + guests with RSVPs
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
  const allRsvps = allPlayers
    .filter((p) => rsvpMap.has(p.id))
    .map((p) => ({ gameId, playerId: p.id, status: rsvpMap.get(p.id)! }))

  const playerMap = new Map(allPlayers.map((p) => [p.id, p]))

  const diff = computeSyncDiff(
    game.mode as 'Unified' | 'Split',
    currentBattingSlots.map((bs) => ({
      gameId: bs.gameId,
      playerId: bs.playerId,
      orderIndex: bs.orderIndex,
      genderGroup: bs.genderGroup as GenderGroup,
    })),
    currentFieldingSlots.map((fs) => ({
      gameId: fs.gameId,
      inning: fs.inning,
      playerId: fs.playerId,
      position: fs.position as Position,
    })),
    allRsvps,
    allPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      gender: p.gender as 'M' | 'F',
      isGuest: p.isGuest,
    }))
  )

  const toNamedRef = (id: string) => ({ id, name: playerMap.get(id)?.name ?? id })

  // Check confirmation requirement
  const removedWithSlots = diff.toRemove.filter((r) => r.hadFieldingSlots)

  const removeIds = diff.toRemove.map((r) => r.playerId)

  const statRows = removeIds.length > 0
    ? await db.select().from(gameStats).where(
        and(eq(gameStats.gameId, gameId), inArray(gameStats.playerId, removeIds))
      )
    : []

  const removedWithStats = statRows
    .filter((s) =>
      s.s1b + s.s2b + s.s3b + s.hr + s.bb + s.k +
      s.fo + s.fc + s.go + s.sf + s.rbi + s.r > 0
    )
    .map((s) => toNamedRef(s.playerId))

  if ((removedWithSlots.length > 0 || removedWithStats.length > 0) && !confirm) {
    return Response.json(
      {
        needsConfirmation: true,
        removedWithSlots: removedWithSlots.map((r) => toNamedRef(r.playerId)),
        removedWithStats,
      },
      { status: 409 }
    )
  }

  // Apply removals
  if (removeIds.length > 0) {
    await Promise.all([
      db.delete(battingSlots).where(
        and(eq(battingSlots.gameId, gameId), inArray(battingSlots.playerId, removeIds))
      ),
      db.delete(fieldingSlots).where(
        and(eq(fieldingSlots.gameId, gameId), inArray(fieldingSlots.playerId, removeIds))
      ),
      db.delete(gameStats).where(
        and(eq(gameStats.gameId, gameId), inArray(gameStats.playerId, removeIds))
      ),
    ])
  }

  // Apply additions
  if (diff.toAdd.length > 0) {
    await db.insert(battingSlots).values(
      diff.toAdd.map((a) => ({
        id: randomUUID(),
        gameId,
        playerId: a.playerId,
        orderIndex: a.orderIndex,
        genderGroup: a.genderGroup,
      }))
    )
  }

  // Return the final state
  const [updatedBs, updatedFs] = await Promise.all([
    db.select().from(battingSlots).where(eq(battingSlots.gameId, gameId)),
    db.select().from(fieldingSlots).where(eq(fieldingSlots.gameId, gameId)),
  ])

  return Response.json({
    added: diff.toAdd.map((a) => toNamedRef(a.playerId)),
    removed: diff.toRemove.map((r) => toNamedRef(r.playerId)),
    removedWithSlots: removedWithSlots.map((r) => toNamedRef(r.playerId)),
    lineup: {
      gameId,
      fieldingSlots: updatedFs,
      battingSlots: updatedBs,
    },
  })
}
