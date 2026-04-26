import { integer, pgEnum, pgTable, text, varchar } from 'drizzle-orm/pg-core'
import { seasons } from './seasons'

export const gameModeEnum = pgEnum('game_mode', ['Unified', 'Split'])

export const games = pgTable('games', {
  id: varchar('id', { length: 36 }).primaryKey(),
  seasonId: varchar('season_id', { length: 36 })
    .notNull()
    .references(() => seasons.id),
  date: text('date').notNull(), // ISO date string
  inningCount: integer('inning_count').notNull(), // 5 or 6
  mode: gameModeEnum('mode').notNull().default('Unified'),
  time: text('time'),
  opponent: text('opponent'),
})
