import { describe, expect, it } from 'vitest'
import { validateLineup } from '../constraintValidator'
import type { Lineup, Player, PositionPreference, FieldingSlot, BattingSlot } from '../types'

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

/** Build a minimal valid lineup for a 10-player roster over 1 inning */
function makeFieldingSlots(assignments: Array<{ playerId: string; position: string }>, inning = 1): FieldingSlot[] {
  return assignments.map(({ playerId, position }) => ({
    gameId: 'g1',
    inning,
    playerId,
    position: position as FieldingSlot['position'],
  }))
}

function makeBattingSlots(order: string[]): BattingSlot[] {
  return order.map((playerId, i) => ({
    gameId: 'g1',
    playerId,
    orderIndex: i + 1,
    genderGroup: 'All',
  }))
}

function makeValidLineup(roster: Player[]): Lineup {
  const positions = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'LCF', 'RCF', 'RF']
  const fieldingSlots: FieldingSlot[] = roster.map((p, i) => ({
    gameId: 'g1',
    inning: 1,
    playerId: p.id,
    position: positions[i] as FieldingSlot['position'],
  }))

  // Batting: women at slots 3, 6, 9; men fill the rest
  const men = roster.filter((p) => p.gender === 'M')
  const women = roster.filter((p) => p.gender === 'F')
  const order: string[] = []
  let mi = 0, wi = 0
  for (let slot = 1; slot <= 10; slot++) {
    if (slot === 3 || slot === 6 || slot === 9) {
      order.push(women[wi++].id)
    } else {
      order.push(men[mi++].id)
    }
  }

  return {
    gameId: 'g1',
    fieldingSlots,
    battingSlots: makeBattingSlots(order),
  }
}

// ─── Valid lineup ─────────────────────────────────────────────────────────────

describe('valid lineup', () => {
  it('returns no violations for a structurally valid lineup', () => {
    const roster = makeRoster(7, 3)
    const lineup = makeValidLineup(roster)
    const violations = validateLineup(lineup, roster, [])
    expect(violations).toHaveLength(0)
  })
})

// ─── Anti-position ────────────────────────────────────────────────────────────

describe('Anti-position violations', () => {
  it('produces an error when a player is assigned to their Anti position', () => {
    const roster = makeRoster(7, 3)
    const lineup = makeValidLineup(roster)
    // m0 is assigned to P (index 0 in positions array above)
    const prefs: PositionPreference[] = [{ playerId: 'm0', position: 'P', tier: 'Anti' }]

    const violations = validateLineup(lineup, roster, prefs)
    const antiViolations = violations.filter((v) => v.rule === 'anti-position')
    expect(antiViolations.length).toBeGreaterThanOrEqual(1)
    expect(antiViolations[0].severity).toBe('error')
    expect(antiViolations[0].playerIds).toContain('m0')
  })
})

// ─── Gender field minimum ─────────────────────────────────────────────────────

describe('gender field minimum violations', () => {
  it('produces an error when fewer than 3 women are on the field in an inning (with 3+ women on roster)', () => {
    const roster = makeRoster(8, 3) // 11 players, but 1 will sit
    // Build an inning where only 1 woman plays
    const positions = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'LCF', 'RCF', 'RF']
    const fieldingSlots: FieldingSlot[] = [
      { gameId: 'g1', inning: 1, playerId: 'w0', position: 'LF' },
      ...['m0','m1','m2','m3','m4','m5','m6','m7'].map((id, i) => ({
        gameId: 'g1',
        inning: 1,
        playerId: id,
        position: positions[i + 1] as FieldingSlot['position'],
      })),
      { gameId: 'g1', inning: 1, playerId: 'm0', position: 'RF' }, // intentionally only 9 unique
    ]

    // Just 1 woman on field (w0), but roster has 3 women
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
      { gameId: 'g1', inning: 1, playerId: 'm0', position: 'RF' }, // duplicate OK for test
    ]

    const lineup: Lineup = {
      gameId: 'g1',
      fieldingSlots: slotsWithOneWoman,
      battingSlots: [],
    }

    const violations = validateLineup(lineup, roster, [])
    const genderViolations = violations.filter((v) => v.rule === 'gender-minimum')
    expect(genderViolations.length).toBeGreaterThanOrEqual(1)
    expect(genderViolations[0].severity).toBe('error')
  })
})

