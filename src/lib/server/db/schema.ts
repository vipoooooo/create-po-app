import { mysqlTable, bigint, varchar, boolean } from 'drizzle-orm/mysql-core';

export const user = mysqlTable('users', {
	id: varchar('id', {
		length: 15 // change this when using custom user ids
	}).primaryKey(),
	username: varchar('username', { length: 32 }).notNull(),
	email: varchar('email', { length: 100 }).notNull()
	// other user attributes
});

export const userKeys = mysqlTable('user_keys', {
	id: varchar('id', { length: 255 }).primaryKey().notNull(),
	user_id: varchar('user_id', { length: 15 }).notNull(),
	hashedPassword: varchar('hashed_password', { length: 255 })
});

export const userSessions = mysqlTable('user_sessions', {
	id: varchar('id', { length: 127 }).primaryKey().notNull(),
	user_id: varchar('user_id', { length: 15 }).notNull(),
	activeExpires: bigint('active_expires', { mode: 'number' }).notNull(),
	idleExpires: bigint('idle_expires', { mode: 'number' }).notNull()
});
