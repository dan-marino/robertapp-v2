import { pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core'
import { seasons } from './seasons'
import { players } from './players'

export const rosters = pgTable(
  'rosters',
  {
    seasonId: varchar('season_id', { length: 36 })
      .notNull()
      .references(() => seasons.id),
    playerId: varchar('player_id', { length: 36 })
      .notNull()
      .references(() => players.id),
  },
  (t) => [primaryKey({ columns: [t.seasonId, t.playerId] })]
)
