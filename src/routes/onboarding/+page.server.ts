import {
	checkSchoolExistence,
	createSchool,
	createUser,
	checkUserExistence
} from '$lib/server/db/service';
import { userTypeEnum } from '$lib/server/db/schema/user.js';
import { hash } from '@node-rs/argon2';
import { superValidate, fail, setError } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { redirect } from '@sveltejs/kit';
import { formSchema } from './schema';

export const load = async () => {
	return {
		form: await superValidate(zod(formSchema))
	};
};

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod(formSchema));

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const userExists = await checkUserExistence(form.data.email);
		if (userExists) {
			return setError(
				form,
				'email',
				'This email is already registered on eddi. If you think this is in error, please contact us.'
			);
		}

		const schoolExists = await checkSchoolExistence(form.data.schoolName);
		if (schoolExists) {
			return setError(
				form,
				'schoolName',
				'This school already exists on eddi. If you think this is in error, please contact us.'
			);
		}

		const passwordHash = await hash(form.data.password);

		const school = await createSchool(form.data.schoolName);

		await createUser({
			email: form.data.email,
			passwordHash,
			schoolId: school.id,
			type: userTypeEnum.schoolAdmin,
			firstName: form.data.firstName,
			lastName: form.data.lastName,
			middleName: form.data.middleName
		});

		redirect(303, '/onboarding/validate-email');
	}
};
