import { db } from '@/db'
import { gameStats, games, players, rosters } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

interface Props {
  seasonId: string
  gameIds: string[]
}

function fmt3(n: number | null): string {
  if (n === null) return '—'
  return n.toFixed(3).replace(/^0/, '')
}

export default async function SeasonStatsTable({ seasonId, gameIds }: Props) {
  // Get all players on the season roster
  const rosterRows = await db
    .select({ player: players })
    .from(rosters)
    .innerJoin(players, eq(rosters.playerId, players.id))
    .where(eq(rosters.seasonId, seasonId))

  type StatRow = {
    playerId: string
    g: number
    s1b: number
    s2b: number
    s3b: number
    hr: number
    bb: number
    k: number
    fo: number
    fc: number
    go: number
    sf: number
    rbi: number
    r: number
  }

  let statRows: StatRow[] = []

  if (gameIds.length > 0) {
    const placeholders = gameIds.map((_, i) => `$${i + 1}`).join(',')
    statRows = await db
      .select({
        playerId: gameStats.playerId,
        g: sql<number>`count(distinct ${gameStats.gameId})`,
        s1b: sql<number>`coalesce(sum(${gameStats.s1b}), 0)`,
        s2b: sql<number>`coalesce(sum(${gameStats.s2b}), 0)`,
        s3b: sql<number>`coalesce(sum(${gameStats.s3b}), 0)`,
        hr: sql<number>`coalesce(sum(${gameStats.hr}), 0)`,
        bb: sql<number>`coalesce(sum(${gameStats.bb}), 0)`,
        k: sql<number>`coalesce(sum(${gameStats.k}), 0)`,
        fo: sql<number>`coalesce(sum(${gameStats.fo}), 0)`,
        fc: sql<number>`coalesce(sum(${gameStats.fc}), 0)`,
        go: sql<number>`coalesce(sum(${gameStats.go}), 0)`,
        sf: sql<number>`coalesce(sum(${gameStats.sf}), 0)`,
        rbi: sql<number>`coalesce(sum(${gameStats.rbi}), 0)`,
        r: sql<number>`coalesce(sum(${gameStats.r}), 0)`,
      })
      .from(gameStats)
      .where(sql`${gameStats.gameId} in ${sql.raw(`(${gameIds.map((gid) => `'${gid.replace(/'/g, "''")}'`).join(',')})`)}`)
      .groupBy(gameStats.playerId)
  }

  const statsByPlayerId = new Map(statRows.map((row) => [row.playerId, row]))

  const rows = rosterRows.map(({ player }) => {
    const s = statsByPlayerId.get(player.id)
    const s1b = Number(s?.s1b ?? 0)
    const s2b = Number(s?.s2b ?? 0)
    const s3b = Number(s?.s3b ?? 0)
    const hr = Number(s?.hr ?? 0)
    const bb = Number(s?.bb ?? 0)
    const k = Number(s?.k ?? 0)
    const fo = Number(s?.fo ?? 0)
    const fc = Number(s?.fc ?? 0)
    const go = Number(s?.go ?? 0)
    const sf = Number(s?.sf ?? 0)
    const rbi = Number(s?.rbi ?? 0)
    const r = Number(s?.r ?? 0)
    const g = Number(s?.g ?? 0)

    const h = s1b + s2b + s3b + hr
    const ab = s1b + s2b + s3b + hr + k + fo + fc + go
    const tb = s1b + 2 * s2b + 3 * s3b + 4 * hr

    const ba = ab > 0 ? h / ab : null
    const obp = ab > 0 ? (h + bb) / ab : null
    const slg = ab > 0 ? tb / ab : null

    return { player, g, ab, h, s1b, s2b, s3b, hr, bb, k, sf, rbi, r, ba, obp, slg }
  })

  // Sort by BA desc (nulls last), then name
  rows.sort((a, b) => {
    if (a.ba !== null && b.ba !== null) return b.ba - a.ba
    if (a.ba !== null) return -1
    if (b.ba !== null) return 1
    return a.player.name.localeCompare(b.player.name)
  })

  const th = 'px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide whitespace-nowrap'
  const thR = 'px-3 py-2 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide whitespace-nowrap'
  const td = 'px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 whitespace-nowrap'
  const tdR = 'px-3 py-2 text-sm text-right text-zinc-900 dark:text-zinc-100 whitespace-nowrap tabular-nums'

  return (
    <section className="mb-10">
      <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
        Season Stats
      </h2>
      <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className={th}>Player</th>
              <th className={thR}>G</th>
              <th className={thR}>AB</th>
              <th className={thR}>H</th>
              <th className={thR}>1B</th>
              <th className={thR}>2B</th>
              <th className={thR}>3B</th>
              <th className={thR}>HR</th>
              <th className={thR}>BB</th>
              <th className={thR}>K</th>
              <th className={thR}>SF</th>
              <th className={thR}>RBI</th>
              <th className={thR}>R</th>
              <th className={thR}>BA</th>
              <th className={thR}>OBP</th>
              <th className={thR}>SLG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
            {rows.map(({ player, g, ab, h, s1b, s2b, s3b, hr, bb, k, sf, rbi, r, ba, obp, slg }) => (
              <tr key={player.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                <td className={td}>{player.name}</td>
                <td className={tdR}>{g}</td>
                <td className={tdR}>{ab}</td>
                <td className={tdR}>{h}</td>
                <td className={tdR}>{s1b}</td>
                <td className={tdR}>{s2b}</td>
                <td className={tdR}>{s3b}</td>
                <td className={tdR}>{hr}</td>
                <td className={tdR}>{bb}</td>
                <td className={tdR}>{k}</td>
                <td className={tdR}>{sf}</td>
                <td className={tdR}>{rbi}</td>
                <td className={tdR}>{r}</td>
                <td className={tdR}>{fmt3(ba)}</td>
                <td className={tdR}>{fmt3(obp)}</td>
                <td className={tdR}>{fmt3(slg)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={16} className="px-3 py-4 text-sm text-zinc-400 dark:text-zinc-500 text-center">
                  No players on roster yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
