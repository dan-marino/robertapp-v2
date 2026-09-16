import { describe, expect, it } from 'vitest'
import { parsePA } from '../paParser'

// ─── Behavior 1: Empty string ─────────────────────────────────────────────────

describe('parsePA', () => {
  it('returns zero counts and no errors for empty string', () => {
    const result = parsePA('')
    expect(result.counts).toEqual({
      s1b: 0, s2b: 0, s3b: 0, hr: 0, bb: 0, k: 0, fo: 0, fc: 0, go: 0, sf: 0,
    })
    expect(result.errors).toEqual([])
  })

  // ─── Behavior 2: Valid multi-token input ─────────────────────────────────────

  it('counts all valid tokens and returns no errors for a well-formed PA string', () => {
    const result = parsePA('1B GO BB HR FO SF K')
    expect(result.counts).toEqual({
      s1b: 1, s2b: 0, s3b: 0, hr: 1, bb: 1, k: 1, fo: 1, fc: 0, go: 1, sf: 1,
    })
    expect(result.errors).toEqual([])
  })

  // ─── Behavior 3: Wrong case → error, count not incremented ───────────────────

  it('rejects a lowercase token and does not increment any count', () => {
    const result = parsePA('1b')
    expect(result.counts).toEqual({
      s1b: 0, s2b: 0, s3b: 0, hr: 0, bb: 0, k: 0, fo: 0, fc: 0, go: 0, sf: 0,
    })
    expect(result.errors).toEqual(['Unknown token: "1b"'])
  })

  // ─── Behavior 4: Unknown token → error ───────────────────────────────────────

  it('rejects an unrecognised token and adds an error naming the token', () => {
    const result = parsePA('FLY')
    expect(result.counts).toEqual({
      s1b: 0, s2b: 0, s3b: 0, hr: 0, bb: 0, k: 0, fo: 0, fc: 0, go: 0, sf: 0,
    })
    expect(result.errors).toEqual(['Unknown token: "FLY"'])
  })

  // ─── Behavior 5: Mixed valid and invalid tokens ───────────────────────────────

  it('counts valid tokens and errors on invalid ones in a mixed string', () => {
    const result = parsePA('1B fly GO')
    expect(result.counts).toEqual({
      s1b: 1, s2b: 0, s3b: 0, hr: 0, bb: 0, k: 0, fo: 0, fc: 0, go: 1, sf: 0,
    })
    expect(result.errors).toEqual(['Unknown token: "fly"'])
  })

  // ─── Behavior 6: Repeated valid token ────────────────────────────────────────

  it('accumulates the count when the same valid token appears multiple times', () => {
    const result = parsePA('1B 1B 1B')
    expect(result.counts).toEqual({
      s1b: 3, s2b: 0, s3b: 0, hr: 0, bb: 0, k: 0, fo: 0, fc: 0, go: 0, sf: 0,
    })
    expect(result.errors).toEqual([])
  })
})
