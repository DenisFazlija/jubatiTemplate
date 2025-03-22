import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { getLocale } from '$lib/paraglide/runtime';
import 'dayjs/locale/de';
import 'dayjs/locale/fr';
import dayjs from '$lib/dayjs';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { auth } from '$lib/server/auth';
import { drizzle } from 'drizzle-orm/d1';
import { paraglideMiddleware } from '$lib/paraglide/server';

const originalHandle: Handle = async ({ event, resolve }) => {
	const locale = getLocale();
	dayjs.locale(locale);

	if (event.route.id?.includes('/admin')) {
		const authHandler = auth(drizzle(event.platform!.env.DB));
		const session = await authHandler.api.getSession({
			headers: event.request.headers
		});
		event.locals.session = session?.session;
		event.locals.user = session?.user;
	}

	const response = await resolve(event);
	return response;
};

const authHandle: Handle = async ({ event, resolve }) => {
	const authHandler = auth(drizzle(event.platform!.env.DB));
	return svelteKitHandler({ event, resolve, auth: authHandler });
};

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ locale }) => {
		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%lang%', locale)
		});
	});

const cachedHandle: Handle = async ({ event, resolve }) => {
	if (event.route.id !== '/' || !event.platform?.caches) return resolve(event);

	const cache = event.platform.caches.default;

	const cached = await cache.match(event.request.url);

	// HIT
	if (cached) {
		return cached;
	}

	// MISS
	const response = await resolve(event);
	if (response.headers.has('cache-control')) {
		event.platform.context.waitUntil(cache.put(event.request.url, response.clone()));
	}

	return response;
};

export const handle = sequence(authHandle, handleParaglide, originalHandle, cachedHandle);
