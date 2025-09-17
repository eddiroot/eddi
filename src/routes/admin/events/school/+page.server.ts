import { createSchoolEvent } from '$lib/server/db/service/events';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createSchoolEventSchema } from '../schemas';

export const load = async ({ locals: { security } }) => {
	security.isAuthenticated().isSchoolAdmin();

	const form = await superValidate(zod4(createSchoolEventSchema));

	return {
		form
	};
};

export const actions = {
	default: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().isSchoolAdmin().getUser();

		const form = await superValidate(request, zod4(createSchoolEventSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		await createSchoolEvent(
			user.schoolId,
			form.data.name,
			new Date(form.data.startTimestamp),
			new Date(form.data.endTimestamp),
			form.data.requiresRSVP
		);

		redirect(302, '/admin/events?success=school-event-created');
	}
};
