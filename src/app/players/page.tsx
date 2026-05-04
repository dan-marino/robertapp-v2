import { db } from '@/db'
import { players, positionPreferences } from '@/db/schema'
import { eq } from 'drizzle-orm'
import PlayerList from './PlayerList'

export default async function PlayersPage() {
  const [allPlayers, allPrefs] = await Promise.all([
    db.select().from(players).where(eq(players.isGuest, false)),
    db.select().from(positionPreferences),
  ])

  const prefsByPlayer = allPrefs.reduce<Record<string, typeof allPrefs>>(
    (acc, pref) => {
      ;(acc[pref.playerId] ??= []).push(pref)
      return acc
    },
    {}
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-8">Players</h1>
      <PlayerList initialPlayers={allPlayers} prefsByPlayer={prefsByPlayer} />
    </div>
  )
}
