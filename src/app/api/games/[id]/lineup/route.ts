import { db } from '@/db'
import { fieldingSlots, battingSlots, games } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params

  const [game] = await db.select().from(games).where(eq(games.id, gameId))
  if (!game) {
    return Response.json({ error: 'Game not found' }, { status: 404 })
  }

  const [fs, bs] = await Promise.all([
    db.select().from(fieldingSlots).where(eq(fieldingSlots.gameId, gameId)),
    db.select().from(battingSlots).where(eq(battingSlots.gameId, gameId)),
  ])

  if (fs.length === 0 && bs.length === 0) {
    return Response.json({ error: 'No lineup generated yet' }, { status: 404 })
  }

  return Response.json({
    gameId,
    fieldingSlots: fs.map((s) => ({
      gameId: s.gameId,
      inning: s.inning,
      playerId: s.playerId,
      position: s.position,
    })),
    battingSlots: bs.map((s) => ({
      gameId: s.gameId,
      playerId: s.playerId,
      orderIndex: s.orderIndex,
      genderGroup: s.genderGroup,
    })),
  })
}
