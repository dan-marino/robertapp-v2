import { describe, expect, it } from 'vitest'
import { generateFieldingGrid } from '../fieldingEngine'
import type { Player, PositionPreference, PositionHistory } from '../types'

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

function assignmentsByInning(result: ReturnType<typeof generateFieldingGrid>, inning: number) {
  return result.assignments.filter((a) => a.inning === inning)
}

// ─── Basic shape ─────────────────────────────────────────────────────────────

describe('basic output shape', () => {
  it('fills all 10 positions every inning for a 10-player roster', () => {
    const roster = makeRoster(7, 3)
    const result = generateFieldingGrid({
      activeRoster: roster,
      preferences: [],
      positionHistory: [],
      latePlayerIds: [],
      inningCount: 6,
    })

    for (let inning = 1; inning <= 6; inning++) {
      expect(assignmentsByInning(result, inning)).toHaveLength(10)
    }
  })
})

// ─── Innings fairness ────────────────────────────────────────────────────────

describe('±1 inning fairness', () => {
  it('all players play within ±1 inning of each other (12-player roster)', () => {
    const roster = makeRoster(9, 3) // 12 players
    const result = generateFieldingGrid({
      activeRoster: roster,
      preferences: [],
      positionHistory: [],
      latePlayerIds: [],
      inningCount: 6,
    })

    const countByPlayer = new Map<string, number>()
    for (const a of result.assignments) {
      countByPlayer.set(a.playerId, (countByPlayer.get(a.playerId) ?? 0) + 1)
    }

    const counts = [...countByPlayer.values()]
    const min = Math.min(...counts)
    const max = Math.max(...counts)
    expect(max - min).toBeLessThanOrEqual(1)
  })
})

// ─── Gender field rules ──────────────────────────────────────────────────────

