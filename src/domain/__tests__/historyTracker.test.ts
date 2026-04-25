import { describe, expect, it } from 'vitest'
import {
  computePositionDeltas,
  selectLeastRecentCandidate,
  selectLastBattingSlot,
} from '../historyTracker'
import type { FieldingSlot, PositionHistory, BattingHistory } from '../types'

// ─── computePositionDeltas ────────────────────────────────────────────────────

describe('computePositionDeltas', () => {
  it('returns one delta per fielding slot', () => {
    const slots: FieldingSlot[] = [
      { gameId: 'g1', inning: 1, playerId: 'm0', position: 'SS' },
      { gameId: 'g1', inning: 1, playerId: 'm1', position: 'P' },
      { gameId: 'g1', inning: 2, playerId: 'm0', position: 'LCF' },
    ]
    const deltas = computePositionDeltas(slots, new Set())
    expect(deltas).toHaveLength(3)
  })

  it('excludes guest players from deltas', () => {
    const slots: FieldingSlot[] = [
      { gameId: 'g1', inning: 1, playerId: 'm0', position: 'SS' },
      { gameId: 'g1', inning: 1, playerId: 'guest0', position: 'P' },
    ]
    const deltas = computePositionDeltas(slots, new Set(['guest0']))
    expect(deltas).toHaveLength(1)
    expect(deltas[0].playerId).toBe('m0')
  })

  it('accumulates multi-inning deltas for the same player-position pair', () => {
    const slots: FieldingSlot[] = [
      { gameId: 'g1', inning: 1, playerId: 'm0', position: 'SS' },
      { gameId: 'g1', inning: 2, playerId: 'm0', position: 'SS' },
      { gameId: 'g1', inning: 3, playerId: 'm0', position: 'SS' },
    ]
    const deltas = computePositionDeltas(slots, new Set())
    const ssCount = deltas.filter((d) => d.playerId === 'm0' && d.position === 'SS').length
    expect(ssCount).toBe(3) // one delta per inning, upsert handles accumulation
  })
})

// ─── selectLeastRecentCandidate ───────────────────────────────────────────────

describe('selectLeastRecentCandidate', () => {
  it('returns a player who has never played the position (count=0) over one who has', () => {
    const history: PositionHistory[] = [
      { playerId: 'm0', seasonId: 's1', position: 'SS', count: 5 },
    ]
    // m1 has no history for SS (implicit count 0)
    const winner = selectLeastRecentCandidate(['m0', 'm1'], history, 'SS')
    expect(winner).toBe('m1')
  })

  it('returns the candidate with the lower play count', () => {
    const history: PositionHistory[] = [
      { playerId: 'm0', seasonId: 's1', position: 'SS', count: 3 },
      { playerId: 'm1', seasonId: 's1', position: 'SS', count: 1 },
    ]
    const winner = selectLeastRecentCandidate(['m0', 'm1'], history, 'SS')
    expect(winner).toBe('m1')
  })

  it('returns null when candidates list is empty', () => {
    const winner = selectLeastRecentCandidate([], [], 'SS')
    expect(winner).toBeNull()
  })

  it('returns one of the tied candidates when counts are equal', () => {
    const history: PositionHistory[] = [
      { playerId: 'm0', seasonId: 's1', position: 'P', count: 2 },
      { playerId: 'm1', seasonId: 's1', position: 'P', count: 2 },
    ]
    const winner = selectLeastRecentCandidate(['m0', 'm1'], history, 'P')
    expect(['m0', 'm1']).toContain(winner)
  })
})

// ─── selectLastBattingSlot ────────────────────────────────────────────────────

describe('selectLastBattingSlot', () => {
  it('returns the orderIndex from the first entry in the provided history', () => {
    // Caller is responsible for pre-sorting by recency (most recent first)
    const history: BattingHistory[] = [
      { playerId: 'm0', seasonId: 's1', gameId: 'game2', orderIndex: 4, genderGroup: 'All' },
      { playerId: 'm0', seasonId: 's1', gameId: 'game1', orderIndex: 9, genderGroup: 'All' },
    ]
    expect(selectLastBattingSlot(history)).toBe(4)
  })

  it('returns null when history is empty', () => {
    expect(selectLastBattingSlot([])).toBeNull()
  })
})
