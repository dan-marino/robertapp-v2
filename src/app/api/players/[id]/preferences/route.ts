import { db } from '@/db'
import { players, positionPreferences } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { ALL_POSITIONS } from '@/domain/types'
import type { Position, PreferenceTier } from '@/domain/types'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const rows = await db
    .select()
    .from(positionPreferences)
    .where(eq(positionPreferences.playerId, id))

  return Response.json(rows)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: playerId } = await params

  const [player] = await db.select().from(players).where(eq(players.id, playerId))
  if (!player) {
    return Response.json({ error: 'Player not found' }, { status: 404 })
  }

  const body = await request.json()

  if (!Array.isArray(body)) {
    return Response.json({ error: 'Body must be an array of { position, tier }' }, { status: 400 })
  }

  const validTiers: PreferenceTier[] = ['Tier1', 'Tier2', 'Tier3', 'Anti']

  for (const item of body) {
    if (!ALL_POSITIONS.includes(item.position as Position)) {
      return Response.json({ error: `Invalid position: ${item.position}` }, { status: 400 })
    }
    if (!validTiers.includes(item.tier as PreferenceTier)) {
      return Response.json({ error: `Invalid tier: ${item.tier}` }, { status: 400 })
    }
  }

  // Replace all preferences for this player
  await db.delete(positionPreferences).where(eq(positionPreferences.playerId, playerId))

  if (body.length > 0) {
    await db.insert(positionPreferences).values(
      body.map((item: { position: Position; tier: PreferenceTier }) => ({
        playerId,
        position: item.position,
        tier: item.tier,
      }))
    )
  }

  const updated = await db
    .select()
    .from(positionPreferences)
    .where(eq(positionPreferences.playerId, playerId))

  return Response.json(updated)
}
