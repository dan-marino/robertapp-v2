import { describe, expect, it } from 'vitest'
import { generateLineup } from '../lineupGenerator'
import type { Player, Game, PositionPreference, PositionHistory, BattingHistory } from '../types'

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

const BASE_GAME: Game = {
  id: 'game1',
  seasonId: 's1',
  date: '2026-04-25',
  inningCount: 6,
  mode: 'Unified',
}

// ─── Integration tests ────────────────────────────────────────────────────────

describe('generateLineup', () => {
  it('returns a Lineup with both fielding and batting slots', () => {
    const roster = makeRoster(7, 3)
    const lineup = generateLineup({
      activeRoster: roster,
      game: BASE_GAME,
      latePlayerIds: [],
      preferences: [],
      positionHistory: [],
      battingHistory: [],
    })

    expect(lineup.gameId).toBe('game1')
    expect(lineup.fieldingSlots.length).toBeGreaterThan(0)
    expect(lineup.battingSlots.length).toBe(10)
  })

  it('fielding slots reference the correct gameId', () => {
    const roster = makeRoster(7, 3)
    const lineup = generateLineup({
      activeRoster: roster,
      game: BASE_GAME,
      latePlayerIds: [],
      preferences: [],
      positionHistory: [],
      battingHistory: [],
    })

    for (const slot of lineup.fieldingSlots) {
      expect(slot.gameId).toBe('game1')
    }
  })

  it('batting slots use genderGroup All for Unified mode', () => {
    const roster = makeRoster(7, 3)
    const lineup = generateLineup({
      activeRoster: roster,
      game: BASE_GAME,
      latePlayerIds: [],
      preferences: [],
      positionHistory: [],
      battingHistory: [],
    })

    for (const slot of lineup.battingSlots) {
      expect(slot.genderGroup).toBe('All')
    }
  })

  it('late players sit inning 1 and bat lower in the order', () => {
    const roster = makeRoster(7, 3)
    const latePlayer = roster[3] // m3
    const lineup = generateLineup({
      activeRoster: roster,
      game: BASE_GAME,
      latePlayerIds: [latePlayer.id],
      preferences: [],
      positionHistory: [],
      battingHistory: [],
    })

    // Not in fielding slots for inning 1
    const inning1Players = lineup.fieldingSlots
      .filter((s) => s.inning === 1)
      .map((s) => s.playerId)
    expect(inning1Players).not.toContain(latePlayer.id)

    // Bats in the lower half
    const battingSlot = lineup.battingSlots.find((s) => s.playerId === latePlayer.id)!
    expect(battingSlot.orderIndex).toBeGreaterThan(Math.floor(roster.length / 2))
  })

  it('all active players appear in the batting order', () => {
    const roster = makeRoster(7, 3)
    const lineup = generateLineup({
      activeRoster: roster,
      game: BASE_GAME,
      latePlayerIds: [],
      preferences: [],
      positionHistory: [],
      battingHistory: [],
    })

    const battingIds = new Set(lineup.battingSlots.map((s) => s.playerId))
    for (const player of roster) {
      expect(battingIds.has(player.id)).toBe(true)
    }
  })
})