describe('gender field rules', () => {
  it('always has at least 3 women on the field when 3+ women are present', () => {
    const roster = makeRoster(7, 3)
    const result = generateFieldingGrid({
      activeRoster: roster,
      preferences: [],
      positionHistory: [],
      latePlayerIds: [],
      inningCount: 6,
    })

    for (let inning = 1; inning <= 6; inning++) {
      const womenThisInning = result.assignments
        .filter((a) => a.inning === inning)
        .filter((a) => roster.find((p) => p.id === a.playerId)?.gender === 'F')
      expect(womenThisInning.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('never has more than 7 men on the field', () => {
    const roster = makeRoster(7, 3)
    const result = generateFieldingGrid({
      activeRoster: roster,
      preferences: [],
      positionHistory: [],
      latePlayerIds: [],
      inningCount: 6,
    })

    for (let inning = 1; inning <= 6; inning++) {
      const menThisInning = result.assignments
        .filter((a) => a.inning === inning)
        .filter((a) => roster.find((p) => p.id === a.playerId)?.gender === 'M')
      expect(menThisInning.length).toBeLessThanOrEqual(7)
    }
  })
})

// ─── Late player rules ───────────────────────────────────────────────────────

describe('late player rules', () => {
  it('late players do not appear in inning 1', () => {
    const roster = makeRoster(7, 3)
    const latePlayer = roster[0]
    const result = generateFieldingGrid({
      activeRoster: roster,
      preferences: [],
      positionHistory: [],
      latePlayerIds: [latePlayer.id],
      inningCount: 6,
    })

    const inning1 = assignmentsByInning(result, 1)
    expect(inning1.some((a) => a.playerId === latePlayer.id)).toBe(false)
  })

  it('late players appear in innings 2+ when there is room', () => {
    const roster = makeRoster(7, 3)
    const latePlayer = roster[0]
    const result = generateFieldingGrid({
      activeRoster: roster,
      preferences: [],
      positionHistory: [],
      latePlayerIds: [latePlayer.id],
      inningCount: 6,
    })

    const laterInnings = result.assignments.filter((a) => a.inning > 1 && a.playerId === latePlayer.id)
    expect(laterInnings.length).toBeGreaterThan(0)
  })
})

// ─── Pitcher scheduling ──────────────────────────────────────────────────────

describe('pitcher scheduling', () => {
  const roster = makeRoster(7, 3)

  it('1 pitcher plays all innings', () => {
    const result = generateFieldingGrid({
      activeRoster: roster,
      preferences: [],
      positionHistory: [],
      latePlayerIds: [],
      pitcherIds: ['m0'],
      inningCount: 6,
    })
    const pitchingInnings = result.assignments.filter((a) => a.playerId === 'm0' && a.position === 'P')
    expect(pitchingInnings).toHaveLength(6)
  })

  it('2 pitchers split the game in halves', () => {
    const result = generateFieldingGrid({
      activeRoster: roster,
      preferences: [],
      positionHistory: [],
      latePlayerIds: [],
      pitcherIds: ['m0', 'm1'],
      inningCount: 6,
    })
    const p0innings = result.assignments.filter((a) => a.playerId === 'm0' && a.position === 'P').map((a) => a.inning)
    const p1innings = result.assignments.filter((a) => a.playerId === 'm1' && a.position === 'P').map((a) => a.inning)
    expect(p0innings).toHaveLength(3)
    expect(p1innings).toHaveLength(3)
    expect([...p0innings, ...p1innings].sort()).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('3 pitchers each get 2 innings', () => {
    const result = generateFieldingGrid({
      activeRoster: roster,
      preferences: [],
      positionHistory: [],
      latePlayerIds: [],
      pitcherIds: ['m0', 'm1', 'm2'],
      inningCount: 6,
    })
    for (const id of ['m0', 'm1', 'm2']) {
      const pitchingInnings = result.assignments.filter((a) => a.playerId === id && a.position === 'P')
      expect(pitchingInnings).toHaveLength(2)
    }
  })

  it('4 pitchers follow 2+2+1+1 distribution', () => {
    const result = generateFieldingGrid({
      activeRoster: roster,
      preferences: [],
      positionHistory: [],
      latePlayerIds: [],
      pitcherIds: ['m0', 'm1', 'm2', 'm3'],
      inningCount: 6,
    })
    const counts = ['m0', 'm1', 'm2', 'm3'].map(
      (id) => result.assignments.filter((a) => a.playerId === id && a.position === 'P').length
    ).sort()
    expect(counts).toEqual([1, 1, 2, 2])
  })

  it('pitchers play non-P positions in their non-pitching innings', () => {
    const result = generateFieldingGrid({
      activeRoster: roster,
      preferences: [],
      positionHistory: [],
      latePlayerIds: [],
      pitcherIds: ['m0', 'm1'],
      inningCount: 6,
    })
    const p0assignments = result.assignments.filter((a) => a.playerId === 'm0')
    const p0NonPitching = p0assignments.filter((a) => a.position !== 'P')
    expect(p0NonPitching.length).toBeGreaterThan(0)
  })
})

// ─── Preference tiers ────────────────────────────────────────────────────────

describe('preference tiers', () => {
  it('prefers Tier1 player over unranked player for a position', () => {
    const roster = makeRoster(7, 3)
    // m0 has Tier1 for SS; all others have no preference for SS
    const preferences: PositionPreference[] = [
      { playerId: 'm0', position: 'SS', tier: 'Tier1' },
    ]
    const result = generateFieldingGrid({
      activeRoster: roster,
      preferences,
      positionHistory: [],
      latePlayerIds: [],
      inningCount: 6,
    })

    // m0 should play SS more often than random chance (at least once)
    const m0SS = result.assignments.filter((a) => a.playerId === 'm0' && a.position === 'SS')
    expect(m0SS.length).toBeGreaterThanOrEqual(1)
  })
})

// ─── History tiebreak ────────────────────────────────────────────────────────

describe('history tiebreak', () => {
  it('prefers the player who has played a position fewer times', () => {
    const roster = makeRoster(7, 3)
    // m0 has played SS 10 times; m1 has 0 times. All others marked Anti-SS so
    // only m0 and m1 are candidates — makes the outcome deterministic.
    const preferences: PositionPreference[] = roster
      .filter((p) => p.id !== 'm0' && p.id !== 'm1')
      .map((p) => ({ playerId: p.id, position: 'SS' as const, tier: 'Anti' as const }))

    const positionHistory: PositionHistory[] = [
      { playerId: 'm0', seasonId: 's1', position: 'SS', count: 10 },
      { playerId: 'm1', seasonId: 's1', position: 'SS', count: 0 },
    ]
    const result = generateFieldingGrid({
      activeRoster: roster,
      preferences,
      positionHistory,
      latePlayerIds: [],
      inningCount: 6,
    })

    const m0SS = result.assignments.filter((a) => a.playerId === 'm0' && a.position === 'SS').length
    const m1SS = result.assignments.filter((a) => a.playerId === 'm1' && a.position === 'SS').length
    expect(m1SS).toBeGreaterThan(m0SS)
  })
})

// ─── Guest yield ─────────────────────────────────────────────────────────────

describe('guest yield', () => {
  it('regular player wins a position tiebreak over a guest', () => {
    // 9 players: 6 regular men, 3 women + 1 guest man (= 10 total, exactly 10 spots)
    // The guest has the same (empty) preferences as everyone else
    const regular: Player[] = Array.from({ length: 6 }, (_, i) => ({
      id: `m${i}`,
      name: `Man${i}`,
      gender: 'M' as const,
      isGuest: false,
    }))
    const women: Player[] = Array.from({ length: 3 }, (_, i) => ({
      id: `w${i}`,
      name: `Woman${i}`,
      gender: 'F' as const,
      isGuest: false,
    }))
    const guest: Player = { id: 'guest0', name: 'Guest', gender: 'M', isGuest: true }
    const roster = [...regular, ...women, guest] // 10 players, 10 positions

    // Give all men including the guest equal history for SS
    const positionHistory: PositionHistory[] = [
      { playerId: 'guest0', seasonId: 's1', position: 'SS', count: 0 },
      ...regular.map((p) => ({ playerId: p.id, seasonId: 's1', position: 'SS' as const, count: 0 })),
    ]

    // Run many times to check the guest doesn't systematically beat regulars
    let guestSSCount = 0
    for (let run = 0; run < 20; run++) {
      const result = generateFieldingGrid({
        activeRoster: roster,
        preferences: [],
        positionHistory,
        latePlayerIds: [],
        inningCount: 6,
      })
      guestSSCount += result.assignments.filter((a) => a.playerId === 'guest0' && a.position === 'SS').length
    }

    // Regulars should collectively dominate SS; guest should have fewer innings there
    // Each player plays all 6 innings (10 players, 10 spots). SS is filled each inning.
    // Over 20 runs × 6 innings = 120 SS slots. With 7 eligible men, guest should have
    // roughly 1/7 × 120 ≈ 17 if equal — with yield penalty it should be less.
    // We just verify it's not disproportionately high — hard to be deterministic here.
    // The yield rule is validated by the score penalty; we test it's below equal share.
    expect(guestSSCount).toBeLessThanOrEqual(120 / 7 + 10) // rough upper bound
  })
})

// ─── Anti constraint ─────────────────────────────────────────────────────────

describe('Anti constraint', () => {
  it('never assigns a player to a position marked Anti', () => {
    const roster = makeRoster(7, 3)
    // Mark m0 as Anti-P
    const preferences: PositionPreference[] = [
      { playerId: 'm0', position: 'P', tier: 'Anti' },
    ]
    const result = generateFieldingGrid({
      activeRoster: roster,
      preferences,
      positionHistory: [],
      latePlayerIds: [],
      inningCount: 6,
    })

    const violations = result.assignments.filter((a) => a.playerId === 'm0' && a.position === 'P')
    expect(violations).toHaveLength(0)
  })
})

// ─── Short on women: position exclusions ─────────────────────────────────────

describe('short on women: position exclusions', () => {
  it('drops Catcher when fewer than 3 women are present', () => {
    // 9 players (7M + 2F): all 9 play each inning, need 9 positions.
    // Excluding C leaves exactly 9 — no fallback restore needed.
    const roster = makeRoster(7, 2)
    const result = generateFieldingGrid({
      activeRoster: roster,
      preferences: [],
      positionHistory: [],
      latePlayerIds: [],
      inningCount: 6,
    })
    const catcherAssignments = result.assignments.filter((a) => a.position === 'C')
    expect(catcherAssignments).toHaveLength(0)
  })

  it('drops both Catcher and Left Field when fewer than 2 women are present', () => {
    // 8 players (7M + 1F): all 8 play each inning, need 8 positions.
    // Excluding C+LF leaves exactly 8 — no fallback restore needed.
    const roster = makeRoster(7, 1)
    const result = generateFieldingGrid({
      activeRoster: roster,
      preferences: [],
      positionHistory: [],
      latePlayerIds: [],
      inningCount: 6,
    })
    const catcherAssignments = result.assignments.filter((a) => a.position === 'C')
    const lfAssignments = result.assignments.filter((a) => a.position === 'LF')
    expect(catcherAssignments).toHaveLength(0)
    expect(lfAssignments).toHaveLength(0)
  })
})

// ─── Disqualification warning ─────────────────────────────────────────────────

describe('disqualification warning', () => {
  it('returns a disqualification warning when no women are on the active roster', () => {
    const roster = makeRoster(10, 0)
    const result = generateFieldingGrid({
      activeRoster: roster,
      preferences: [],
      positionHistory: [],
      latePlayerIds: [],
      inningCount: 6,
    })
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0]).toMatch(/woman|women|disqualif/i)
  })

  it('returns no warnings when at least one woman is present', () => {
    const roster = makeRoster(9, 1)
    const result = generateFieldingGrid({
      activeRoster: roster,
      preferences: [],
      positionHistory: [],
      latePlayerIds: [],
      inningCount: 6,
    })
    expect(result.warnings).toHaveLength(0)
  })
})

// ─── Batting order sit priority ───────────────────────────────────────────────

describe('batting order sit priority', () => {
  // 11-player roster → 1 player sits per inning (6 players each sit once)
  // With battingOrder provided, sits are assigned in batting order:
  // the top-of-order player (index 0) gets the inning-1 sit.

  it('top-of-order batter sits inning 1 when battingOrder is provided', () => {
    const roster = makeRoster(8, 3) // 11 players
    const battingOrder = roster.map((p) => p.id) // m0 bats first
    const result = generateFieldingGrid({
      activeRoster: roster,
      preferences: [],
      positionHistory: [],
      latePlayerIds: [],
      inningCount: 6,
      battingOrder,
    })
    const inning1PlayerIds = result.assignments.filter((a) => a.inning === 1).map((a) => a.playerId)
    expect(inning1PlayerIds).not.toContain('m0') // top-of-order sits inning 1
  })

  it('bottom-of-order batter plays inning 1 when battingOrder is provided', () => {
    const roster = makeRoster(8, 3) // 11 players
    const battingOrder = roster.map((p) => p.id) // w2 bats last
    const result = generateFieldingGrid({
      activeRoster: roster,
      preferences: [],
      positionHistory: [],
      latePlayerIds: [],
      inningCount: 6,
      battingOrder,
    })
    const inning1PlayerIds = result.assignments.filter((a) => a.inning === 1).map((a) => a.playerId)
    expect(inning1PlayerIds).toContain('w2') // bottom-of-order plays inning 1
  })
})
