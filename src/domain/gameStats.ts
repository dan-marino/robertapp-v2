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

export interface GameStatDerived {
  ab: number
  h: number
  tb: number
  ba: number | null
  obp: number | null
  slg: number | null
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

export function computeDerivedStats(counts: GameStatCounts): GameStatDerived {
  const { s1b, s2b, s3b, hr, bb, k, fo, fc, go } = counts

  const h = s1b + s2b + s3b + hr
  const ab = s1b + s2b + s3b + hr + k + fo + fc + go
  const tb = s1b + 2 * s2b + 3 * s3b + 4 * hr

  const ba = ab === 0 ? null : h / ab
  const obp = ab === 0 ? null : (h + bb) / ab
  const slg = ab === 0 ? null : tb / ab

  return { ab, h, tb, ba, obp, slg }
}
