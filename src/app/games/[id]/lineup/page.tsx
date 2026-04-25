import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { games, players, fieldingSlots, battingSlots, seasons } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { ALL_POSITIONS } from '@/domain/types'
import GenerateLineupButton from './GenerateLineupButton'

export default async function LineupPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: gameId } = await params

  const [game] = await db.select().from(games).where(eq(games.id, gameId))
  if (!game) notFound()

  const [season] = await db.select().from(seasons).where(eq(seasons.id, game.seasonId))

  const [fs, bs] = await Promise.all([
    db.select().from(fieldingSlots).where(eq(fieldingSlots.gameId, gameId)),
    db.select().from(battingSlots).where(eq(battingSlots.gameId, gameId)),
  ])

  const playerIds = [...new Set([...fs.map((s) => s.playerId), ...bs.map((s) => s.playerId)])]
  const playerRows =
    playerIds.length > 0
      ? await db.select().from(players).where(inArray(players.id, playerIds))
      : []
  const playerMap = new Map(playerRows.map((p) => [p.id, p.name]))

  const innings = [...new Set(fs.map((s) => s.inning))].sort((a, b) => a - b)
  const gridMap = new Map<string, string>()
  for (const slot of fs) {
    gridMap.set(`${slot.inning}:${slot.position}`, playerMap.get(slot.playerId) ?? slot.playerId)
  }

  const sortedBatting = [...bs].sort((a, b) => a.orderIndex - b.orderIndex)
  const hasLineup = fs.length > 0 || bs.length > 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/games/${gameId}`} className="text-sm text-zinc-500 hover:text-zinc-800">
          ← {game.date}
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Lineup</h1>
          <p className="text-sm text-zinc-500">
            {game.date} · {game.inningCount} innings · {game.mode} mode
          </p>
        </div>
        <GenerateLineupButton gameId={gameId} />
      </div>

      {!hasLineup && (
        <p className="text-zinc-400 text-sm">
          No lineup generated yet. Save RSVPs and click &quot;Generate Lineup&quot; above.
        </p>
      )}

      {hasLineup && (
        <>
          <section className="mb-10">
            <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
              Fielding Grid
            </h2>
            <div className="overflow-x-auto">
              <table className="text-sm border-collapse w-full">
                <thead>
                  <tr>
                    <th className="border border-zinc-200 bg-zinc-50 px-3 py-2 text-left font-medium text-zinc-600 w-16">
                      Pos
                    </th>
                    {innings.map((inning) => (
                      <th
                        key={inning}
                        className="border border-zinc-200 bg-zinc-50 px-3 py-2 text-center font-medium text-zinc-600"
                      >
                        Inn {inning}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ALL_POSITIONS.map((pos) => (
                    <tr key={pos} className="even:bg-zinc-50/50">
                      <td className="border border-zinc-200 px-3 py-2 font-medium text-zinc-700">
                        {pos}
                      </td>
                      {innings.map((inning) => (
                        <td
                          key={inning}
                          className="border border-zinc-200 px-3 py-2 text-center text-zinc-800"
                        >
                          {gridMap.get(`${inning}:${pos}`) ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
              Batting Order
            </h2>
            <ol className="space-y-1">
              {sortedBatting.map(({ playerId, orderIndex }) => (
                <li key={playerId} className="flex items-center gap-3">
                  <span className="text-sm text-zinc-400 w-6 text-right">{orderIndex}.</span>
                  <span className="text-sm font-medium text-zinc-800">
                    {playerMap.get(playerId) ?? playerId}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  )
}
