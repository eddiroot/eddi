import { userTypeEnum, yearLevelEnum } from '$lib/enums';
import {
	checkSchoolExistence,
	checkUserExistence,
	createSchool,
	createUser
} from '$lib/server/db/service';
import { sendEmailVerification } from '$lib/server/email';
import { redirect } from '@sveltejs/kit';
import { fail, setError, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema';

export const load = async () => {
	return {
		form: await superValidate(zod4(formSchema))
	};
};

export const actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, zod4(formSchema));

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
				'This email is already registered on eddi. If you think this is an error, please contact us.'
			);
		}

		const schoolExists = await checkSchoolExistence(form.data.schoolName);
		if (schoolExists) {
			return setError(
				form,
				'schoolName',
				'This school already exists on eddi. If you think this is an error, please contact us.'
			);
		}

		const school = await createSchool(
			form.data.schoolName,
			form.data.countryCode,
			form.data.stateCode
		);

		const { user, verificationCode } = await createUser({
			email: form.data.email,
			password: form.data.password,
			schoolId: school.id,
			type: userTypeEnum.schoolAdmin,
			yearLevel: yearLevelEnum.none,
			firstName: form.data.firstName,
			lastName: form.data.lastName,
			middleName: form.data.middleName
		});

		sendEmailVerification(user.email, verificationCode);

		cookies.set('verify_user_id', user.id, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 10 * 60 // 10 minutes
		});

		redirect(303, '/onboarding/validate-email');
	}
};
