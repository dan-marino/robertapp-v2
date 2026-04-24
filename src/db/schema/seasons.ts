import { integer, pgTable, text, varchar } from 'drizzle-orm/pg-core'

export const seasons = pgTable('seasons', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: text('name').notNull(),
  gameCount: integer('game_count').notNull(),
})
