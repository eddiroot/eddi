import { generateState, generateCodeVerifier } from 'arctic';
import { microsoft } from '$lib/server/oauth';

export async function GET(event): Promise<Response> {
	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const url = microsoft.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);

	event.cookies.set('microsoft_oauth_state', state, {
		path: '/',
		httpOnly: true,
		maxAge: 60 * 10, // 10 minutes
		sameSite: 'lax'
	});
	event.cookies.set('microsoft_code_verifier', codeVerifier, {
		path: '/',
		httpOnly: true,
		maxAge: 60 * 10, // 10 minutes
		sameSite: 'lax'
	});

	return new Response(null, {
		status: 302,
		headers: {
			Location: url.toString()
		}
	});
}
