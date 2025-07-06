import { fail, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { schoolFormSchema } from './schema';
import { getSchoolById, updateSchool } from '$lib/server/db/service';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().getUser();
	const school = await getSchoolById(user.schoolId);

	if (!school) {
		throw error(404, 'School not found');
	}

	const form = await superValidate(
		{
			name: school?.name || '',
			emailSuffix: school?.emailSuffix || ''
		},
		zod(schoolFormSchema)
	);

	return { form, school };
};

export const actions = {
	default: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().getUser();

		const formData = await request.formData();
		const form = await superValidate(formData, zod(schoolFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await updateSchool(user.schoolId, form.data.name, form.data.emailSuffix);
			return { form };
		} catch (error) {
			console.error('Error updating school:', error);
			return fail(500, { form, message: 'Failed to update school details' });
		}
	}
};
