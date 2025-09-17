import {
	createSubjectOfferingClassEvent,
	getSubjectOfferingClassesBySchoolId
} from '$lib/server/db/service';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createSubjectOfferingClassEventSchema } from '../schemas';

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

		await createSubjectOfferingClassEvent(
			form.data.subjectOfferingClassId as number,
			form.data.name as string,
			new Date(form.data.startTimestamp),
			new Date(form.data.endTimestamp),
			form.data.requiresRSVP
		);

		redirect(302, '/admin/events?success=class-event-created');
	}
};
