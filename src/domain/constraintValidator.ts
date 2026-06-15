import type { Lineup, Player, PositionPreference } from './types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ViolationSeverity = 'error' | 'warning'

export interface Violation {
  severity: ViolationSeverity
  rule: string
  playerIds: string[]
  message: string
}

// ─── Validators ───────────────────────────────────────────────────────────────

function checkGenderMinimum(lineup: Lineup, activeRoster: Player[]): Violation[] {
  const violations: Violation[] = []
  const womenOnRoster = activeRoster.filter((p) => p.gender === 'F').length
  if (womenOnRoster === 0) return violations

  const required = Math.min(womenOnRoster, 3)
  const womanIds = new Set(activeRoster.filter((p) => p.gender === 'F').map((p) => p.id))

  const innings = [...new Set(lineup.fieldingSlots.map((s) => s.inning))]
  for (const inning of innings) {
    const slotsThisInning = lineup.fieldingSlots.filter((s) => s.inning === inning)
    const womenThisInning = slotsThisInning.filter((s) => womanIds.has(s.playerId))
    if (womenThisInning.length < required) {
      violations.push({
        severity: 'error',
        rule: 'gender-minimum',
        playerIds: [],
        message: `Inning ${inning} has ${womenThisInning.length} women on the field; minimum is ${required}`,
      })
    }
  }
  return violations
}

function checkFieldCount(lineup: Lineup): Violation[] {
  const violations: Violation[] = []
  const innings = [...new Set(lineup.fieldingSlots.map((s) => s.inning))]
  for (const inning of innings) {
    const count = lineup.fieldingSlots.filter((s) => s.inning === inning).length
    if (count < 10) {
      violations.push({
        severity: 'error',
        rule: 'field-count',
        playerIds: [],
        message: `Inning ${inning} has ${count} players on the field; minimum is 10`,
      })
    }
  }
  return violations
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function validateLineup(
  lineup: Lineup,
  activeRoster: Player[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _preferences?: PositionPreference[]
): Violation[] {
  return [
    ...checkGenderMinimum(lineup, activeRoster),
    ...checkFieldCount(lineup),
  ]
}
