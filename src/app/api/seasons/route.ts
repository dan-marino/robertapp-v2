import { db } from '@/db'
import { seasons } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const rows = await db.select().from(seasons)
  return Response.json(rows)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { name, gameCount } = body

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return Response.json({ error: 'name is required' }, { status: 400 })
  }
  if (!Number.isInteger(gameCount) || gameCount < 1) {
    return Response.json({ error: 'gameCount must be a positive integer' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  await db.insert(seasons).values({ id, name: name.trim(), gameCount })
  const [season] = await db.select().from(seasons).where(eq(seasons.id, id))
  return Response.json(season, { status: 201 })
}
