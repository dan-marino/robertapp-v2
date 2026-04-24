import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { games, players, rosters, seasons } from '@/db/schema'
import { eq } from 'drizzle-orm'
import RosterManager from './RosterManager'
import GameCreator from './GameCreator'

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

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← All seasons
        </Link>
      </div>

      <h1 className="text-2xl font-semibold mb-1">{season.name}</h1>
      <p className="text-sm text-zinc-500 mb-8">{season.gameCount} games</p>

      <section className="mb-10">
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
          Games
        </h2>
        {seasonGames.length > 0 && (
          <ul className="divide-y divide-zinc-100 border border-zinc-100 rounded-lg overflow-hidden mb-4">
            {seasonGames.map((game) => (
              <li key={game.id}>
                <Link
                  href={`/games/${game.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors"
                >
                  <span className="text-sm font-medium">{game.date}</span>
                  <span className="text-xs text-zinc-400">
                    {game.inningCount} inn · {game.mode}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <GameCreator seasonId={id} />
      </section>

      <RosterManager seasonId={id} initialRoster={roster} />
    </div>
  )
}
