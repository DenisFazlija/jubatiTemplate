import type { Session, User } from 'better-auth/types';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: Session | undefined;
			user: User | undefined;
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: Env;
			caches: CacheStorage & { default: Cache };
			context: { waitUntil: (promise: Promise<unknown>) => void };
		}
	}
}

export {};
