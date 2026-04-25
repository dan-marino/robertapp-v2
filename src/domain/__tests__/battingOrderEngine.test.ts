import { describe, expect, it } from 'vitest'
import { generateUnifiedBattingOrder } from '../battingOrderEngine'
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
  it('assigns exactly one batting slot per player with sequential indices', () => {
    const players = makeRoster(7, 3)
    const result = generateUnifiedBattingOrder({
      activePlayers: players,
      latePlayerIds: [],
      battingHistory: [],
    })

    expect(result).toHaveLength(10)
    const indices = result.map((r) => r.orderIndex).sort((a, b) => a - b)
    expect(indices).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })
})

// ─── Slot-1/2 restriction ─────────────────────────────────────────────────────

describe('slot-1/2 restriction', () => {
  it('no woman appears in batting slots 1 or 2', () => {
    const players = makeRoster(7, 3)
    const result = generateUnifiedBattingOrder({
      activePlayers: players,
      latePlayerIds: [],
      battingHistory: [],
    })

    const womanIds = new Set(players.filter((p) => p.gender === 'F').map((p) => p.id))
    const slot1 = result.find((r) => r.orderIndex === 1)!
    const slot2 = result.find((r) => r.orderIndex === 2)!

    expect(womanIds.has(slot1.playerId)).toBe(false)
    expect(womanIds.has(slot2.playerId)).toBe(false)
  })
})

// ─── 3-man rule ───────────────────────────────────────────────────────────────

describe('3-man rule', () => {
  it('never places more than 3 consecutive men between any two women', () => {
    const players = makeRoster(7, 3)
    const result = generateUnifiedBattingOrder({
      activePlayers: players,
      latePlayerIds: [],
      battingHistory: [],
    })

    const ordered = [...result].sort((a, b) => a.orderIndex - b.orderIndex)
    const playerMap = new Map(players.map((p) => [p.id, p]))

    let consecutiveMen = 0
    for (const { playerId } of ordered) {
      if (playerMap.get(playerId)!.gender === 'M') {
        consecutiveMen++
        expect(consecutiveMen).toBeLessThanOrEqual(3)
      } else {
        consecutiveMen = 0
      }
    }
  })

  it('enforces the 3-man rule on wrap-around (last slot back to first slot)', () => {
    const players = makeRoster(7, 3)
    const result = generateUnifiedBattingOrder({
      activePlayers: players,
      latePlayerIds: [],
      battingHistory: [],
    })

    const ordered = [...result].sort((a, b) => a.orderIndex - b.orderIndex)
    const playerMap = new Map(players.map((p) => [p.id, p]))
    const N = ordered.length

    const womenIndices = ordered
      .map((e, i) => (playerMap.get(e.playerId)!.gender === 'F' ? i : -1))
      .filter((i) => i >= 0)

    if (womenIndices.length === 0) return

    const lastWomanIdx = womenIndices[womenIndices.length - 1]
    const firstWomanIdx = womenIndices[0]

    // Men between last woman and first woman (wrap-around)
    const wrapMen = (N - 1 - lastWomanIdx) + firstWomanIdx
    expect(wrapMen).toBeLessThanOrEqual(3)
  })
})

// ─── Late player placement ────────────────────────────────────────────────────

describe('late player placement', () => {
  it('a late man is placed in the bottom half of the order', () => {
    const players = makeRoster(7, 3)
    const latePlayer = players[3] // m3
    const result = generateUnifiedBattingOrder({
      activePlayers: players,
      latePlayerIds: [latePlayer.id],
      battingHistory: [],
    })

    const N = players.length
    const lateEntry = result.find((r) => r.playerId === latePlayer.id)!
    expect(lateEntry.orderIndex).toBeGreaterThan(Math.floor(N / 2))
  })

  it('a late woman is placed in the bottom half of the order', () => {
    const players = makeRoster(7, 3)
    const latePlayer = players.find((p) => p.gender === 'F')!
    const result = generateUnifiedBattingOrder({
      activePlayers: players,
      latePlayerIds: [latePlayer.id],
      battingHistory: [],
    })

    const N = players.length
    const lateEntry = result.find((r) => r.playerId === latePlayer.id)!
    expect(lateEntry.orderIndex).toBeGreaterThan(Math.floor(N / 2))
  })
})

// ─── History-based rotation ───────────────────────────────────────────────────

describe('history-based rotation', () => {
  it('player who batted earliest last game bats later this game', () => {
    const players = makeRoster(7, 3)
    // m0 batted at index 1 (earliest) last game
    // m1 batted at index 7 (last among men) last game
    const battingHistory: BattingHistory[] = [
      { playerId: 'm0', seasonId: 's1', gameId: 'game1', orderIndex: 1, genderGroup: 'All' },
      { playerId: 'm1', seasonId: 's1', gameId: 'game1', orderIndex: 7, genderGroup: 'All' },
    ]

    const result = generateUnifiedBattingOrder({
      activePlayers: players,
      latePlayerIds: [],
      battingHistory,
    })

    const m0Index = result.find((r) => r.playerId === 'm0')!.orderIndex
    const m1Index = result.find((r) => r.playerId === 'm1')!.orderIndex

    // m1 (batted late last game) should bat earlier this game
    expect(m1Index).toBeLessThan(m0Index)
  })

  it('rotates batting positions across two games', () => {
    const players = makeRoster(7, 3)

    // Game 1: no history
    const game1 = generateUnifiedBattingOrder({
      activePlayers: players,
      latePlayerIds: [],
      battingHistory: [],
    })

    // Build history from game 1
    const history: BattingHistory[] = game1.map((entry) => ({
      playerId: entry.playerId,
      seasonId: 's1',
      gameId: 'game1',
      orderIndex: entry.orderIndex,
      genderGroup: 'All',
    }))

    // Game 2: with game 1 history
    const game2 = generateUnifiedBattingOrder({
      activePlayers: players,
      latePlayerIds: [],
      battingHistory: history,
    })

    // The first man to bat in game 1 should NOT be the first man to bat in game 2
    const men = players.filter((p) => p.gender === 'M')
    const menIds = new Set(men.map((p) => p.id))

    const firstManGame1 = game1
      .filter((e) => menIds.has(e.playerId))
      .sort((a, b) => a.orderIndex - b.orderIndex)[0].playerId

    const firstManGame2 = game2
      .filter((e) => menIds.has(e.playerId))
      .sort((a, b) => a.orderIndex - b.orderIndex)[0].playerId

    expect(firstManGame1).not.toBe(firstManGame2)
  })
})
