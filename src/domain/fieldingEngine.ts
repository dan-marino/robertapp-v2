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
 * Late players always sit inning 1 (consuming one of their sits).
 *
 * Gender protection (when womenIds is provided):
 *   - At least 3 women must be on the field every inning.
 *   - maxWomenSitsPerInning = max(0, womenCount − 3).
 *   - Non-late women are excluded from the sit pool when maxWomenSitsPerInning === 0
 *     (i.e. when there are only 3 women), so men absorb all sit slots.
 *   - When women can sit (4+ women), men are ordered first so they absorb extra sits
 *     before any woman does, and a swap pass caps women per inning at the max.
 *   - ±1 fairness is guaranteed within the eligible sit pool (men among themselves,
 *     women among themselves when they can sit).
 *
 * Returns Map<inning, Set<playerId>>.
 */
function computeSitSchedule(
  rosterIds: string[],
  latePlayerIds: string[],
  inningCount: InningCount,
  battingOrder?: string[],
  womenIds?: Set<string>
): Map<number, Set<string>> {
  const n = rosterIds.length
  const slotsPerInning = 10
  const sitsCapPerInning = Math.max(0, n - slotsPerInning)
  const totalSits = sitsCapPerInning * inningCount

  const sitsByInning = new Map<number, Set<string>>()
  for (let i = 1; i <= inningCount; i++) sitsByInning.set(i, new Set())

  if (totalSits === 0) return sitsByInning

  // How many women may sit per inning without dropping below 3 women on field.
  const womenCount = womenIds?.size ?? 0
  const maxWomenSitsPerInning = Math.max(0, womenCount - 3)

  const lateSet = new Set(latePlayerIds)
  const nonLateIds = rosterIds.filter((id) => !lateSet.has(id))
  const late = rosterIds.filter((id) => lateSet.has(id))

  // Build the non-late sit pool:
  //   battingOrder   → sort by batting position (top-of-order sits first)
  //   no women slots → exclude non-late women entirely; men fill all sit slots
  //   women can sit  → men first (shuffled), then women (shuffled)
  //   no gender info → random shuffle
  let nonLateSitPool: string[]
  if (battingOrder && battingOrder.length > 0) {
    nonLateSitPool = [...nonLateIds].sort((a, b) => {
      const ai = battingOrder.indexOf(a)
      const bi = battingOrder.indexOf(b)
      const aPos = ai === -1 ? nonLateIds.length : ai
      const bPos = bi === -1 ? nonLateIds.length : bi
      return aPos - bPos
    })
  } else if (womenIds && maxWomenSitsPerInning === 0) {
    // Women must never sit (3 women on roster): only men in the pool.
    nonLateSitPool = shuffle(nonLateIds.filter((id) => !womenIds.has(id)))
  } else if (womenIds && womenIds.size > 0) {
    // Women can sit but men absorb extra sits first.
    const nonLateMen = shuffle(nonLateIds.filter((id) => !womenIds.has(id)))
    const nonLateWomen = shuffle(nonLateIds.filter((id) => womenIds.has(id)))
    nonLateSitPool = [...nonLateMen, ...nonLateWomen]
  } else {
    nonLateSitPool = shuffle(nonLateIds)
  }

  // Late players are always in the pool (they must sit inning 1).
  const ordered = [...nonLateSitPool, ...late]
  const poolSize = ordered.length

  // Each pool member sits baseSits or baseSits+1 times.
  const baseSits = Math.floor(totalSits / poolSize)
  const extraSits = totalSits % poolSize

  // Build interleaved sit list: round-by-round so the cursor-based distributor
  // spreads sits evenly across innings.
  const maxRounds = baseSits + 1
  const sitList: string[] = []
  for (let round = 0; round < maxRounds; round++) {
    ordered.forEach((id, idx) => {
      const sits = baseSits + (idx < extraSits ? 1 : 0)
      if (round < sits) sitList.push(id)
    })
  }

  let inningCursor = 1

  // Force late players into inning 1 first.
  for (const id of late) {
    if (sitsByInning.get(1)!.size < sitsCapPerInning) {
      sitsByInning.get(1)!.add(id)
      const idx = sitList.indexOf(id)
      if (idx !== -1) sitList.splice(idx, 1)
    }
  }

  // Distribute remaining sits sequentially.
  for (const id of sitList) {
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

  // ─── Gender protection swap pass ─────────────────────────────────────────
  // When women can sit (4+ women) the sequential distributor may cluster more
  // women than allowed into one inning.  Swap excess women with men from
  // innings that are under the women cap.  Never displace late players.
  if (womenIds && maxWomenSitsPerInning > 0) {
    for (let inning = 1; inning <= inningCount; inning++) {
      const sitters = sitsByInning.get(inning)!
      const womenHere = [...sitters].filter((id) => womenIds!.has(id))
      if (womenHere.length <= maxWomenSitsPerInning) continue

      for (let i = maxWomenSitsPerInning; i < womenHere.length; i++) {
        const womanToMove = womenHere[i]
        if (lateSet.has(womanToMove)) continue

        for (let other = 1; other <= inningCount; other++) {
          if (other === inning) continue
          const otherSitters = sitsByInning.get(other)!
          const otherWomenCount = [...otherSitters].filter((id) => womenIds!.has(id)).length
          if (otherWomenCount >= maxWomenSitsPerInning) continue
          if (otherSitters.has(womanToMove)) continue
          const manToSwap = [...otherSitters].find(
            (id) => !womenIds!.has(id) && !sitters.has(id) && !lateSet.has(id)
          )
          if (manToSwap !== undefined) {
            sitters.delete(womanToMove)
            sitters.add(manToSwap)
            otherSitters.delete(manToSwap)
            otherSitters.add(womanToMove)
            break
          }
        }
      }
    }
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

  // Pre-compute sitting schedule (pass women IDs so they are protected from extra sits)
  const womenIds = new Set(activeRoster.filter((p) => p.gender === 'F').map((p) => p.id))
  const sitSchedule = computeSitSchedule(rosterIds, latePlayerIds, inningCount, battingOrder, womenIds)

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
