import { db } from '@/db'
import {
  positionHistory as positionHistoryTable,
  battingHistory as battingHistoryTable,
  games,
} from '@/db/schema'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import type { FieldingSlot, BattingSlot, Lineup, Position, PositionHistory, BattingHistory, GenderGroup } from './types'

// ─── Pure helpers (exported for unit testing) ─────────────────────────────────

/**
 * Expand fielding slots into a flat list of (playerId, position) pairs,
 * excluding guests. Each inning produces one entry — the caller's upsert
 * handles accumulation.
 */
export function computePositionDeltas(
  fieldingSlots: FieldingSlot[],
  guestIds: Set<string>
): Array<{ playerId: string; position: Position }> {
  return fieldingSlots
    .filter((s) => !guestIds.has(s.playerId))
    .map((s) => ({ playerId: s.playerId, position: s.position }))
}

/**
 * From a pre-sorted history list (most-recent first), return the orderIndex
 * of the first entry, or null if the list is empty.
 */
export function selectLastBattingSlot(history: BattingHistory[]): number | null {
  return history.length > 0 ? history[0].orderIndex : null
}

/**
 * Among the given candidates, return the one with the fewest plays at the
 * specified position. Players absent from history are treated as count=0.
 * Returns null only if candidates is empty.
 */
export function selectLeastRecentCandidate(
  candidates: string[],
  history: PositionHistory[],
  position: Position
): string | null {
  if (candidates.length === 0) return null

  const historyMap = new Map<string, number>()
  for (const h of history) {
    if (h.position === position) historyMap.set(h.playerId, h.count)
  }

  let best: string | null = null
  let bestCount = Infinity

  for (const id of candidates) {
    const count = historyMap.get(id) ?? 0
    if (count < bestCount) {
      bestCount = count
      best = id
    }
  }

  return best
}

// ─── DB-backed operations ─────────────────────────────────────────────────────

/**
 * Increment position counts for all non-guest players after a game.
 * Upserts: if a row already exists the count is incremented; otherwise it is
 * inserted with count 1.
 */
export async function recordPositionHistory(
  lineup: Lineup,
  seasonId: string,
  guestIds: Set<string> = new Set()
): Promise<void> {
  const deltas = computePositionDeltas(lineup.fieldingSlots, guestIds)
  if (deltas.length === 0) return

  // Group by (playerId, position) and sum delta counts
  const grouped = new Map<string, { playerId: string; position: Position; count: number }>()
  for (const d of deltas) {
    const key = `${d.playerId}:${d.position}`
    const existing = grouped.get(key)
    if (existing) {
      existing.count++
    } else {
      grouped.set(key, { playerId: d.playerId, position: d.position, count: 1 })
    }
  }

  const rows = [...grouped.values()].map((r) => ({
    playerId: r.playerId,
    seasonId,
    position: r.position,
    count: r.count,
  }))

  await db
    .insert(positionHistoryTable)
    .values(rows)
    .onConflictDoUpdate({
      target: [positionHistoryTable.playerId, positionHistoryTable.seasonId, positionHistoryTable.position],
      set: { count: sql`${positionHistoryTable.count} + EXCLUDED.count` },
    })
}

/**
 * Record each player's batting slot for this game. Guests are excluded.
 */
export async function recordBattingHistory(
  lineup: Lineup,
  seasonId: string,
  guestIds: Set<string> = new Set()
): Promise<void> {
  const slots = lineup.battingSlots.filter((s) => !guestIds.has(s.playerId))
  if (slots.length === 0) return

  const rows = slots.map((s) => ({
    playerId: s.playerId,
    seasonId,
    gameId: lineup.gameId,
    orderIndex: s.orderIndex,
    genderGroup: s.genderGroup,
  }))

  await db.insert(battingHistoryTable).values(rows).onConflictDoNothing()
}

/**
 * Among the candidates, return the one who has played the position least
 * often this season. Players with no history are preferred over those with
 * any count. Returns null if candidates is empty.
 */
export async function getLeastRecentPositionPlayer(
  position: Position,
  seasonId: string,
  candidates: string[]
): Promise<string | null> {
  if (candidates.length === 0) return null

  const rows = await db
    .select()
    .from(positionHistoryTable)
    .where(
      and(
        eq(positionHistoryTable.seasonId, seasonId),
        eq(positionHistoryTable.position, position),
        inArray(positionHistoryTable.playerId, candidates)
      )
    )

  const history: PositionHistory[] = rows.map((r) => ({
    playerId: r.playerId,
    seasonId: r.seasonId,
    position: r.position as Position,
    count: r.count,
  }))

  return selectLeastRecentCandidate(candidates, history, position)
}

/**
 * Return the batting orderIndex from the player's most recent game this
 * season, or null if they have no batting history.
 */
export async function getLastBattingSlot(
  playerId: string,
  seasonId: string
): Promise<number | null> {
  const rows = await db
    .select({ orderIndex: battingHistoryTable.orderIndex })
    .from(battingHistoryTable)
    .innerJoin(games, eq(battingHistoryTable.gameId, games.id))
    .where(
      and(
        eq(battingHistoryTable.playerId, playerId),
        eq(battingHistoryTable.seasonId, seasonId)
      )
    )
    .orderBy(desc(games.date))
    .limit(1)

  const history: BattingHistory[] = rows.map((r) => ({
    playerId,
    seasonId,
    gameId: '',
    orderIndex: r.orderIndex,
    genderGroup: 'All' as GenderGroup,
  }))

  return selectLastBattingSlot(history)
}
