import { getSchoolTimetablesBySchoolId, createSchoolTimetable } from '$lib/server/db/service';
import { createTimetableSchema } from './schema.js';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { PageServerLoad, Actions } from './$types.js';

export const load: PageServerLoad = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();
	const timetables = await getSchoolTimetablesBySchoolId(user.schoolId);

	return {
		timetables,
		createTimetableForm: await superValidate(zod4(createTimetableSchema))
	};
};

export const actions: Actions = {
	createTimetable: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().isSchoolAdmin().getUser();

		const form = await superValidate(request, zod4(createTimetableSchema));

		if (!form.valid) {
			return message(form, 'Please check your inputs and try again.', { status: 400 });
		}

		try {
			await createSchoolTimetable({
				schoolId: user.schoolId,
				name: form.data.name,
				schoolYear: form.data.schoolYear
			});

			return message(form, 'Timetable created successfully!');
		} catch (error) {
			console.error('Error creating timetable:', error);
			return message(form, 'Failed to create timetable. Please try again.', { status: 500 });
		}
	}
};
