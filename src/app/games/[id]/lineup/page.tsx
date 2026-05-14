import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { games, players, fieldingSlots, battingSlots, seasons } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'
import GenerateLineupButton from './GenerateLineupButton'
import ReshuffleButton from './ReshuffleButton'
import LineupSwapGrid from './LineupSwapGrid'

export default async function LineupPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: gameId } = await params

  const [game] = await db.select().from(games).where(eq(games.id, gameId))
  if (!game) notFound()

  await db.select().from(seasons).where(eq(seasons.id, game.seasonId))

  const [fs, bs] = await Promise.all([
    db.select().from(fieldingSlots).where(eq(fieldingSlots.gameId, gameId)),
    db.select().from(battingSlots).where(eq(battingSlots.gameId, gameId)),
  ])

  const playerIds = [...new Set([...fs.map((s) => s.playerId), ...bs.map((s) => s.playerId)])]
  const playerRows =
    playerIds.length > 0
      ? await db.select().from(players).where(inArray(players.id, playerIds))
      : []
  const playerMap: Record<string, { name: string; gender: 'M' | 'F' }> = Object.fromEntries(
    playerRows.map((p) => [p.id, { name: p.name, gender: p.gender as 'M' | 'F' }])
  )

  const innings = [...new Set(fs.map((s) => s.inning))].sort((a, b) => a - b)
  const hasLineup = fs.length > 0 || bs.length > 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/games/${gameId}`} className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200">
          ← {game.date}
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Lineup</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {game.date} · {game.inningCount} innings · {game.mode} mode
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasLineup && (
            <a
              href={`/api/games/${gameId}/lineup/export`}
              download
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              Export CSV
            </a>
          )}
          {hasLineup && <ReshuffleButton gameId={gameId} />}
          <GenerateLineupButton gameId={gameId} />
        </div>
      </div>

      {!hasLineup && (
        <p className="text-zinc-400 dark:text-zinc-500 text-sm">
          No lineup generated yet. Save RSVPs and click &quot;Generate Lineup&quot; above.
        </p>
      )}

      {hasLineup && (
        <LineupSwapGrid
          key={fs.map((s) => `${s.inning}:${s.position}:${s.playerId}`).sort().join('|')}
          gameId={gameId}
          mode={game.mode as 'Unified' | 'Split'}
          initialFieldingSlots={fs.map((s) => ({
            gameId: s.gameId,
            inning: s.inning,
            playerId: s.playerId,
            position: s.position,
          }))}
          initialBattingSlots={bs.map((s) => ({
            gameId: s.gameId,
            playerId: s.playerId,
            orderIndex: s.orderIndex,
            genderGroup: s.genderGroup,
          }))}
          initialInnings={innings}
          playerMap={playerMap}
        />
      )}
    </div>
  )
}
