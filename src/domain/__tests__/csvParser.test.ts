import { describe, expect, it } from 'vitest'
import { parsePlayerCSV } from '../csvParser'

// ─── Behavior 1: Empty string ─────────────────────────────────────────────────

describe('parsePlayerCSV', () => {
  it('returns empty arrays for empty string input', () => {
    const result = parsePlayerCSV('')
    expect(result).toEqual({ players: [], preferences: [], skipped: [] })
  })

  // ─── Behavior 2: Single row, name + gender only ─────────────────────────────

  it('parses a single row with name and gender and no position columns', () => {
    const csv = 'name,gender\nAlice,F'
    const result = parsePlayerCSV(csv)
    expect(result.players).toEqual([{ name: 'Alice', gender: 'F' }])
    expect(result.preferences).toEqual([])
    expect(result.skipped).toEqual([])
  })

  // ─── Behavior 3: Single row with a Tier1 position ───────────────────────────

  it('creates a preference record for a Tier1 position value', () => {
    const csv = 'name,gender,SS\nBob,M,Tier1'
    const result = parsePlayerCSV(csv)
    expect(result.players).toEqual([{ name: 'Bob', gender: 'M' }])
    expect(result.preferences).toEqual([{ playerName: 'Bob', position: 'SS', tier: 'Tier1' }])
    expect(result.skipped).toEqual([])
  })

  // ─── Behavior 4: Blank position cell → no preference ────────────────────────

  it('omits a preference when the position cell is blank', () => {
    const csv = 'name,gender,SS,LF\nCarla,F,,Tier2'
    const result = parsePlayerCSV(csv)
    expect(result.preferences).toHaveLength(1)
    expect(result.preferences[0]).toEqual({ playerName: 'Carla', position: 'LF', tier: 'Tier2' })
  })

  // ─── Behavior 5: Invalid tier value → silently omitted ──────────────────────

  it('silently omits a preference when the tier value is invalid', () => {
    const csv = 'name,gender,P\nDave,M,Bogus'
    const result = parsePlayerCSV(csv)
    expect(result.players).toEqual([{ name: 'Dave', gender: 'M' }])
    expect(result.preferences).toEqual([])
    expect(result.skipped).toEqual([])
  })

  // ─── Behavior 6: Duplicate name (case-insensitive) ──────────────────────────

  it('skips the second row when the same name appears twice (case-insensitive)', () => {
    const csv = 'name,gender\nEve,F\neve,F'
    const result = parsePlayerCSV(csv)
    expect(result.players).toEqual([{ name: 'Eve', gender: 'F' }])
    expect(result.skipped).toEqual(['eve'])
  })

  // ─── Behavior 7: Multiple rows, mixed positions ──────────────────────────────

  it('correctly parses multiple rows with mixed position values', () => {
    const csv = [
      'name,gender,P,C,SS',
      'Frank,M,Tier1,,Anti',
      'Grace,F,,Tier2,Tier3',
      'FRANK,M,Tier1,,',       // duplicate — should be skipped
    ].join('\n')

    const result = parsePlayerCSV(csv)

    expect(result.players).toEqual([
      { name: 'Frank', gender: 'M' },
      { name: 'Grace', gender: 'F' },
    ])

    expect(result.preferences).toEqual([
      { playerName: 'Frank', position: 'P', tier: 'Tier1' },
      { playerName: 'Frank', position: 'SS', tier: 'Anti' },
      { playerName: 'Grace', position: 'C', tier: 'Tier2' },
      { playerName: 'Grace', position: 'SS', tier: 'Tier3' },
    ])

    expect(result.skipped).toEqual(['FRANK'])
  })
})
