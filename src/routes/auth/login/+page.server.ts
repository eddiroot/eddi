import { verify } from '@node-rs/argon2';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import * as auth from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { validateEmail, validatePassword } from '../utils';

export const load = async (event) => {
	if (event.locals.user) {
		return redirect(302, '/dashboard');
	}
	return {};
};

export const actions = {
	login: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email');
		const password = formData.get('password');

		if (!validateEmail(email)) {
			return fail(400, {
				message: 'Invalid email (min 3, max 31 characters, alphanumeric only)'
			});
		}
		if (!validatePassword(password)) {
			return fail(400, { message: 'Invalid password (min 6, max 255 characters)' });
		}

		const results = await db.select().from(table.user).where(eq(table.user.email, email));

		const existingUser = results.at(0);
		if (!existingUser) {
			return fail(400, { message: 'Incorrect email or password' });
		}

		if (existingUser.isArchived) {
			return fail(400, { message: 'This account has been archived. Please contact support.' });
		}

		if (!existingUser.emailVerified) {
			return fail(400, { message: 'Please verify your email before logging in.' });
		}

		const validPassword = await verify(existingUser.passwordHash, password);
		if (!validPassword) {
			return fail(400, { message: 'Incorrect email or password' });
		}

		const session = await auth.createSession(existingUser.id);
		auth.setSessionTokenCookie(event, session.token);

		return redirect(302, '/dashboard');
	}
};
