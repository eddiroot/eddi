import { userTypeEnum } from '$lib/enums.js';
import {
	getTimetableStudentGroupsByTimetableId,
	getUsersBySchoolIdAndType,
	createTimetableStudentGroup
} from '$lib/server/db/service';
import { createGroupSchema } from './schema.js';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types.js';

export const load = async ({ locals: { security }, params }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();
	const students = await getUsersBySchoolIdAndType(user.schoolId, userTypeEnum.student);
	const groups = await getTimetableStudentGroupsByTimetableId(parseInt(params.timetableId));

	return {
		students,
		groups,
		createGroupForm: await superValidate(zod4(createGroupSchema))
	};
};

export const actions: Actions = {
	createGroup: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		const timetableId = parseInt(params.timetableId);
		if (isNaN(timetableId)) {
			return fail(400, { error: 'Invalid timetable ID' });
		}

		const form = await superValidate(request, zod4(createGroupSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await createTimetableStudentGroup(timetableId, form.data.yearLevel, form.data.name);

			return message(form, 'Group created successfully!');
		} catch (error) {
			console.error('Error creating group:', error);
			return message(form, 'Failed to create group. Please try again.', { status: 500 });
		}
	}
};
