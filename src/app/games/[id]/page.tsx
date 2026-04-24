import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { games, players, rosters, rsvps, seasons } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'
import RSVPManager from './RSVPManager'
import type { RSVPStatus } from '@/domain/types'

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [game] = await db.select().from(games).where(eq(games.id, id))
  if (!game) notFound()

  const [season] = await db.select().from(seasons).where(eq(seasons.id, game.seasonId))

  const rosterRows = await db
    .select({ player: players })
    .from(rosters)
    .innerJoin(players, eq(rosters.playerId, players.id))
    .where(eq(rosters.seasonId, game.seasonId))

  const rsvpRows = await db.select().from(rsvps).where(eq(rsvps.gameId, id))
  const rsvpMap = new Map(rsvpRows.map((r) => [r.playerId, r.status as RSVPStatus]))

  // Also include guests (players with isGuest=true who have an RSVP for this game)
  const guestIds = rsvpRows
    .map((r) => r.playerId)
    .filter((pid) => !rosterRows.some((row) => row.player.id === pid))

  const guestRows =
    guestIds.length > 0
      ? await db.select().from(players).where(inArray(players.id, guestIds))
      : []

  const allPlayers = [
    ...rosterRows.map((r) => r.player),
    ...guestRows.filter((g) => g.isGuest),
  ]

  const initialRsvps = allPlayers.map((player) => ({
    player,
    status: rsvpMap.get(player.id) ?? null,
  }))

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
        <RSVPManager gameId={id} initialRsvps={initialRsvps} />
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
