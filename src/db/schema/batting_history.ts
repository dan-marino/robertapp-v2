import { integer, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core'
import { players } from './players'
import { seasons } from './seasons'
import { games } from './games'
import { genderGroupEnum } from './batting_slots'

export const battingHistory = pgTable(
  'batting_history',
  {
    playerId: varchar('player_id', { length: 36 })
      .notNull()
      .references(() => players.id),
    seasonId: varchar('season_id', { length: 36 })
      .notNull()
      .references(() => seasons.id),
    gameId: varchar('game_id', { length: 36 })
      .notNull()
      .references(() => games.id),
    orderIndex: integer('order_index').notNull(),
    genderGroup: genderGroupEnum('gender_group').notNull().default('All'),
  },
  (t) => [primaryKey({ columns: [t.playerId, t.seasonId, t.gameId] })]
)
