import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail } from '@sveltejs/kit';
import { createSubjectOfferingClassEventSchema } from '../schemas';
import {
	createSubjectOfferingClassEvent,
	getSubjectOfferingClassesBySchoolId
} from '$lib/server/db/service';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();

	const [form, classes] = await Promise.all([
		superValidate(zod4(createSubjectOfferingClassEventSchema)),
		getSubjectOfferingClassesBySchoolId(user.schoolId)
	]);

	return {
		form,
		classes
	};
};

export const actions = {
	default: async ({ request, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		const form = await superValidate(request, zod4(createSubjectOfferingClassEventSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await createSubjectOfferingClassEvent(
				form.data.subjectOfferingClassId as number,
				form.data.name as string,
				new Date(form.data.startTimestamp),
				new Date(form.data.endTimestamp)
			);

			redirect(302, '/admin/events?success=class-event-created');
		} catch (error) {
			console.error('Error creating class event:', error);
			return fail(500, {
				form,
				message: 'Failed to create class event. Please try again.'
			});
		}
	}
};
