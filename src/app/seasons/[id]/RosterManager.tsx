'use client'

import RosterPicker from './RosterPicker'

interface Player {
  id: string
  name: string
  gender: 'M' | 'F'
  isGuest: boolean
}

interface Props {
  seasonId: string
  initialRoster: Player[]
  initialPool: Player[]
}

export default function RosterManager({ seasonId, initialRoster, initialPool }: Props) {
  return (
    <RosterPicker
      seasonId={seasonId}
      initialRoster={initialRoster}
      initialPool={initialPool}
    />
  )
}
