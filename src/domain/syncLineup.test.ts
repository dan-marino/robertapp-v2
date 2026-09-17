import { describe, it, expect } from 'vitest'
import { computeSyncDiff } from './syncLineup'
import type { BattingSlot, FieldingSlot, RSVP, Player } from './types'

// ─── Fixtures ────────────────────────────────────────────────────────────────

function player(id: string, gender: 'M' | 'F' = 'M'): Player {
  return { id, name: id, gender, isGuest: false }
}

function batting(playerId: string, orderIndex: number, genderGroup: 'M' | 'F' | 'All' = 'All'): BattingSlot {
  return { gameId: 'g1', playerId, orderIndex, genderGroup }
}

function fielding(playerId: string, inning = 1): FieldingSlot {
  return { gameId: 'g1', inning, playerId, position: 'P' }
}

function rsvp(playerId: string, status: 'Present' | 'Absent' | 'Late'): RSVP {
  return { gameId: 'g1', playerId, status }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('computeSyncDiff', () => {
  describe('toRemove', () => {
    it('removes a player with a BattingSlot who has an Absent RSVP', () => {
      const diff = computeSyncDiff(
        'Unified',
        [batting('p1', 1)],
        [],
        [rsvp('p1', 'Absent')],
        [player('p1')]
      )
      expect(diff.toRemove).toEqual([{ playerId: 'p1', hadFieldingSlots: false }])
    })

    it('removes a player with a BattingSlot who has no RSVP at all', () => {
      const diff = computeSyncDiff(
        'Unified',
        [batting('p1', 1)],
        [],
        [],
        [player('p1')]
      )
      expect(diff.toRemove).toEqual([{ playerId: 'p1', hadFieldingSlots: false }])
    })

    it('marks hadFieldingSlots true when the removed player has FieldingSlots', () => {
      const diff = computeSyncDiff(
        'Unified',
        [batting('p1', 1)],
        [fielding('p1')],
        [rsvp('p1', 'Absent')],
        [player('p1')]
      )
      expect(diff.toRemove).toEqual([{ playerId: 'p1', hadFieldingSlots: true }])
    })

    it('does not remove a player who is Present', () => {
      const diff = computeSyncDiff(
        'Unified',
        [batting('p1', 1)],
        [],
        [rsvp('p1', 'Present')],
        [player('p1')]
      )
      expect(diff.toRemove).toHaveLength(0)
    })

    it('does not remove a player who is Late', () => {
      const diff = computeSyncDiff(
        'Unified',
        [batting('p1', 1)],
        [],
        [rsvp('p1', 'Late')],
        [player('p1')]
      )
      expect(diff.toRemove).toHaveLength(0)
    })
  })

  describe('toAdd', () => {
    it('adds a player with a Present RSVP who has no BattingSlot', () => {
      const diff = computeSyncDiff(
        'Unified',
        [],
        [],
        [rsvp('p1', 'Present')],
        [player('p1')]
      )
      expect(diff.toAdd).toHaveLength(1)
      expect(diff.toAdd[0].playerId).toBe('p1')
    })

    it('adds a player with a Late RSVP who has no BattingSlot', () => {
      const diff = computeSyncDiff(
        'Unified',
        [],
        [],
        [rsvp('p1', 'Late')],
        [player('p1')]
      )
      expect(diff.toAdd).toHaveLength(1)
      expect(diff.toAdd[0].playerId).toBe('p1')
    })

    it('does not add a player who already has a BattingSlot', () => {
      const diff = computeSyncDiff(
        'Unified',
        [batting('p1', 1)],
        [],
        [rsvp('p1', 'Present')],
        [player('p1')]
      )
      expect(diff.toAdd).toHaveLength(0)
    })

    it('does not add a player with an Absent RSVP', () => {
      const diff = computeSyncDiff(
        'Unified',
        [],
        [],
        [rsvp('p1', 'Absent')],
        [player('p1')]
      )
      expect(diff.toAdd).toHaveLength(0)
    })
  })

  describe('genderGroup assignment', () => {
    it('assigns genderGroup All in Unified mode regardless of gender', () => {
      const diff = computeSyncDiff(
        'Unified',
        [],
        [],
        [rsvp('p1', 'Present'), rsvp('p2', 'Present')],
        [player('p1', 'M'), player('p2', 'F')]
      )
      expect(diff.toAdd.every((a) => a.genderGroup === 'All')).toBe(true)
    })

    it('assigns genderGroup matching player gender in Split mode', () => {
      const diff = computeSyncDiff(
        'Split',
        [],
        [],
        [rsvp('pm', 'Present'), rsvp('pf', 'Present')],
        [player('pm', 'M'), player('pf', 'F')]
      )
      const mEntry = diff.toAdd.find((a) => a.playerId === 'pm')
      const fEntry = diff.toAdd.find((a) => a.playerId === 'pf')
      expect(mEntry?.genderGroup).toBe('M')
      expect(fEntry?.genderGroup).toBe('F')
    })
  })

  describe('orderIndex assignment', () => {
    it('assigns orderIndex 1 when no existing slots in the genderGroup', () => {
      const diff = computeSyncDiff(
        'Unified',
        [],
        [],
        [rsvp('p1', 'Present')],
        [player('p1')]
      )
      expect(diff.toAdd[0].orderIndex).toBe(1)
    })

    it('assigns orderIndex max+1 after existing slots', () => {
      const diff = computeSyncDiff(
        'Unified',
        [batting('existing', 5)],
        [],
        [rsvp('p1', 'Present')],
        [player('p1'), player('existing')]
      )
      expect(diff.toAdd[0].orderIndex).toBe(6)
    })

    it('assigns sequential orderIndexes when adding multiple players', () => {
      const diff = computeSyncDiff(
        'Unified',
        [batting('existing', 3)],
        [],
        [rsvp('p1', 'Present'), rsvp('p2', 'Present')],
        [player('existing'), player('p1'), player('p2')]
      )
      const indexes = diff.toAdd.map((a) => a.orderIndex).sort((a, b) => a - b)
      expect(indexes).toEqual([4, 5])
    })

    it('assigns orderIndex per genderGroup independently in Split mode', () => {
      const diff = computeSyncDiff(
        'Split',
        [batting('m1', 3, 'M'), batting('f1', 2, 'F')],
        [],
        [rsvp('pm', 'Present'), rsvp('pf', 'Present')],
        [player('m1', 'M'), player('f1', 'F'), player('pm', 'M'), player('pf', 'F')]
      )
      const mEntry = diff.toAdd.find((a) => a.playerId === 'pm')
      const fEntry = diff.toAdd.find((a) => a.playerId === 'pf')
      expect(mEntry?.orderIndex).toBe(4)
      expect(fEntry?.orderIndex).toBe(3)
    })
  })

  describe('no-op cases', () => {
    it('returns empty diff when lineup matches RSVPs exactly', () => {
      const diff = computeSyncDiff(
        'Unified',
        [batting('p1', 1), batting('p2', 2)],
        [],
        [rsvp('p1', 'Present'), rsvp('p2', 'Present')],
        [player('p1'), player('p2')]
      )
      expect(diff.toAdd).toHaveLength(0)
      expect(diff.toRemove).toHaveLength(0)
    })
  })
})
