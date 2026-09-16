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

export interface DerivedStats {
  ab: number
  h: number
  tb: number
  ba: number | null
  obp: number | null
  slg: number | null
}

export interface PlayerSeasonStats extends GameStatCounts, DerivedStats {
  playerId: string
  name: string
  g: number
}

export function computeDerivedStats(counts: GameStatCounts): DerivedStats {
  const ab = counts.s1b + counts.s2b + counts.s3b + counts.hr + counts.k + counts.fo + counts.fc + counts.go
  const h = counts.s1b + counts.s2b + counts.s3b + counts.hr
  const tb = counts.s1b + 2 * counts.s2b + 3 * counts.s3b + 4 * counts.hr

  if (ab === 0) {
    return { ab, h, tb, ba: null, obp: null, slg: null }
  }

  const ba = h / ab
  const obp = (h + counts.bb) / ab
  const slg = tb / ab

  return { ab, h, tb, ba, obp, slg }
}
