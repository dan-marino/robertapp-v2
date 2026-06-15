import { describe, expect, it } from 'vitest'
import { validateLineup } from '../constraintValidator'
import type { Lineup, Player, FieldingSlot, BattingSlot } from '../types'

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

function makeFieldingSlots(assignments: Array<{ playerId: string; position: string }>, inning = 1): FieldingSlot[] {
  return assignments.map(({ playerId, position }) => ({
    gameId: 'g1',
    inning,
    playerId,
    position: position as FieldingSlot['position'],
  }))
}

function makeValidLineup(roster: Player[]): Lineup {
  const positions = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'LCF', 'RCF', 'RF']
  const fieldingSlots: FieldingSlot[] = roster.slice(0, 10).map((p, i) => ({
    gameId: 'g1',
    inning: 1,
    playerId: p.id,
    position: positions[i] as FieldingSlot['position'],
  }))

  return {
    gameId: 'g1',
    fieldingSlots,
    battingSlots: [],
  }
}

// ─── Valid lineup ─────────────────────────────────────────────────────────────

describe('valid lineup', () => {
  it('returns no violations for a structurally valid lineup', () => {
    const roster = makeRoster(7, 3)
    const lineup = makeValidLineup(roster)
    const violations = validateLineup(lineup, roster)
    expect(violations).toHaveLength(0)
  })
})

// ─── Gender field minimum ─────────────────────────────────────────────────────

describe('gender field minimum violations', () => {
  it('produces an error when fewer than 3 women are on the field in an inning (with 3+ women on roster)', () => {
    const roster = makeRoster(8, 3)
    const slotsWithOneWoman: FieldingSlot[] = [
      { gameId: 'g1', inning: 1, playerId: 'w0', position: 'LF' },
      { gameId: 'g1', inning: 1, playerId: 'm0', position: 'P' },
      { gameId: 'g1', inning: 1, playerId: 'm1', position: 'C' },
      { gameId: 'g1', inning: 1, playerId: 'm2', position: '1B' },
      { gameId: 'g1', inning: 1, playerId: 'm3', position: '2B' },
      { gameId: 'g1', inning: 1, playerId: 'm4', position: '3B' },
      { gameId: 'g1', inning: 1, playerId: 'm5', position: 'SS' },
      { gameId: 'g1', inning: 1, playerId: 'm6', position: 'LCF' },
      { gameId: 'g1', inning: 1, playerId: 'm7', position: 'RCF' },
      { gameId: 'g1', inning: 1, playerId: 'm0', position: 'RF' },
    ]

    const lineup: Lineup = { gameId: 'g1', fieldingSlots: slotsWithOneWoman, battingSlots: [] }
    const violations = validateLineup(lineup, roster)
    const genderViolations = violations.filter((v) => v.rule === 'gender-minimum')
    expect(genderViolations.length).toBeGreaterThanOrEqual(1)
    expect(genderViolations[0].severity).toBe('error')
  })
})

// ─── Field count ──────────────────────────────────────────────────────────────

describe('field count violations', () => {
  it('produces an error when fewer than 10 players are on the field in an inning', () => {
    const roster = makeRoster(6, 3)
    // Only 9 players in inning 1
    const slots: FieldingSlot[] = roster.map((p, i) => ({
      gameId: 'g1',
      inning: 1,
      playerId: p.id,
      position: (['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'LCF', 'RCF'] as FieldingSlot['position'][])[i],
    }))

    const lineup: Lineup = { gameId: 'g1', fieldingSlots: slots, battingSlots: [] }
    const violations = validateLineup(lineup, roster)
    const countViolations = violations.filter((v) => v.rule === 'field-count')
    expect(countViolations.length).toBeGreaterThanOrEqual(1)
    expect(countViolations[0].severity).toBe('error')
  })

  it('does not produce a field-count error when exactly 10 players are on the field', () => {
    const roster = makeRoster(7, 3)
    const lineup = makeValidLineup(roster)
    const violations = validateLineup(lineup, roster)
    const countViolations = violations.filter((v) => v.rule === 'field-count')
    expect(countViolations).toHaveLength(0)
  })
})
