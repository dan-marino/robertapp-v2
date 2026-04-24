import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { games, seasons } from '@/db/schema'
import { eq } from 'drizzle-orm'

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [game] = await db.select().from(games).where(eq(games.id, id))
  if (!game) notFound()

  const [season] = await db.select().from(seasons).where(eq(seasons.id, game.seasonId))

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/seasons/${game.seasonId}`}
          className="text-sm text-zinc-500 hover:text-zinc-800"
        >
          ← {season?.name ?? 'Season'}
        </Link>
      </div>

      <h1 className="text-2xl font-semibold mb-1">{game.date}</h1>
      <p className="text-sm text-zinc-500 mb-8">
        {game.inningCount} innings · {game.mode} mode
      </p>

      <section className="mb-10">
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
          RSVPs
        </h2>
        <p className="text-zinc-400 text-sm">RSVP management coming in the next issue.</p>
      </section>

      <section>
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
          Lineup
        </h2>
        <p className="text-zinc-400 text-sm">Lineup generation coming soon.</p>
      </section>
    </div>
  )
}
