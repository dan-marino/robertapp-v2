import { integer, pgEnum, pgTable, varchar } from 'drizzle-orm/pg-core'
import { games } from './games'
import { players } from './players'

export const genderGroupEnum = pgEnum('gender_group', ['M', 'F', 'All'])

export const battingSlots = pgTable('batting_slots', {
  id: varchar('id', { length: 36 }).primaryKey(),
  gameId: varchar('game_id', { length: 36 })
    .notNull()
    .references(() => games.id),
  playerId: varchar('player_id', { length: 36 })
    .notNull()
    .references(() => players.id),
  orderIndex: integer('order_index').notNull(), // 1-based
  genderGroup: genderGroupEnum('gender_group').notNull().default('All'),
})
