import { describe, expect, it } from 'vitest'
import {
  computeAB,
  computeH,
  computeTB,
  computeBA,
  computeOBP,
  computeSLG,
  computeDerivedStats,
} from '../gameStats'
import type { GameStatCounts } from '../gameStats'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function zeroCounts(): GameStatCounts {
  return { s1b: 0, s2b: 0, s3b: 0, hr: 0, bb: 0, k: 0, fo: 0, fc: 0, go: 0, sf: 0, rbi: 0, r: 0 }
}

// ─── computeAB ────────────────────────────────────────────────────────────────

describe('computeAB', () => {
  it('returns 0 for all-zero counts', () => {
    expect(computeAB(zeroCounts())).toBe(0)
  })

  it('sums s1b + s2b + s3b + hr + k + fo + fc + go', () => {
    const counts: GameStatCounts = {
      ...zeroCounts(),
      s1b: 1,
      s2b: 1,
      s3b: 1,
      hr: 1,
      k: 1,
      fo: 1,
      fc: 1,
      go: 1,
    }
    expect(computeAB(counts)).toBe(8)
  })

  it('excludes bb and sf from AB', () => {
    const counts: GameStatCounts = { ...zeroCounts(), bb: 3, sf: 2 }
    expect(computeAB(counts)).toBe(0)
  })

  it('excludes rbi and r from AB', () => {
    const counts: GameStatCounts = { ...zeroCounts(), s1b: 2, rbi: 5, r: 3 }
    expect(computeAB(counts)).toBe(2)
  })
})

// ─── computeH ────────────────────────────────────────────────────────────────

describe('computeH', () => {
  it('returns 0 for all-zero counts', () => {
    expect(computeH(zeroCounts())).toBe(0)
  })

  it('sums s1b + s2b + s3b + hr', () => {
    const counts: GameStatCounts = { ...zeroCounts(), s1b: 2, s2b: 1, s3b: 1, hr: 1 }
    expect(computeH(counts)).toBe(5)
  })

  it('excludes outs and walks from H', () => {
    const counts: GameStatCounts = { ...zeroCounts(), s1b: 1, k: 2, fo: 1, bb: 3 }
    expect(computeH(counts)).toBe(1)
  })
})

// ─── computeTB ───────────────────────────────────────────────────────────────

describe('computeTB', () => {
  it('returns 0 for all-zero counts', () => {
    expect(computeTB(zeroCounts())).toBe(0)
  })

  it('weights s1b=1, s2b=2, s3b=3, hr=4', () => {
    const counts: GameStatCounts = { ...zeroCounts(), s1b: 1, s2b: 1, s3b: 1, hr: 1 }
    expect(computeTB(counts)).toBe(10) // 1 + 2 + 3 + 4
  })

  it('handles multiple home runs', () => {
    const counts: GameStatCounts = { ...zeroCounts(), hr: 3 }
    expect(computeTB(counts)).toBe(12)
  })
})

// ─── computeBA ───────────────────────────────────────────────────────────────

describe('computeBA', () => {
  it('returns null when AB = 0', () => {
    expect(computeBA(zeroCounts())).toBeNull()
  })

  it('returns null when only bb and sf (no AB)', () => {
    const counts: GameStatCounts = { ...zeroCounts(), bb: 2, sf: 1 }
    expect(computeBA(counts)).toBeNull()
  })

  it('returns H / AB', () => {
    const counts: GameStatCounts = { ...zeroCounts(), s1b: 2, k: 2 }
    // H = 2, AB = 4
    expect(computeBA(counts)).toBe(0.5)
  })

  it('returns 0 when no hits but has outs', () => {
    const counts: GameStatCounts = { ...zeroCounts(), k: 3, fo: 1 }
    // H = 0, AB = 4
    expect(computeBA(counts)).toBe(0)
  })
})

// ─── computeOBP ──────────────────────────────────────────────────────────────

describe('computeOBP', () => {
  it('returns null when AB = 0', () => {
    expect(computeOBP(zeroCounts())).toBeNull()
  })

  it('returns null when only bb and sf (no AB)', () => {
    const counts: GameStatCounts = { ...zeroCounts(), bb: 4, sf: 2 }
    expect(computeOBP(counts)).toBeNull()
  })

  it('uses (H + BB) / AB, not the standard formula', () => {
    // Standard formula would use (H + BB) / (AB + BB + SF)
    // ADR-0001: this app uses (H + BB) / AB
    const counts: GameStatCounts = { ...zeroCounts(), s1b: 1, bb: 1, k: 2, sf: 1 }
    // H = 1, BB = 1, AB = 3 (s1b + k + k — sf excluded from AB)
    // OBP = (1 + 1) / 3 ≈ 0.6667
    // Standard OBP would be (1 + 1) / (3 + 1 + 1) = 2/5 = 0.4 — intentionally different
    expect(computeOBP(counts)).toBeCloseTo(2 / 3)
  })

  it('returns H / AB when no walks', () => {
    const counts: GameStatCounts = { ...zeroCounts(), s1b: 2, go: 2 }
    // H = 2, BB = 0, AB = 4; OBP = 2/4 = 0.5 (same as BA when no walks)
    expect(computeOBP(counts)).toBe(0.5)
  })
})

// ─── computeSLG ──────────────────────────────────────────────────────────────

describe('computeSLG', () => {
  it('returns null when AB = 0', () => {
    expect(computeSLG(zeroCounts())).toBeNull()
  })

  it('returns TB / AB', () => {
    const counts: GameStatCounts = { ...zeroCounts(), hr: 1, k: 1 }
    // TB = 4, AB = 2; SLG = 2.0
    expect(computeSLG(counts)).toBe(2)
  })

  it('returns 0 when no extra-base hits and no singles', () => {
    const counts: GameStatCounts = { ...zeroCounts(), k: 2, fo: 2 }
    expect(computeSLG(counts)).toBe(0)
  })
})

// ─── computeDerivedStats ──────────────────────────────────────────────────────

describe('computeDerivedStats', () => {
  it('returns all null rate stats for zero counts', () => {
    const result = computeDerivedStats(zeroCounts())
    expect(result.ab).toBe(0)
    expect(result.h).toBe(0)
    expect(result.tb).toBe(0)
    expect(result.ba).toBeNull()
    expect(result.obp).toBeNull()
    expect(result.slg).toBeNull()
  })

  it('returns correct derived stats for a typical game line', () => {
    // 1B GO BB HR FO — PA string example from ADR-0002
    const counts: GameStatCounts = { ...zeroCounts(), s1b: 1, go: 1, bb: 1, hr: 1, fo: 1 }
    const result = computeDerivedStats(counts)
    // AB = 1+1+1+1 = 4 (bb excluded)
    expect(result.ab).toBe(4)
    // H = 1 + 1 = 2
    expect(result.h).toBe(2)
    // TB = 1 + 4 = 5
    expect(result.tb).toBe(5)
    // BA = 2/4 = 0.5
    expect(result.ba).toBe(0.5)
    // OBP = (2 + 1) / 4 = 0.75
    expect(result.obp).toBe(0.75)
    // SLG = 5/4 = 1.25
    expect(result.slg).toBe(1.25)
  })
})
