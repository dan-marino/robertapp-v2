import { pgEnum, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core'
import { games } from './games'
import { players } from './players'

export const rsvpStatusEnum = pgEnum('rsvp_status', ['Present', 'Absent', 'Late'])

export const rsvps = pgTable(
  'rsvps',
  {
    gameId: varchar('game_id', { length: 36 })
      .notNull()
      .references(() => games.id),
    playerId: varchar('player_id', { length: 36 })
      .notNull()
      .references(() => players.id),
    status: rsvpStatusEnum('status').notNull(),
  },
  (t) => [primaryKey({ columns: [t.gameId, t.playerId] })]
)
