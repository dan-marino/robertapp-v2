import { integer, pgTable, varchar } from 'drizzle-orm/pg-core'
import { games } from './games'
import { players } from './players'
import { positionEnum } from './position_preferences'

export const fieldingSlots = pgTable('fielding_slots', {
  id: varchar('id', { length: 36 }).primaryKey(),
  gameId: varchar('game_id', { length: 36 })
    .notNull()
    .references(() => games.id),
  inning: integer('inning').notNull(), // 1-based
  playerId: varchar('player_id', { length: 36 })
    .notNull()
    .references(() => players.id),
  position: positionEnum('position').notNull(),
})
