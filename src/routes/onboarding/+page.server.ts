import { fail } from '@sveltejs/kit';
import { createAdminUser } from '$lib/server/db/service';
import { message } from 'sveltekit-superforms';

export const actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const firstName = form.get('firstName')?.toString().trim();
		const lastName = form.get('lastName')?.toString().trim();
		const email = form.get('email')?.toString().trim().toLowerCase();
		const password = form.get('password')?.toString();
		const passwordConfirm = form.get('passwordConfirm')?.toString();
		const schoolId = locals.schoolId;

		const errors: Record<string, string> = {};
		if (!firstName) errors.firstName = 'First name is required';
		if (!lastName) errors.lastName = 'Last name is required';
		if (!email) errors.email = 'Email is required';
		else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Please enter a valid email address';
		if (!password) errors.password = 'Password is required';
		else if (password.length < 8) errors.password = 'Password must be at least 8 characters';
		if (!passwordConfirm) errors.passwordConfirm = 'Please confirm your password';
		else if (password !== passwordConfirm) errors.passwordConfirm = 'Passwords do not match';
		if (!schoolId) errors.schoolId = 'School ID is missing. Please complete school details first.';

		if (Object.keys(errors).length > 0) {
			return fail(400, { errors });
		}

		try {
			await createAdminUser({
				firstName: firstName as string,
				lastName: lastName as string,
				email: email as string,
				password: password as string,
				schoolId: schoolId as number
			});
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