import { integer, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core'
import { players } from './players'
import { seasons } from './seasons'
import { positionEnum } from './position_preferences'

export const positionHistory = pgTable(
  'position_history',
  {
    playerId: varchar('player_id', { length: 36 })
      .notNull()
      .references(() => players.id),
    seasonId: varchar('season_id', { length: 36 })
      .notNull()
      .references(() => seasons.id),
    position: positionEnum('position').notNull(),
    count: integer('count').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.playerId, t.seasonId, t.position] })]
)
