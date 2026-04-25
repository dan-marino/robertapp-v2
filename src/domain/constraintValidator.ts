import type { Lineup, Player, PositionPreference, Position } from './types'
import { isAnti, getPreferenceTier } from './preferenceEngine'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ViolationSeverity = 'error' | 'warning'

export interface Violation {
  severity: ViolationSeverity
  rule: string
  playerIds: string[]
  message: string
}

// ─── Validators ───────────────────────────────────────────────────────────────

function checkAntiPositions(
  lineup: Lineup,
  preferences: PositionPreference[]
): Violation[] {
  const violations: Violation[] = []
  for (const slot of lineup.fieldingSlots) {
    if (isAnti(preferences, slot.playerId, slot.position)) {
      violations.push({
        severity: 'error',
        rule: 'anti-position',
        playerIds: [slot.playerId],
        message: `Player ${slot.playerId} is assigned to Anti position ${slot.position} in inning ${slot.inning}`,
      })
    }
  }
  return violations
}

function checkGenderMinimum(lineup: Lineup, activeRoster: Player[]): Violation[] {
  const violations: Violation[] = []
  const womenOnRoster = activeRoster.filter((p) => p.gender === 'F').length
  if (womenOnRoster === 0) return violations

  const required = Math.min(womenOnRoster, 3)
  const womanIds = new Set(activeRoster.filter((p) => p.gender === 'F').map((p) => p.id))

  // Group by inning
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

function checkInningsFairness(lineup: Lineup, activeRoster: Player[]): Violation[] {
  const countByPlayer = new Map<string, number>()
  for (const p of activeRoster) countByPlayer.set(p.id, 0)
  for (const slot of lineup.fieldingSlots) {
    countByPlayer.set(slot.playerId, (countByPlayer.get(slot.playerId) ?? 0) + 1)
  }

  const counts = [...countByPlayer.values()]
  if (counts.length === 0) return []

  const max = Math.max(...counts)
  const min = Math.min(...counts)
  if (max - min <= 1) return []

  const underPlayed = [...countByPlayer.entries()]
    .filter(([, count]) => max - count > 1)
    .map(([id]) => id)

  return [
    {
      severity: 'error',
      rule: 'innings-fairness',
      playerIds: underPlayed,
      message: `Innings played spread is ${max - min} (max ${max}, min ${min}); allowed maximum is 1`,
    },
  ]
}

function checkPreferenceDowngrades(
  lineup: Lineup,
  preferences: PositionPreference[]
): Violation[] {
  if (preferences.length === 0) return []

  const TIER_RANK: Record<string, number> = {
    Tier1: 4,
    Tier2: 3,
    Tier3: 2,
    null: 1,
  }

  const violations: Violation[] = []

  // For each unique (playerId, inning) pair, check if their assigned position
  // is below their best achievable preference tier
  const playerInningMap = new Map<string, Set<number>>()
  for (const slot of lineup.fieldingSlots) {
    if (!playerInningMap.has(slot.playerId)) playerInningMap.set(slot.playerId, new Set())
    playerInningMap.get(slot.playerId)!.add(slot.inning)
  }

  // Find each player's best preference tier across all their preferences
  const playerBestTier = new Map<string, number>()
  for (const pref of preferences) {
    if (pref.tier === 'Anti') continue
    const current = playerBestTier.get(pref.playerId) ?? 0
    const rank = TIER_RANK[pref.tier] ?? 1
    if (rank > current) playerBestTier.set(pref.playerId, rank)
  }

  for (const slot of lineup.fieldingSlots) {
    const bestTier = playerBestTier.get(slot.playerId)
    if (!bestTier) continue // no preferences for this player

    const assignedTier = getPreferenceTier(preferences, slot.playerId, slot.position)
    const assignedRank = TIER_RANK[assignedTier ?? 'null'] ?? 1

    if (assignedRank < bestTier) {
      violations.push({
        severity: 'warning',
        rule: 'preference-downgrade',
        playerIds: [slot.playerId],
        message: `Player ${slot.playerId} assigned to ${slot.position} in inning ${slot.inning} but has a higher-tier preference`,
      })
    }
  }

  return violations
}

function checkBattingSlotRestriction(lineup: Lineup, activeRoster: Player[]): Violation[] {
  if (lineup.battingSlots.length === 0) return []

  const womanIds = new Set(activeRoster.filter((p) => p.gender === 'F').map((p) => p.id))
  const violations: Violation[] = []

  for (const slot of lineup.battingSlots) {
    if ((slot.orderIndex === 1 || slot.orderIndex === 2) && womanIds.has(slot.playerId)) {
      violations.push({
        severity: 'error',
        rule: 'batting-slot-restriction',
        playerIds: [slot.playerId],
        message: `Woman ${slot.playerId} is in batting slot ${slot.orderIndex} (slots 1 and 2 are reserved for men)`,
      })
    }
  }

  return violations
}

function checkConsecutiveMen(lineup: Lineup, activeRoster: Player[]): Violation[] {
  if (lineup.battingSlots.length === 0) return []

  const womanIds = new Set(activeRoster.filter((p) => p.gender === 'F').map((p) => p.id))
  const ordered = [...lineup.battingSlots]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((s) => ({ playerId: s.playerId, isWoman: womanIds.has(s.playerId) }))

  const N = ordered.length

  // Check consecutive men in the linear order
  let consecutiveMen = 0
  for (const { isWoman } of ordered) {
    if (!isWoman) {
      consecutiveMen++
      if (consecutiveMen > 3) {
        return [
          {
            severity: 'error',
            rule: 'consecutive-men',
            playerIds: [],
            message: `Batting order has more than 3 consecutive men`,
          },
        ]
      }
    } else {
      consecutiveMen = 0
    }
  }

  // Check wrap-around
  const womenIndices = ordered.map((e, i) => (e.isWoman ? i : -1)).filter((i) => i >= 0)
  if (womenIndices.length > 0) {
    const lastWomanIdx = womenIndices[womenIndices.length - 1]
    const firstWomanIdx = womenIndices[0]
    const wrapMen = (N - 1 - lastWomanIdx) + firstWomanIdx
    if (wrapMen > 3) {
      return [
        {
          severity: 'error',
          rule: 'consecutive-men',
          playerIds: [],
          message: `Wrap-around batting order has more than 3 consecutive men (${wrapMen})`,
        },
      ]
    }
  }

  return []
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function validateLineup(
  lineup: Lineup,
  activeRoster: Player[],
  preferences: PositionPreference[]
): Violation[] {
  return [
    ...checkAntiPositions(lineup, preferences),
    ...checkGenderMinimum(lineup, activeRoster),
    ...checkInningsFairness(lineup, activeRoster),
    ...checkPreferenceDowngrades(lineup, preferences),
    ...checkBattingSlotRestriction(lineup, activeRoster),
    ...checkConsecutiveMen(lineup, activeRoster),
  ]
}
