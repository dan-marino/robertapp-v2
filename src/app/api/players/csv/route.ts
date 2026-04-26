import { db } from '@/db'
import { players, positionPreferences } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { parsePlayerCSV } from '@/domain/csvParser'

export async function POST(request: Request) {
  const body = await request.json()
  const { csv } = body

  if (!csv || typeof csv !== 'string') {
    return Response.json({ error: 'csv must be a non-empty string' }, { status: 400 })
  }

  const { players: parsedPlayers, preferences, skipped } = parsePlayerCSV(csv)

  // Fetch existing non-guest player names for DB-level duplicate detection
  const existing = await db
    .select({ name: players.name })
    .from(players)
    .where(eq(players.isGuest, false))

  const existingNamesLower = new Set(existing.map((p) => p.name.toLowerCase()))

  const allSkipped = [...skipped]
  let imported = 0

  for (const p of parsedPlayers) {
    if (existingNamesLower.has(p.name.toLowerCase())) {
      allSkipped.push(p.name)
      continue
    }

    const id = crypto.randomUUID()
    await db.insert(players).values({ id, name: p.name, gender: p.gender, isGuest: false })

    // Insert preferences for this player
    const playerPrefs = preferences.filter(
      (pref) => pref.playerName.toLowerCase() === p.name.toLowerCase()
    )
    if (playerPrefs.length > 0) {
      await db.insert(positionPreferences).values(
        playerPrefs.map((pref) => ({
          playerId: id,
          position: pref.position,
          tier: pref.tier,
        }))
      )
    }

    imported++
    existingNamesLower.add(p.name.toLowerCase())
  }

  return Response.json({ imported, skipped: allSkipped })
}
