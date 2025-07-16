import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db'; // Adjust import as needed
import { eq } from 'drizzle-orm';
import { user as userTable, session as sessionTable } from '$lib/server/db/schema/user';
import { randomUUID } from 'crypto';
import { sendEmailVerification } from '$lib/server/email';

export const actions = {
	verify: async ({ request, cookies }) => {
		const form = await request.formData();
		const code = form.get('code');
		const userId = cookies.get('verify_user_id');
		const expectedCode = cookies.get('verify_code');

		if (typeof code !== 'string' || !userId || !expectedCode) {
			return fail(400, { error: 'Invalid form submission.' });
		}

		if (code !== expectedCode) {
			return fail(400, { error: 'Invalid verification code.' });
		}

		const [user] = await db.select().from(userTable).where(eq(userTable.id, userId));
		if (!user) {
			return fail(400, { error: 'User not found.' });
		}

		await db.update(userTable).set({ emailVerified: true }).where(eq(userTable.id, user.id));

		const sessionId = randomUUID();
		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
		await db.insert(sessionTable).values({
			id: sessionId,
			userId: user.id,
			expiresAt
		});

		cookies.set('session', sessionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			expires: expiresAt
		});

		cookies.delete('verify_user_id', { path: '/' });
		cookies.delete('verify_code', { path: '/' });

		throw redirect(303, '/dashboard');
	},
	resend: async ({ cookies }) => {
		const userId = cookies.get('verify_user_id');
		if (!userId) {
			return fail(400, { error: 'No user session found.' });
		}

		const [user] = await db.select().from(userTable).where(eq(userTable.id, userId));
		if (!user) {
			return fail(400, { error: 'User not found.' });
		}
		const code = await sendEmailVerification(user.email);
		cookies.set('verify_code', code, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 10 * 60 // 10 minutes
		});
		return { success: true };
	}
};
