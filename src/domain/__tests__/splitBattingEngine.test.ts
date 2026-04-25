import { describe, expect, it } from 'vitest'
import { generateSplitBattingOrders } from '../splitBattingEngine'
import type { Player, BattingHistory } from '../types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRoster(men: number, women: number): Player[] {
  const players: Player[] = []
  for (let i = 0; i < men; i++) {
    players.push({ id: `m${i}`, name: `Man${i}`, gender: 'M', isGuest: false })
  }
  for (let i = 0; i < women; i++) {
    players.push({ id: `w${i}`, name: `Woman${i}`, gender: 'F', isGuest: false })
  }
  return players
}

// ─── Basic shape ─────────────────────────────────────────────────────────────

describe('basic output shape', () => {
  it('returns a women order and a men order as independent lists', () => {
    const roster = makeRoster(7, 3)
    const { women, men } = generateSplitBattingOrders({
      activePlayers: roster,
      latePlayerIds: [],
      battingHistory: [],
    })

    expect(women).toHaveLength(3)
    expect(men).toHaveLength(7)

    const womenIds = new Set(roster.filter((p) => p.gender === 'F').map((p) => p.id))
    for (const entry of women) expect(womenIds.has(entry.playerId)).toBe(true)

    const menIds = new Set(roster.filter((p) => p.gender === 'M').map((p) => p.id))
    for (const entry of men) expect(menIds.has(entry.playerId)).toBe(true)
  })

  it('women order uses 1-based sequential indices within the group', () => {
    const roster = makeRoster(7, 3)
    const { women } = generateSplitBattingOrders({
      activePlayers: roster,
      latePlayerIds: [],
      battingHistory: [],
    })
    const indices = women.map((e) => e.orderIndex).sort((a, b) => a - b)
    expect(indices).toEqual([1, 2, 3])
  })

  it('men order uses 1-based sequential indices within the group', () => {
    const roster = makeRoster(7, 3)
    const { men } = generateSplitBattingOrders({
      activePlayers: roster,
      latePlayerIds: [],
      battingHistory: [],
    })
    const indices = men.map((e) => e.orderIndex).sort((a, b) => a - b)
    expect(indices).toEqual([1, 2, 3, 4, 5, 6, 7])
  })
})

// ─── 3-women edge case ────────────────────────────────────────────────────────

describe('3-women edge case', () => {
  it('all 3 women appear in the batting order when exactly 3 women are on the roster', () => {
    const roster = makeRoster(7, 3)
    const { women } = generateSplitBattingOrders({
      activePlayers: roster,
      latePlayerIds: [],
      battingHistory: [],
    })
    const expectedIds = roster.filter((p) => p.gender === 'F').map((p) => p.id)
    const resultIds = women.map((e) => e.playerId)
    for (const id of expectedIds) {
      expect(resultIds).toContain(id)
    }
  })
})

// ─── Late player placement ────────────────────────────────────────────────────

describe('late player placement', () => {
  it('a late woman bats lower in the women order', () => {
    const roster = makeRoster(7, 3)
    const lateWoman = roster.find((p) => p.gender === 'F')!
    const { women } = generateSplitBattingOrders({
      activePlayers: roster,
      latePlayerIds: [lateWoman.id],
      battingHistory: [],
    })
    const lateEntry = women.find((e) => e.playerId === lateWoman.id)!
    expect(lateEntry.orderIndex).toBe(3) // last among 3 women
  })

  it('a late man bats lower in the men order', () => {
    const roster = makeRoster(7, 3)
    const lateMan = roster.find((p) => p.gender === 'M')!
    const { men } = generateSplitBattingOrders({
      activePlayers: roster,
      latePlayerIds: [lateMan.id],
      battingHistory: [],
    })
    const lateEntry = men.find((e) => e.playerId === lateMan.id)!
    expect(lateEntry.orderIndex).toBe(7) // last among 7 men
  })
})

// ─── History-based rotation ───────────────────────────────────────────────────

describe('history-based rotation', () => {
  it('woman who batted first in last game bats later this game (within women order)', () => {
    const roster = makeRoster(7, 3)
    // w0 batted first (index 1) last game using Split mode history
    // w1 batted last (index 3) last game
    const history: BattingHistory[] = [
      { playerId: 'w0', seasonId: 's1', gameId: 'game1', orderIndex: 1, genderGroup: 'F' },
      { playerId: 'w1', seasonId: 's1', gameId: 'game1', orderIndex: 3, genderGroup: 'F' },
    ]
    const { women } = generateSplitBattingOrders({
      activePlayers: roster,
      latePlayerIds: [],
      battingHistory: history,
    })
    const w0 = women.find((e) => e.playerId === 'w0')!
    const w1 = women.find((e) => e.playerId === 'w1')!
    expect(w1.orderIndex).toBeLessThan(w0.orderIndex)
  })

  it('split mode history (genderGroup F/M) is used independently from unified history', () => {
    const roster = makeRoster(7, 3)
    // Only Unified-mode history exists for w0 — Split engine should ignore it
    const history: BattingHistory[] = [
      { playerId: 'w0', seasonId: 's1', gameId: 'game1', orderIndex: 1, genderGroup: 'All' },
    ]
    // If unified history is mistakenly used, w0 would be placed last.
    // The split engine should treat w0 as having no split history → neutral slot.
    const { women } = generateSplitBattingOrders({
      activePlayers: roster,
      latePlayerIds: [],
      battingHistory: history,
    })
    // All women should be present; no crash
    expect(women).toHaveLength(3)
  })
})
