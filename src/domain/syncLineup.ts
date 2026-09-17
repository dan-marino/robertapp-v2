import type { BattingSlot, FieldingSlot, RSVP, Player, GameMode, GenderGroup } from './types'

export interface PlayerToAdd {
  playerId: string
  genderGroup: GenderGroup
  orderIndex: number
}

export interface PlayerToRemove {
  playerId: string
  hadFieldingSlots: boolean
}

export interface SyncDiff {
  toAdd: PlayerToAdd[]
  toRemove: PlayerToRemove[]
}

/**
 * Computes the diff between the current Lineup and current RSVPs.
 *
 * toAdd:    Players with Present/Late RSVP who have no BattingSlot yet.
 * toRemove: Players with a BattingSlot who have an Absent RSVP or no RSVP at all.
 *
 * New players' genderGroup follows the game mode:
 *   - Unified → 'All'
 *   - Split   → the player's gender ('M' | 'F')
 *
 * New players' orderIndex is max(existing orderIndex in that genderGroup) + 1.
 * If no slots exist in the genderGroup yet, orderIndex starts at 1.
 */
export function computeSyncDiff(
  mode: GameMode,
  battingSlots: BattingSlot[],
  fieldingSlots: FieldingSlot[],
  rsvps: RSVP[],
  players: Player[]
): SyncDiff {
  const activeIds = new Set(
    rsvps
      .filter((r) => r.status === 'Present' || r.status === 'Late')
      .map((r) => r.playerId)
  )

  const inLineupIds = new Set(battingSlots.map((bs) => bs.playerId))

  const playerMap = new Map(players.map((p) => [p.id, p]))

  const fielderIds = new Set(fieldingSlots.map((fs) => fs.playerId))

  // Players to remove: in lineup but not active
  const toRemove: PlayerToRemove[] = battingSlots
    .filter((bs) => !activeIds.has(bs.playerId))
    .map((bs) => ({
      playerId: bs.playerId,
      hadFieldingSlots: fielderIds.has(bs.playerId),
    }))

  // Players to add: active but not yet in lineup
  const playersToAdd = [...activeIds]
    .filter((pid) => !inLineupIds.has(pid))
    .map((pid) => playerMap.get(pid))
    .filter((p): p is Player => p !== undefined)

  // Compute max orderIndex per genderGroup from existing batting slots
  const maxIndexByGroup = new Map<GenderGroup, number>()
  for (const bs of battingSlots) {
    const current = maxIndexByGroup.get(bs.genderGroup) ?? 0
    if (bs.orderIndex > current) {
      maxIndexByGroup.set(bs.genderGroup, bs.orderIndex)
    }
  }

  const toAdd: PlayerToAdd[] = []
  for (const player of playersToAdd) {
    const genderGroup: GenderGroup = mode === 'Unified' ? 'All' : player.gender
    const currentMax = maxIndexByGroup.get(genderGroup) ?? 0
    const orderIndex = currentMax + 1
    maxIndexByGroup.set(genderGroup, orderIndex)
    toAdd.push({ playerId: player.id, genderGroup, orderIndex })
  }

  return { toAdd, toRemove }
}
