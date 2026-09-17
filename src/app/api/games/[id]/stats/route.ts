import { db } from '@/db'
import { battingSlots, games, players, rosters, rsvps } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getActiveRoster } from '@/domain/rsvpManager'
import { getGameStats, upsertPlayerGameStats } from '@/domain/statsRepository'
import { computeDerivedStats, ZERO_COUNTS } from '@/domain/gameStats'
import type { GameStatCounts } from '@/domain/gameStats'

const COUNT_FIELDS: (keyof GameStatCounts)[] = [
  's1b', 's2b', 's3b', 'hr',
  'bb', 'k', 'fo', 'fc', 'go', 'sf',
  'rbi', 'r',
]

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params

  const [game] = await db.select().from(games).where(eq(games.id, gameId))
  if (!game) {
    return Response.json({ error: 'Game not found' }, { status: 404 })
  }

  // Get all roster players for this season (including guests)
  const rosterRows = await db
    .select({ player: players })
    .from(rosters)
    .innerJoin(players, eq(rosters.playerId, players.id))
    .where(eq(rosters.seasonId, game.seasonId))

  const rsvpRows = await db
    .select()
    .from(rsvps)
    .where(eq(rsvps.gameId, gameId))

  const rosterPlayers = rosterRows.map(({ player }) => player)

  // Active roster: Present or Late RSVPs, plus guests (guests always included)
  const activePlayers = [
    ...getActiveRoster(
      rosterPlayers.filter((p) => !p.isGuest),
      rsvpRows
    ),
    ...rosterPlayers.filter((p) => p.isGuest),
  ]

  // Get existing stat rows and index by playerId
  const statRows = await getGameStats(gameId)
  const statMap = new Map(statRows.map((row) => [row.playerId, row]))

  // Get batting order for this game
  const slotRows = await db
    .select()
    .from(battingSlots)
    .where(eq(battingSlots.gameId, gameId))
  const slotMap = new Map(slotRows.map((s) => [s.playerId, s]))

  // Build response: one entry per active player, zeroed if no row exists
  const mapped = activePlayers.map((player) => {
    const row = statMap.get(player.id)
    const counts: GameStatCounts = row
      ? {
          s1b: row.s1b,
          s2b: row.s2b,
          s3b: row.s3b,
          hr: row.hr,
          bb: row.bb,
          k: row.k,
          fo: row.fo,
          fc: row.fc,
          go: row.go,
          sf: row.sf,
          rbi: row.rbi,
          r: row.r,
        }
      : { ...ZERO_COUNTS }

    const derived = computeDerivedStats(counts)
    const slot = slotMap.get(player.id)

    return {
      playerId: player.id,
      name: player.name,
      isGuest: player.isGuest,
      _slot: slot ?? null,
      ...counts,
      ...derived,
    }
  })

  // Sort by lineup order matching the game mode; players not in the lineup go last (alphabetically)
  const inLineup = mapped.filter((p) => p._slot !== null)
  const notInLineup = mapped
    .filter((p) => p._slot === null)
    .sort((a, b) => a.name.localeCompare(b.name))

  if (game.mode === 'Split') {
    const guys = inLineup
      .filter((p) => p._slot!.genderGroup === 'M')
      .sort((a, b) => a._slot!.orderIndex - b._slot!.orderIndex)
    const girls = inLineup
      .filter((p) => p._slot!.genderGroup === 'F')
      .sort((a, b) => a._slot!.orderIndex - b._slot!.orderIndex)
    inLineup.length = 0
    inLineup.push(...guys, ...girls)
  } else {
    inLineup.sort((a, b) => a._slot!.orderIndex - b._slot!.orderIndex)
  }

  const result = [...inLineup, ...notInLineup].map(({ _slot, ...rest }) => rest)

  return Response.json(result)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params

  const [game] = await db.select().from(games).where(eq(games.id, gameId))
  if (!game) {
    return Response.json({ error: 'Game not found' }, { status: 404 })
  }

  const body = await request.json()

  if (!body || !Array.isArray(body.stats)) {
    return Response.json({ error: 'Body must be { stats: Array<{ playerId, s1b, s2b, ... }> }' }, { status: 400 })
  }

  for (const item of body.stats) {
    for (const field of COUNT_FIELDS) {
      if (!isNonNegativeInteger(item[field])) {
        return Response.json(
          { error: `Field "${field}" for player "${item.playerId}" must be a non-negative integer` },
          { status: 400 }
        )
      }
    }
  }

  for (const item of body.stats) {
    const counts: GameStatCounts = {
      s1b: item.s1b,
      s2b: item.s2b,
      s3b: item.s3b,
      hr: item.hr,
      bb: item.bb,
      k: item.k,
      fo: item.fo,
      fc: item.fc,
      go: item.go,
      sf: item.sf,
      rbi: item.rbi,
      r: item.r,
    }
    await upsertPlayerGameStats(gameId, item.playerId, counts)
  }

  const rows = await getGameStats(gameId)
  const result = rows.map((row) => ({
    ...row,
    ...computeDerivedStats(row),
  }))

  return Response.json(result)
}
