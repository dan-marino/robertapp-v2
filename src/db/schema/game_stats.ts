import { integer, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core'
import { games } from './games'
import { players } from './players'

export const gameStats = pgTable(
  'game_stats',
  {
    gameId: varchar('game_id', { length: 36 })
      .notNull()
      .references(() => games.id),
    playerId: varchar('player_id', { length: 36 })
      .notNull()
      .references(() => players.id),
    // hits
    s1b: integer('s1b').notNull().default(0),
    s2b: integer('s2b').notNull().default(0),
    s3b: integer('s3b').notNull().default(0),
    hr: integer('hr').notNull().default(0),
    // plate discipline
    bb: integer('bb').notNull().default(0),
    k: integer('k').notNull().default(0),
    // outs
    fo: integer('fo').notNull().default(0),
    fc: integer('fc').notNull().default(0),
    go: integer('go').notNull().default(0),
    // other
    sf: integer('sf').notNull().default(0),
    rbi: integer('rbi').notNull().default(0),
    r: integer('r').notNull().default(0),
    // NOTE: AB is intentionally omitted — it is derived at query time. See docs/adr/0002-ab-derivation.md
  },
  (t) => [primaryKey({ columns: [t.gameId, t.playerId] })]
)
