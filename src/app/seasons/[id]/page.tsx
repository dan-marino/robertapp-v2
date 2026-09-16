import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { games, players, rosters, seasons } from '@/db/schema'
import { eq } from 'drizzle-orm'
import RosterManager from './RosterManager'
import GameCreator from './GameCreator'
import GameList from './GameList'
import SeasonStatsTable from './SeasonStatsTable'

export default async function SeasonPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [season] = await db.select().from(seasons).where(eq(seasons.id, id))
  if (!season) notFound()

  const seasonGames = await db
    .select()
    .from(games)
    .where(eq(games.seasonId, id))
    .orderBy(games.date)

  const rosterRows = await db
    .select({ player: players })
    .from(rosters)
    .innerJoin(players, eq(rosters.playerId, players.id))
    .where(eq(rosters.seasonId, id))

  const roster = rosterRows.map((r) => r.player)

  const pool = await db
    .select()
    .from(players)
    .where(eq(players.isGuest, false))

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200">
          ← All seasons
        </Link>
      </div>

      <h1 className="text-2xl font-semibold mb-1">{season.name}</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">{season.gameCount} games</p>

      <section className="mb-10">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
          Games
        </h2>
        <GameList initialGames={seasonGames} />
        <GameCreator seasonId={id} />
      </section>

      <SeasonStatsTable seasonId={id} gameIds={seasonGames.map((g) => g.id)} />

      <RosterManager seasonId={id} initialRoster={roster} initialPool={pool} />
    </div>
  )
}
