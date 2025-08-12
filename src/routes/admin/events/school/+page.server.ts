import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail } from '@sveltejs/kit';
import { createSchoolEventSchema } from '../schemas';
import { createSchoolEvent } from '$lib/server/db/service/events';

export const load = async ({ locals: { security } }) => {
	security.isAuthenticated().isSchoolAdmin();

	const form = await superValidate(zod4(createSchoolEventSchema));

	return {
		form
	};
};

export const actions = {
	default: async ({ request, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		const form = await superValidate(request, zod4(createSchoolEventSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await createSchoolEvent(
				form.data.schoolId as number,
				form.data.name as string,
				form.data.startTimestamp as Date,
				form.data.endTimestamp as Date
			);

			redirect(302, '/admin/events?success=school-event-created');
		} catch (error) {
			console.error('Error creating school event:', error);
			return fail(500, {
				form,
				message: 'Failed to create school event. Please try again.'
			});
		}
	}
};
