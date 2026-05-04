import { notFound } from 'next/navigation'
import { db } from '@/db'
import { players, positionPreferences } from '@/db/schema'
import { eq } from 'drizzle-orm'
import PlayerEditor from './PlayerEditor'
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
      <h1 className="text-2xl font-semibold mb-8">{player.name}</h1>

      <section className="mb-10">
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
          Details
        </h2>
        <PlayerEditor playerId={id} initialName={player.name} initialGender={player.gender} />
      </section>

      <section>
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
          Position Preferences
        </h2>
        <PreferencesEditor playerId={id} initialPrefs={prefs} />
      </section>
    </div>
  )
}
