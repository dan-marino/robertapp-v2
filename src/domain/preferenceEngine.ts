import type { Position, PositionPreference, PreferenceTier } from './types'

export function getPreferenceTier(
  prefs: PositionPreference[],
  playerId: string,
  position: Position
): PreferenceTier | null {
  const match = prefs.find((p) => p.playerId === playerId && p.position === position)
  return match?.tier ?? null
}

export function isAnti(
  prefs: PositionPreference[],
  playerId: string,
  position: Position
): boolean {
  return getPreferenceTier(prefs, playerId, position) === 'Anti'
}
