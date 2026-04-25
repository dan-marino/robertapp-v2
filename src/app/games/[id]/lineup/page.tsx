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
  const playerMap: Record<string, string> = Object.fromEntries(
    playerRows.map((p) => [p.id, p.name])
  )

  const innings = [...new Set(fs.map((s) => s.inning))].sort((a, b) => a - b)
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
        <div className="flex items-center gap-2">
          {hasLineup && <ReshuffleButton gameId={gameId} />}
          <GenerateLineupButton gameId={gameId} />
        </div>
      </div>

      {!hasLineup && (
        <p className="text-zinc-400 text-sm">
          No lineup generated yet. Save RSVPs and click &quot;Generate Lineup&quot; above.
        </p>
      )}

      {hasLineup && (
        <LineupSwapGrid
          gameId={gameId}
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
