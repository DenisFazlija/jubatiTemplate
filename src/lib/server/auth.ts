import { betterAuth } from 'better-auth';
import { APIError } from 'better-auth/api';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import * as schema from '$lib/server/db/schema';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private';
import ALLOWED_EMAILS from '../../ALLOWED_EMAILS';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

export const auth = (db: DrizzleD1Database) =>
	betterAuth({
		database: drizzleAdapter(db, {
			provider: 'sqlite',
			schema: schema
		}),
		databaseHooks: {
			user: {
				create: {
					before: async (user) => {
						if (!ALLOWED_EMAILS.includes(user.email.toLowerCase())) {
							throw new APIError('UNAUTHORIZED', {
								message: `Not admin, ${user.email}`
							});
						}
						return {
							data: user
						};
					}
				}
			}
		},
		socialProviders: {
			google: {
				clientId: GOOGLE_CLIENT_ID,
				clientSecret: GOOGLE_CLIENT_SECRET
			}
		}
	});
