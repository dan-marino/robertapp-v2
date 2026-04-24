import { notFound } from 'next/navigation'
import { db } from '@/db'
import { players, positionPreferences } from '@/db/schema'
import { eq } from 'drizzle-orm'
import PreferencesEditor from './PreferencesEditor'

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [player] = await db.select().from(players).where(eq(players.id, id))
  if (!player) notFound()

  const prefs = await db
    .select()
    .from(positionPreferences)
    .where(eq(positionPreferences.playerId, id))

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-1">{player.name}</h1>
      <p className="text-sm text-zinc-500 mb-8">{player.gender}</p>

      <section>
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
          Position Preferences
        </h2>
        <PreferencesEditor playerId={id} initialPrefs={prefs} />
      </section>
    </div>
  )
}
