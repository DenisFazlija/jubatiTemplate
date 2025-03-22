import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const customerTable = sqliteTable(
	'customer',
	{
		id: integer().primaryKey(),
		firstName: text().notNull(),
		lastName: text().notNull(),
		email: text(),
		phone: text(),
		street: text(),
		zip: text(),
		city: text()
	},
	(table) => [
		index('customer_name_idx').on(table.firstName, table.lastName),
		index('customer_email_idx').on(table.email) // Add index for email searches
	]
);

export const employeeTable = sqliteTable('employee', {
	id: integer().primaryKey(),
	name: text().notNull()
});

export const shiftPlanTable = sqliteTable(
	'shiftPlan',
	{
		id: integer().primaryKey(),
		employeeId: integer()
			.notNull()
			.references(() => employeeTable.id, { onDelete: 'cascade' }),
		Mon_from: text().notNull(),
		Mon_to: text().notNull(),
		Tue_from: text().notNull(),
		Tue_to: text().notNull(),
		Wed_from: text().notNull(),
		Wed_to: text().notNull(),
		Thu_from: text().notNull(),
		Thu_to: text().notNull(),
		Fri_from: text().notNull(),
		Fri_to: text().notNull(),
		Sat_from: text().notNull(),
		Sat_to: text().notNull(),
		Sun_from: text().notNull(),
		Sun_to: text().notNull(),
		Lunch_from: text().notNull(),
		Lunch_to: text().notNull()
	},
	(table) => [index('shift_plan_employee_id_idx').on(table.employeeId)]
);

export const serviceTable = sqliteTable(
	'service',
	{
		id: integer().primaryKey(),
		service: text().notNull(),
		duration: integer().notNull()
	},
	(table) => [
		index('service_name_idx').on(table.service) // Add index for service name searches
	]
);

export const appointmentTable = sqliteTable(
	'appointment',
	{
		id: integer().primaryKey(),
		serviceId: integer()
			.notNull()
			.references(() => serviceTable.id, { onDelete: 'cascade' }),
		employeeId: integer()
			.notNull()
			.references(() => employeeTable.id, { onDelete: 'cascade' }),
		date: text().notNull(),
		time_from: text().notNull(),
		time_to: text().notNull(),
		customerId: integer()
			.notNull()
			.references(() => customerTable.id, { onDelete: 'cascade' }),
		description: text()
	},
	(table) => [
		// Main query optimization indexes
		index('appointment_date_idx').on(table.date), // For filtering by just date
		index('appointment_date_time_idx').on(table.date, table.time_from),
		index('appointment_employee_date_idx').on(table.employeeId, table.date), // Used in several queries
		// The most important index for overlap checks - keep order: employeeId, date, time_from, time_to
		index('appointment_employee_date_time_idx').on(
			table.employeeId,
			table.date,
			table.time_from,
			table.time_to
		),
		// Foreign key indexes
		index('appointment_service_id_idx').on(table.serviceId),
		index('appointment_customer_id_idx').on(table.customerId)
	]
);
//AUTH FROM BETTER AUTH

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).notNull(),
	image: text('image'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const session = sqliteTable(
	'session',
	{
		id: text('id').primaryKey(),
		expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
		token: text('token').notNull().unique(),
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' })
	},
	(table) => [
		index('session_user_id_idx').on(table.userId),
		index('session_expires_at_idx').on(table.expiresAt)
	]
);

export const account = sqliteTable(
	'account',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
		refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
		scope: text('scope'),
		password: text('password'),
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
	},
	(table) => [
		index('account_provider_account_id_idx').on(table.providerId, table.accountId),
		index('account_user_id_idx').on(table.userId)
	]
);

export const verification = sqliteTable(
	'verification',
	{
		id: text('id').primaryKey(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
		createdAt: integer('created_at', { mode: 'timestamp' }),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
	},
	(table) => [
		index('verification_identifier_value_idx').on(table.identifier, table.value),
		index('verification_expires_at_idx').on(table.expiresAt)
	]
);
