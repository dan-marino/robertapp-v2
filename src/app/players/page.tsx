import { db } from '@/db'
import { players } from '@/db/schema'
import { eq } from 'drizzle-orm'
import PlayerList from './PlayerList'

export default async function PlayersPage() {
  const allPlayers = await db
    .select()
    .from(players)
    .where(eq(players.isGuest, false))

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-8">Players</h1>
      <PlayerList initialPlayers={allPlayers} />
    </div>
  )
}
