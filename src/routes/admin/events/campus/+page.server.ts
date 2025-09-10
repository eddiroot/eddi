import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail } from '@sveltejs/kit';
import { createCampusEventSchema } from '../schemas';
import { createCampusEvent } from '$lib/server/db/service/events';

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

		try {
			await createCampusEvent(
				form.data.campusId as number,
				form.data.name as string,
				new Date(form.data.startTimestamp),
				new Date(form.data.endTimestamp)
			);

			redirect(302, '/admin/events?success=campus-event-created');
		} catch (error) {
			console.error('Error creating campus event:', error);
			return fail(500, {
				form,
				message: 'Failed to create campus event. Please try again.'
			});
		}
	}
};
