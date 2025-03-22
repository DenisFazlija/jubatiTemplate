import { redirect } from '@sveltejs/kit';
import type { Session } from 'better-auth/types';

function isAuthenticated(session?: Session) {
	if (!session) redirect(302, '/login');
}

export default isAuthenticated;
