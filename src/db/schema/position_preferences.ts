import { pgEnum, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core'
import { players } from './players'

export const positionEnum = pgEnum('position', [
  'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'LCF', 'RCF', 'RF',
])

export const preferenceTierEnum = pgEnum('preference_tier', [
  'Tier1', 'Tier2', 'Tier3', 'Anti',
])

export const positionPreferences = pgTable(
  'position_preferences',
  {
    playerId: varchar('player_id', { length: 36 })
      .notNull()
      .references(() => players.id),
    position: positionEnum('position').notNull(),
    tier: preferenceTierEnum('tier').notNull(),
  },
  (t) => [primaryKey({ columns: [t.playerId, t.position] })]
)
