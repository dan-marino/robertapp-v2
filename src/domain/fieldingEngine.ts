import type {
  Player,
  Position,
  PositionPreference,
  PositionHistory,
  InningCount,
  PreferenceTier,
} from './types'
import { ALL_POSITIONS } from './types'
import { getPreferenceTier, isAnti } from './preferenceEngine'

export interface FieldingAssignment {
  inning: number
  playerId: string
  position: Position
}

export interface FieldingResult {
  assignments: FieldingAssignment[]
  warnings: string[]
}

interface EngineParams {
  activeRoster: Player[]
  preferences: PositionPreference[]
  positionHistory: PositionHistory[]
  latePlayerIds: string[]
  pitcherIds?: string[] // up to 4; engine schedules their P assignments
  inningCount: InningCount
  battingOrder?: string[] // playerIds in batting order; top-of-order batters sit inning 1
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function tierRank(tier: PreferenceTier | null): number {
  switch (tier) {
    case 'Tier1': return 4
    case 'Tier2': return 3
    case 'Tier3': return 2
    case null: return 1
    case 'Anti': return -Infinity
  }
}

function playerPositionScore(
  player: Player,
  position: Position,
  preferences: PositionPreference[],
  positionHistory: PositionHistory[]
): number {
  if (isAnti(preferences, player.id, position)) return -Infinity
  const tier = getPreferenceTier(preferences, player.id, position)
  let s = tierRank(tier) * 100
  const hist = positionHistory.find((h) => h.playerId === player.id && h.position === position)
  s -= (hist?.count ?? 0)
  if (player.isGuest) s -= 0.5
  return s
}

// ─── Pitcher scheduling ───────────────────────────────────────────────────────

function schedulePitchers(pitcherIds: string[], inningCount: InningCount): Map<string, number[]> {
  const map = new Map<string, number[]>()
  const innings = Array.from({ length: inningCount }, (_, i) => i + 1)

  if (pitcherIds.length === 0) return map

  if (pitcherIds.length === 1) {
    map.set(pitcherIds[0], innings)
    return map
  }

  if (pitcherIds.length === 2) {
    const half = Math.ceil(inningCount / 2)
    map.set(pitcherIds[0], innings.slice(0, half))
    map.set(pitcherIds[1], innings.slice(half))
    return map
  }

  if (pitcherIds.length === 3) {
    for (let i = 0; i < 3; i++) {
      map.set(pitcherIds[i], innings.slice(i * 2, i * 2 + 2))
    }
    return map
  }

  // 4 pitchers: 2+2+1+1
  const shuffled = shuffle(pitcherIds)
  map.set(shuffled[0], innings.slice(0, 2))
  map.set(shuffled[1], innings.slice(2, 4))
  map.set(shuffled[2], innings.slice(4, 5))
  map.set(shuffled[3], innings.slice(5, 6))
  return map
}

// ─── Sitting schedule ─────────────────────────────────────────────────────────

/**
 * Pre-compute which inning each player sits.
 * Guarantees every player's inning count is within ±1 of each other.
 * Late players always sit inning 1 (consuming one of their sits).
 * Returns Map<inning, Set<playerId>>.
 */
function computeSitSchedule(
  rosterIds: string[],
  latePlayerIds: string[],
  inningCount: InningCount,
  battingOrder?: string[]
): Map<number, Set<string>> {
  const n = rosterIds.length
  const slotsPerInning = 10
  const sitsCapPerInning = Math.max(0, n - slotsPerInning)
  const totalSits = sitsCapPerInning * inningCount // total sit-slots needed

  const sitsByInning = new Map<number, Set<string>>()
  for (let i = 1; i <= inningCount; i++) sitsByInning.set(i, new Set())

  if (totalSits === 0) return sitsByInning

  // Each player sits either floor(totalSits/n) or ceil(totalSits/n) times
  const baseSits = Math.floor(totalSits / n)
  const extraSits = totalSits % n

  // Order roster for sit distribution — late players go last (forced to inning 1 via override).
  // When battingOrder is provided, sort non-late players by batting position ascending so that
  // top-of-order batters receive their sits in earlier innings (inning 1 first).
  // Without battingOrder, fall back to a random shuffle.
  const lateSet = new Set(latePlayerIds)
  const nonLateIds = rosterIds.filter((id) => !lateSet.has(id))
  const nonLate = battingOrder && battingOrder.length > 0
    ? [...nonLateIds].sort((a, b) => {
        const ai = battingOrder.indexOf(a)
        const bi = battingOrder.indexOf(b)
        const aPos = ai === -1 ? nonLateIds.length : ai
        const bPos = bi === -1 ? nonLateIds.length : bi
        return aPos - bPos
      })
    : shuffle(nonLateIds)
  const late = rosterIds.filter((id) => lateSet.has(id))
  const ordered = [...nonLate, ...late]

  // Build flat sit list: each player appears baseSits times (plus one extra for first extraSits players)
  const sitList: string[] = []
  ordered.forEach((id, idx) => {
    const sits = baseSits + (idx < extraSits ? 1 : 0)
    for (let i = 0; i < sits; i++) sitList.push(id)
  })

  // Round-robin distribute sits across innings, ensuring each inning gets sitsCapPerInning sitters
  // Late players: their first sit must be inning 1
  // Strategy: first assign late-player sits to inning 1, then distribute rest sequentially

  let inningCursor = 1

  // Force late players into inning 1 first
  for (const id of late) {
    if (sitsByInning.get(1)!.size < sitsCapPerInning) {
      sitsByInning.get(1)!.add(id)
      // Remove one occurrence of this id from sitList
      const idx = sitList.indexOf(id)
      if (idx !== -1) sitList.splice(idx, 1)
    }
  }

  // Distribute remaining sits sequentially
  for (const id of sitList) {
    // Find next inning with capacity (that doesn't already have this player)
    while (
      inningCursor <= inningCount &&
      (sitsByInning.get(inningCursor)!.size >= sitsCapPerInning ||
        sitsByInning.get(inningCursor)!.has(id))
    ) {
      inningCursor++
    }
    if (inningCursor > inningCount) break
    sitsByInning.get(inningCursor)!.add(id)
  }

  return sitsByInning
}

// ─── Position assignment for one inning ──────────────────────────────────────

/**
 * Assign positions to players using regret-based ordering:
 * Process the position with the highest "advantage gap" first
 * (the position where one player is most preferred over the rest).
 */
function assignPositionsForInning(
  activePlayers: Player[],
  positions: Position[],
  preferences: PositionPreference[],
  positionHistory: PositionHistory[]
): Array<{ playerId: string; position: Position }> {
  const results: Array<{ playerId: string; position: Position }> = []
  const assignedPlayers = new Set<string>()
  const assignedPositions = new Set<Position>()

  // Compute scores for all valid pairs
  const scoreCache = new Map<string, number>()
  function getScore(playerId: string, position: Position): number {
    const key = `${playerId}:${position}`
    if (!scoreCache.has(key)) {
      const player = activePlayers.find((p) => p.id === playerId)!
      scoreCache.set(key, playerPositionScore(player, position, preferences, positionHistory))
    }
    return scoreCache.get(key)!
  }

  // Regret-based loop: always process the "most contested" position next
  const remainingPositions = [...positions]

  while (remainingPositions.length > 0 && assignedPlayers.size < activePlayers.length) {
    const availablePlayers = activePlayers.filter((p) => !assignedPlayers.has(p.id))

    // For each remaining position, compute best and second-best scores from available players
    let bestRegret = -Infinity
    let bestPosition = remainingPositions[0]

    for (const pos of remainingPositions) {
      const scores = availablePlayers
        .map((p) => getScore(p.id, pos))
        .filter((s) => s > -Infinity)
        .sort((a, b) => b - a)

      if (scores.length === 0) continue

      const best = scores[0]
      const secondBest = scores[1] ?? -Infinity
      const regret = best - secondBest // how much it matters to process this position now

      if (regret > bestRegret) {
        bestRegret = regret
        bestPosition = pos
      }
    }

    // Assign the best available player to bestPosition
    const eligible = availablePlayers
      .filter((p) => getScore(p.id, bestPosition) > -Infinity)
      .sort((a, b) => {
        const scoreDiff = getScore(b.id, bestPosition) - getScore(a.id, bestPosition)
        return scoreDiff !== 0 ? scoreDiff : 0 // ties broken by existing shuffle order
      })

    if (eligible.length > 0) {
      results.push({ playerId: eligible[0].id, position: bestPosition })
      assignedPlayers.add(eligible[0].id)
    }

    // Remove this position from remaining
    remainingPositions.splice(remainingPositions.indexOf(bestPosition), 1)
    assignedPositions.add(bestPosition)
  }

  // Anti-fallback: assign remaining unassigned positions to remaining players
  const unassigned = activePlayers.filter((p) => !assignedPlayers.has(p.id))
  const unfilled = positions.filter((pos) => !assignedPositions.has(pos))
  for (let i = 0; i < Math.min(unfilled.length, unassigned.length); i++) {
    results.push({ playerId: unassigned[i].id, position: unfilled[i] })
  }

  return results
}

// ─── Main engine ─────────────────────────────────────────────────────────────

export function generateFieldingGrid({
  activeRoster,
  preferences,
  positionHistory,
  latePlayerIds,
  pitcherIds = [],
  inningCount,
  battingOrder,
}: EngineParams): FieldingResult {
  const warnings: string[] = []
  const n = activeRoster.length
  if (n === 0) return { assignments: [], warnings }

  const womenCount = activeRoster.filter((p) => p.gender === 'F').length
  if (womenCount === 0) {
    warnings.push('Disqualification: no women available. League rules require at least one woman on the field.')
  }

  const lateSet = new Set(latePlayerIds)
  const rosterIds = activeRoster.map((p) => p.id)

  // Schedule pitchers
  const capped = pitcherIds.slice(0, 4)
  const pitcherSchedule = schedulePitchers(capped, inningCount)

  // Pre-compute sitting schedule
  const sitSchedule = computeSitSchedule(rosterIds, latePlayerIds, inningCount, battingOrder)

  const allAssignments: FieldingAssignment[] = []

  for (let inning = 1; inning <= inningCount; inning++) {
    const sittingThisInning = sitSchedule.get(inning)!

    // Players active this inning
    const activePlayers = activeRoster.filter((p) => {
      if (inning === 1 && lateSet.has(p.id)) return false
      return !sittingThisInning.has(p.id)
    })

    // Determine available positions based on gender
    // C requires ≥3 women; LF requires ≥2 women — exclude those positions when under-threshold.
    // However, always keep enough positions to field all active players (fairness invariant).
    const women = activePlayers.filter((p) => p.gender === 'F')
    const excluded: Position[] = []
    if (women.length < 3) excluded.push('C')
    if (women.length < 2) excluded.push('LF')

    let positions = ALL_POSITIONS.filter((p) => !excluded.includes(p))

    // Restore excluded positions as fallback if we'd leave active players unfielded
    const targetCount = Math.min(activePlayers.length, ALL_POSITIONS.length)
    for (const pos of excluded) {
      if (positions.length >= targetCount) break
      positions = [...positions, pos]
    }

    const activePositions = positions.slice(0, targetCount)

    // Lock pitcher assignments for this inning
    const lockedAssignments: FieldingAssignment[] = []
    const lockedPlayerIds = new Set<string>()

    for (const [pitcherId, pitchingInnings] of pitcherSchedule) {
      if (pitchingInnings.includes(inning) && activePlayers.some((p) => p.id === pitcherId)) {
        lockedAssignments.push({ inning, playerId: pitcherId, position: 'P' })
        lockedPlayerIds.add(pitcherId)
      }
    }

    // Assign remaining positions
    const remainingPlayers = activePlayers.filter((p) => !lockedPlayerIds.has(p.id))
    const remainingPositions = activePositions.filter(
      (pos) => !lockedAssignments.some((a) => a.position === pos)
    )

    const flexAssignments = assignPositionsForInning(
      remainingPlayers,
      remainingPositions,
      preferences,
      positionHistory
    )

    const inningAssignments: FieldingAssignment[] = [
      ...lockedAssignments,
      ...flexAssignments.map((a) => ({ ...a, inning })),
    ]

    allAssignments.push(...inningAssignments)
  }

  return { assignments: allAssignments, warnings }
}
