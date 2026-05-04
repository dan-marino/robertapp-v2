import { db } from '@/db'
import { games, players, seasons, battingSlots, fieldingSlots } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params

  const [game] = await db.select().from(games).where(eq(games.id, gameId))
  if (!game) return new Response('Game not found', { status: 404 })

  const [season] = await db.select().from(seasons).where(eq(seasons.id, game.seasonId))

  const [fs, bs] = await Promise.all([
    db.select().from(fieldingSlots).where(eq(fieldingSlots.gameId, gameId)),
    db.select().from(battingSlots).where(eq(battingSlots.gameId, gameId)),
  ])

  if (fs.length === 0 && bs.length === 0) {
    return new Response('No lineup generated yet', { status: 404 })
  }

  const playerIds = [...new Set([...fs.map((s) => s.playerId), ...bs.map((s) => s.playerId)])]
  const playerRows =
    playerIds.length > 0
      ? await db.select().from(players).where(inArray(players.id, playerIds))
      : []
  const playerMap = Object.fromEntries(playerRows.map((p) => [p.id, p]))

  const innings = [...new Set(fs.map((s) => s.inning))].sort((a, b) => a - b)

  // fieldingMap[playerId][inning] = position
  const fieldingMap = new Map<string, Map<number, string>>()
  for (const slot of fs) {
    if (!fieldingMap.has(slot.playerId)) fieldingMap.set(slot.playerId, new Map())
    fieldingMap.get(slot.playerId)!.set(slot.inning, slot.position)
  }

  const rows: string[][] = []

  // Header rows
  const gameNum = game.date
  const opponent = game.opponent ?? ''
  const titleParts = [season?.name ?? '', gameNum, opponent].filter(Boolean).join(' ')
  const totalCols = 3 + innings.length + 1
  const titleRow = [titleParts, ...Array(totalCols - 2).fill(''), 'FINAL']
  rows.push(titleRow)
  rows.push(['', 'Home', ...Array(totalCols - 2).fill('')])
  rows.push(['', 'Away', ...Array(totalCols - 2).fill('')])
  rows.push(Array(totalCols).fill(''))
  rows.push(['Order', 'Name', 'ABs', ...innings.map(String), ''])

  if (game.mode === 'Unified') {
    const ordered = [...bs].sort((a, b) => a.orderIndex - b.orderIndex)
    for (const slot of ordered) {
      const p = playerMap[slot.playerId]
      const inningCells = innings.map((inn) => fieldingMap.get(slot.playerId)?.get(inn) ?? '-')
      rows.push([String(slot.orderIndex), p?.name ?? slot.playerId, '', ...inningCells, ''])
    }
  } else {
    // Split: men then women with section labels
    const mSlots = [...bs].filter((s) => s.genderGroup === 'M').sort((a, b) => a.orderIndex - b.orderIndex)
    const fSlots = [...bs].filter((s) => s.genderGroup === 'F').sort((a, b) => a.orderIndex - b.orderIndex)

    rows.push([`GUYS (${mSlots.length})`, ...Array(totalCols - 1).fill('')])
    for (const slot of mSlots) {
      const p = playerMap[slot.playerId]
      const inningCells = innings.map((inn) => fieldingMap.get(slot.playerId)?.get(inn) ?? '-')
      rows.push([String(slot.orderIndex), p?.name ?? slot.playerId, '', ...inningCells, ''])
    }
    rows.push(Array(totalCols).fill(''))
    rows.push([`GIRLS (${fSlots.length})`, ...Array(totalCols - 1).fill('')])
    for (const slot of fSlots) {
      const p = playerMap[slot.playerId]
      const inningCells = innings.map((inn) => fieldingMap.get(slot.playerId)?.get(inn) ?? '-')
      rows.push([String(slot.orderIndex), p?.name ?? slot.playerId, '', ...inningCells, ''])
    }
  }

  const csv = rows.map((r) => r.map((cell) => {
    // Quote cells that contain commas or quotes
    if (cell.includes(',') || cell.includes('"')) {
      return `"${cell.replace(/"/g, '""')}"`
    }
    return cell
  }).join(',')).join('\r\n')

  const filename = `lineup-${game.date}.csv`

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
