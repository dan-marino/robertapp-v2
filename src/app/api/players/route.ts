import { db } from '@/db'
import { players } from '@/db/schema'
import { eq, and, ne } from 'drizzle-orm'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const includeTraded = searchParams.get('includeTraded') === 'true'

  const conditions = [eq(players.isGuest, false)]
  if (!includeTraded) {
    conditions.push(eq(players.traded, false))
  }

  const rows = await db
    .select()
    .from(players)
    .where(and(...conditions))

  return Response.json(rows)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { name, gender } = body

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return Response.json({ error: 'name is required' }, { status: 400 })
  }
  if (gender !== 'M' && gender !== 'F') {
    return Response.json({ error: 'gender must be M or F' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  await db.insert(players).values({ id, name: name.trim(), gender, isGuest: false, traded: false })

  const [player] = await db.select().from(players).where(eq(players.id, id))
  return Response.json(player, { status: 201 })
}
