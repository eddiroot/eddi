import { createCampusEvent } from '$lib/server/db/service/events';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createCampusEventSchema } from '../schemas';

export const load = async ({ locals: { security } }) => {
	security.isAuthenticated().isSchoolAdmin();

	const form = await superValidate(zod4(createCampusEventSchema));

	return {
		form
	};
};

export const actions = {
	default: async ({ request, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		const form = await superValidate(request, zod4(createCampusEventSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		await createCampusEvent(
			form.data.campusId as number,
			form.data.name as string,
			new Date(form.data.startTimestamp),
			new Date(form.data.endTimestamp),
			form.data.requiresRSVP
		);

		redirect(302, '/admin/events?success=campus-event-created');
	}
};
