import { fail, redirect } from '@sveltejs/kit';
import { sendEmailVerification } from '$lib/server/email';
import { getUserById, setUserVerified, updateUserVerificationCode } from '$lib/server/db/service';
import { randomInt } from 'crypto';

export const actions = {
	verify: async ({ request, cookies }) => {
		const form = await request.formData();
		const code = form.get('code');
		const userId = cookies.get('verify_user_id');

		if (typeof code !== 'string' || !userId) {
			return fail(400, { error: 'Invalid form submission.' });
		}

		const user = await getUserById(userId);
		if (!user) {
			return fail(400, { error: 'Something went wrong..' });
		}

		if (code !== user.verificationCode) {
			return fail(400, { error: 'Invalid verification code.' });
		}

		await setUserVerified(user.id);
		throw redirect(303, '/auth/login');
	},
	resend: async ({ cookies }) => {
		const userId = cookies.get('verify_user_id');
		if (!userId) {
			return fail(400, { error: 'No user session found.' });
		}

		const user = await getUserById(userId);
		if (!user) {
			return fail(400, { error: 'Something went wrong.' });
		}

		const code = String(randomInt(100000, 1000000));
		await updateUserVerificationCode(user.id, code);
		await sendEmailVerification(user.email, code);

		return { success: true };
	}
};
