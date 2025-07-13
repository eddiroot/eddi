import { fail } from '@sveltejs/kit';
import { createUser } from '$lib/server/db/service/user';
import { createSchool } from '$lib/server/db/service/schools';
import { message } from 'sveltekit-superforms';

export const actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const firstName = form.get('firstName')?.toString().trim();
		const lastName = form.get('lastName')?.toString().trim();
		const email = form.get('email')?.toString().trim().toLowerCase();
		const password = form.get('password')?.toString();
		const passwordConfirm = form.get('passwordConfirm')?.toString();
		const schoolName = form.get('schoolName');

		const errors: Record<string, string> = {};
		if (!firstName) errors.firstName = 'First name is required';
		if (!lastName) errors.lastName = 'Last name is required';
		if (!email) errors.email = 'Email is required';
		else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Please enter a valid email address';
		if (!password) errors.password = 'Password is required';
		else if (password.length < 8) errors.password = 'Password must be at least 8 characters';
		if (!passwordConfirm) errors.passwordConfirm = 'Please confirm your password';
		else if (password !== passwordConfirm) errors.passwordConfirm = 'Passwords do not match';
		if (!schoolName) errors.schoolName = 'School ID is missing. Please complete school details first.';

		if (Object.keys(errors).length > 0) {
			return fail(400, { errors });
		}

		try {
			const school = await createSchool(schoolName as string);


			// Generate a unique id for the user, e.g., using crypto.randomUUID()
			const userId = crypto.randomUUID();

			await createUser(
				userId,
				email as string,
				password as string, // You may want to hash the password before passing
				school.id,
				'admin', // or the appropriate userTypeEnum value
				firstName as string,
				lastName as string,
			);
			return { success: true };
		} catch (error) {
			if (error instanceof Error && error.message.includes('already exists')) {
				errors.email = error.message;
				return fail(400, { errors });
			}
			return fail(500, { errors: { general: 'Failed to create admin user.' } });
		}
	}
}; 