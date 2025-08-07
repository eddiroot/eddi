import { google, createSession, setSessionTokenCookie } from '$lib/server/auth';
import { decodeIdToken } from 'arctic';

import type { RequestEvent } from '@sveltejs/kit';
import type { OAuth2Tokens } from 'arctic';
import { createGoogleUser, getUserByGoogleId } from '$lib/server/db/service';

export async function GET(event: RequestEvent): Promise<Response> {
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const storedState = event.cookies.get('google_oauth_state') ?? null;
	const codeVerifier = event.cookies.get('google_code_verifier') ?? null;
	if (code === null || state === null || storedState === null || codeVerifier === null) {
		return new Response(null, {
			status: 400
		});
	}
	if (state !== storedState) {
		return new Response(null, {
			status: 400
		});
	}

	let tokens: OAuth2Tokens;
	try {
		tokens = await google.validateAuthorizationCode(code, codeVerifier);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (e) {
		// Invalid code or client credentials
		return new Response(null, {
			status: 400
		});
	}
	const claims = decodeIdToken(tokens.idToken()) as {
		sub: string;
		name: string;
		given_name: string;
		family_name: string;
		email: string;
		picture: string;
	};

	const existingUser = await getUserByGoogleId(claims.sub);

	if (existingUser !== null) {
		const session = await createSession(existingUser.id);
		setSessionTokenCookie(event, session.token);
		return new Response(null, {
			status: 302,
			headers: {
				Location: '/'
			}
		});
	}

	const user = await createGoogleUser({
		googleId: claims.sub,
		email: claims.email,
		schoolId: 1000, // TODO: Replace with actual school ID logic
		firstName: claims.given_name,
		lastName: claims.family_name,
		avatarUrl: claims.picture
	});

	const session = await createSession(user.id);
	setSessionTokenCookie(event, session.token);
	return new Response(null, {
		status: 302,
		headers: {
			Location: '/'
		}
	});
}
