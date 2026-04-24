import { describe, expect, it } from 'vitest'
import { getPreferenceTier, isAnti } from '../preferenceEngine'
import type { PositionPreference } from '../types'

const prefs: PositionPreference[] = [
  { playerId: 'p1', position: 'P', tier: 'Tier1' },
  { playerId: 'p1', position: 'C', tier: 'Tier2' },
  { playerId: 'p1', position: 'LF', tier: 'Anti' },
]

describe('getPreferenceTier', () => {
  it('returns the declared tier for a position', () => {
    expect(getPreferenceTier(prefs, 'p1', 'P')).toBe('Tier1')
  })

  it('returns null when no preference is declared for that position', () => {
    expect(getPreferenceTier(prefs, 'p1', 'SS')).toBeNull()
  })

  it('returns Anti for an Anti-marked position', () => {
    expect(getPreferenceTier(prefs, 'p1', 'LF')).toBe('Anti')
  })
})

describe('isAnti', () => {
  it('returns true for an Anti-marked position', () => {
    expect(isAnti(prefs, 'p1', 'LF')).toBe(true)
  })

  it('returns false for a non-Anti tier', () => {
    expect(isAnti(prefs, 'p1', 'P')).toBe(false)
  })

  it('returns false when no preference is declared', () => {
    expect(isAnti(prefs, 'p1', 'SS')).toBe(false)
  })
})
