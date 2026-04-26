import { boolean, pgEnum, pgTable, varchar } from 'drizzle-orm/pg-core'

export const genderEnum = pgEnum('gender', ['M', 'F'])

export const players = pgTable('players', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  gender: genderEnum('gender').notNull(),
  isGuest: boolean('is_guest').notNull().default(false),
  traded: boolean('traded').notNull().default(false),
})
