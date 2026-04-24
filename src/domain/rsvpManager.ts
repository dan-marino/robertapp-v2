import type { Player, RSVP } from './types'

export function getActiveRoster(players: Player[], rsvps: RSVP[]): Player[] {
  const activeIds = new Set(
    rsvps
      .filter((r) => r.status === 'Present' || r.status === 'Late')
      .map((r) => r.playerId)
  )
  return players.filter((p) => activeIds.has(p.id))
}

export function getLatePlayers(players: Player[], rsvps: RSVP[]): Player[] {
  const lateIds = new Set(
    rsvps.filter((r) => r.status === 'Late').map((r) => r.playerId)
  )
  return players.filter((p) => lateIds.has(p.id))
}
