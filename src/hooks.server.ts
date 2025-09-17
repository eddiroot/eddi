import { building } from '$app/environment';
import * as auth from '$lib/server/auth.js';
import { Security } from '$lib/server/security';
import type { Handle } from '@sveltejs/kit';
// import cron from 'node-cron';
// import { processTimetableQueue } from './scripts/processTimetable';

if (!building) {
	// cron.schedule('* * * * *', () => {
	// 	processTimetableQueue();
	// });
}

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);

	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		event.locals.security = new Security(event);
		return resolve(event);
	}

	const { session, user } = await auth.validateSessionToken(sessionToken);

	if (session && user) {
		auth.setSessionTokenCookie(event, sessionToken);
		event.locals.user = user;
		event.locals.session = session;
	} else {
		auth.deleteSessionTokenCookie(event);
		event.locals.user = null;
		event.locals.session = null;
	}

	event.locals.security = new Security(event);
	return resolve(event);
};

export const handle: Handle = handleAuth;
