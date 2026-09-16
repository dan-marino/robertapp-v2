// ─── Counting Stats ───────────────────────────────────────────────────────────

export interface GameStatCounts {
  s1b: number
  s2b: number
  s3b: number
  hr: number
  bb: number
  k: number
  fo: number
  fc: number
  go: number
  sf: number
  rbi: number
  r: number
}

export const ZERO_COUNTS: GameStatCounts = {
  s1b: 0,
  s2b: 0,
  s3b: 0,
  hr: 0,
  bb: 0,
  k: 0,
  fo: 0,
  fc: 0,
  go: 0,
  sf: 0,
  rbi: 0,
  r: 0,
}

// ─── Derived Stats ────────────────────────────────────────────────────────────

export interface DerivedStats {
  ab: number
  h: number
  tb: number
  ba: number | null
  obp: number | null
  slg: number | null
}

// ─── Composite Result Types ───────────────────────────────────────────────────

export type GameStatResult = GameStatCounts &
  DerivedStats & {
    gameId: string
    playerId: string
  }

export interface SeasonStatResult extends GameStatCounts, DerivedStats {
  playerId: string
  name: string
  g: number
}

// ─── Pure Computation Functions ───────────────────────────────────────────────

/** AB = s1b + s2b + s3b + hr + k + fo + fc + go (BB and SF excluded per ADR-0002) */
export function computeAB(counts: GameStatCounts): number {
  return counts.s1b + counts.s2b + counts.s3b + counts.hr + counts.k + counts.fo + counts.fc + counts.go
}

/** H = s1b + s2b + s3b + hr */
export function computeH(counts: GameStatCounts): number {
  return counts.s1b + counts.s2b + counts.s3b + counts.hr
}

/** TB = s1b + (2 × s2b) + (3 × s3b) + (4 × hr) */
export function computeTB(counts: GameStatCounts): number {
  return counts.s1b + 2 * counts.s2b + 3 * counts.s3b + 4 * counts.hr
}

/** BA = H / AB; null when AB = 0 */
export function computeBA(counts: GameStatCounts): number | null {
  const ab = computeAB(counts)
  if (ab === 0) return null
  return computeH(counts) / ab
}

/**
 * OBP = (H + BB) / AB; null when AB = 0
 * Per ADR-0001: intentionally non-standard — SF excluded from denominator, HBP not tracked.
 */
export function computeOBP(counts: GameStatCounts): number | null {
  const ab = computeAB(counts)
  if (ab === 0) return null
  return (computeH(counts) + counts.bb) / ab
}

/** SLG = TB / AB; null when AB = 0 */
export function computeSLG(counts: GameStatCounts): number | null {
  const ab = computeAB(counts)
  if (ab === 0) return null
  return computeTB(counts) / ab
}

/** Convenience wrapper that computes all derived stats from counting stats. */
export function computeDerivedStats(counts: GameStatCounts): DerivedStats {
  return {
    ab: computeAB(counts),
    h: computeH(counts),
    tb: computeTB(counts),
    ba: computeBA(counts),
    obp: computeOBP(counts),
    slg: computeSLG(counts),
  }
}
