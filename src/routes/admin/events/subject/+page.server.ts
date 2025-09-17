import { createSubjectOfferingEvent, getSubjectOfferingsBySchoolId } from '$lib/server/db/service';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createSubjectOfferingEventSchema } from '../schemas';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();

	const [form, subjectOfferings] = await Promise.all([
		superValidate(zod4(createSubjectOfferingEventSchema)),
		getSubjectOfferingsBySchoolId(user.schoolId)
	]);

	return {
		form,
		subjectOfferings
	};
};

export const actions = {
	default: async ({ request, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		const form = await superValidate(request, zod4(createSubjectOfferingEventSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		await createSubjectOfferingEvent(
			form.data.subjectOfferingId as number,
			form.data.name as string,
			new Date(form.data.startTimestamp),
			new Date(form.data.endTimestamp),
			form.data.requiresRSVP
		);

		redirect(302, '/admin/events?success=subject-event-created');
	}
};
