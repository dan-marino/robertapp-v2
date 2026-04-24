// ─── Positions ───────────────────────────────────────────────────────────────

export type Position = 'P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'LCF' | 'RCF' | 'RF'

export const ALL_POSITIONS: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'LCF', 'RCF', 'RF']

// ─── Preferences ─────────────────────────────────────────────────────────────

export type PreferenceTier = 'Tier1' | 'Tier2' | 'Tier3' | 'Anti'

export interface PositionPreference {
  playerId: string
  position: Position
  tier: PreferenceTier
}

// ─── People ──────────────────────────────────────────────────────────────────

export type Gender = 'M' | 'F'

export interface Player {
  id: string
  name: string
  gender: Gender
  isGuest: boolean
}

// ─── Season & Game ───────────────────────────────────────────────────────────

export interface Season {
  id: string
  name: string
  gameCount: number
}

export type GameMode = 'Unified' | 'Split'

export type InningCount = 5 | 6

export interface Game {
  id: string
  seasonId: string
  date: string // ISO date string
  inningCount: InningCount
  mode: GameMode
}

// ─── Roster ──────────────────────────────────────────────────────────────────

export interface Roster {
  seasonId: string
  playerIds: string[]
}

// ─── Attendance ──────────────────────────────────────────────────────────────

export type RSVPStatus = 'Present' | 'Absent' | 'Late'

export interface RSVP {
  gameId: string
  playerId: string
  status: RSVPStatus
}

// ─── Fielding ────────────────────────────────────────────────────────────────

export interface FieldingSlot {
  gameId: string
  inning: number // 1-based
  playerId: string
  position: Position
}

// ─── Batting ─────────────────────────────────────────────────────────────────

export type GenderGroup = 'M' | 'F' | 'All'

export interface BattingSlot {
  gameId: string
  playerId: string
  orderIndex: number // 1-based
  genderGroup: GenderGroup // 'All' for Unified mode; 'M' or 'F' for Split mode
}

// ─── Lineup ──────────────────────────────────────────────────────────────────

export interface Lineup {
  gameId: string
  fieldingSlots: FieldingSlot[]
  battingSlots: BattingSlot[]
}

// ─── History ─────────────────────────────────────────────────────────────────

export interface PositionHistory {
  playerId: string
  seasonId: string
  position: Position
  count: number
}

export interface BattingHistory {
  playerId: string
  seasonId: string
  gameId: string
  orderIndex: number
  genderGroup: GenderGroup
}