// ─── Innings fairness ─────────────────────────────────────────────────────────

describe('innings fairness violations', () => {
  it('produces an error when a player plays 2+ fewer innings than others', () => {
    const roster = makeRoster(7, 3)
    // m0 plays 0 innings; everyone else plays 2 innings → difference = 2 > 1 → violation
    const basePositions: FieldingSlot['position'][] = ['C', '1B', '2B', '3B', 'SS', 'LF', 'LCF', 'RCF', 'RF']
    const fieldingSlots: FieldingSlot[] = [1, 2].flatMap((inning) =>
      roster
        .filter((p) => p.id !== 'm0')
        .map((p, i) => ({
          gameId: 'g1',
          inning,
          playerId: p.id,
          position: basePositions[i],
        }))
    )

    const lineup: Lineup = { gameId: 'g1', fieldingSlots, battingSlots: [] }
    const violations = validateLineup(lineup, roster, [])

    const fairnessViolations = violations.filter((v) => v.rule === 'innings-fairness')
    expect(fairnessViolations.length).toBeGreaterThanOrEqual(1)
    expect(fairnessViolations[0].severity).toBe('error')
  })
})

// ─── Preference downgrade ─────────────────────────────────────────────────────

describe('preference downgrade violations', () => {
  it('produces a warning (not error) when a player is assigned below their preferred tier', () => {
    const roster = makeRoster(7, 3)
    const lineup = makeValidLineup(roster)
    // m0 is assigned to P, but has Tier1 for SS
    const prefs: PositionPreference[] = [{ playerId: 'm0', position: 'SS', tier: 'Tier1' }]

    const violations = validateLineup(lineup, roster, prefs)
    const downgrades = violations.filter((v) => v.rule === 'preference-downgrade')
    expect(downgrades.length).toBeGreaterThanOrEqual(1)
    expect(downgrades[0].severity).toBe('warning')
    expect(downgrades[0].playerIds).toContain('m0')
  })
})

// ─── Co-ed batting rules ──────────────────────────────────────────────────────

describe('co-ed batting rule violations', () => {
  it('produces an error when a woman bats in slot 1', () => {
    const roster = makeRoster(7, 3)
    const positions = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'LCF', 'RCF', 'RF']
    const fieldingSlots: FieldingSlot[] = roster.map((p, i) => ({
      gameId: 'g1', inning: 1, playerId: p.id, position: positions[i] as FieldingSlot['position'],
    }))

    // w0 bats first
    const men = roster.filter((p) => p.gender === 'M')
    const women = roster.filter((p) => p.gender === 'F')
    const order = [women[0].id, ...men.map((m) => m.id), women[1].id, women[2].id]

    const lineup: Lineup = {
      gameId: 'g1',
      fieldingSlots,
      battingSlots: makeBattingSlots(order),
    }

    const violations = validateLineup(lineup, roster, [])
    const battingViolations = violations.filter((v) => v.rule === 'batting-slot-restriction')
    expect(battingViolations.length).toBeGreaterThanOrEqual(1)
    expect(battingViolations[0].severity).toBe('error')
  })

  it('produces an error when more than 3 consecutive men appear in the batting order', () => {
    const roster = makeRoster(7, 3)
    const positions = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'LCF', 'RCF', 'RF']
    const fieldingSlots: FieldingSlot[] = roster.map((p, i) => ({
      gameId: 'g1', inning: 1, playerId: p.id, position: positions[i] as FieldingSlot['position'],
    }))

    // 4 consecutive men at the start (after slot 1,2 men) → violates 3-man rule
    // Order: m0 m1 m2 m3 m4 w0 m5 m6 w1 w2 → 5 consecutive men before first woman
    const men = roster.filter((p) => p.gender === 'M')
    const women = roster.filter((p) => p.gender === 'F')
    const order = [men[0].id, men[1].id, men[2].id, men[3].id, men[4].id, women[0].id, men[5].id, men[6].id, women[1].id, women[2].id]

    const lineup: Lineup = {
      gameId: 'g1',
      fieldingSlots,
      battingSlots: makeBattingSlots(order),
    }

    const violations = validateLineup(lineup, roster, [])
    const battingViolations = violations.filter((v) => v.rule === 'consecutive-men')
    expect(battingViolations.length).toBeGreaterThanOrEqual(1)
    expect(battingViolations[0].severity).toBe('error')
  })
})
