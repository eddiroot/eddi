import {
	getTimetableStudentGroupsByTimetableId,
	createTimetableStudentGroup,
	getStudentsWithGroupsByTimetableId,
	assignStudentsToGroupsRandomly
} from '$lib/server/db/service';
import { createGroupSchema, randomlyAssignSchema } from './schema.js';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types.js';

export const load = async ({ locals: { security }, params }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();
	const timetableId = parseInt(params.timetableId);
	const students = await getStudentsWithGroupsByTimetableId(timetableId, user.schoolId);
	const groups = await getTimetableStudentGroupsByTimetableId(timetableId);
	const defaultYearLevel = students.length > 0 ? students[0].yearLevel : '';

	return {
		defaultYearLevel,
		students,
		groups,
		createGroupForm: await superValidate(zod4(createGroupSchema)),
		randomlyAssignForm: await superValidate(zod4(randomlyAssignSchema))
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
	},

	randomlyAssign: async ({ request, params, locals: { security } }) => {
		const user = security.isAuthenticated().isSchoolAdmin().getUser();

		const timetableId = parseInt(params.timetableId);
		if (isNaN(timetableId)) {
			return fail(400, { error: 'Invalid timetable ID' });
		}

		const form = await superValidate(request, zod4(randomlyAssignSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const assignedCount = await assignStudentsToGroupsRandomly(
				timetableId,
				form.data.yearLevel,
				user.schoolId
			);

			return message(form, `Successfully assigned ${assignedCount} students to groups randomly!`);
		} catch (error) {
			console.error('Error randomly assigning students:', error);
			return message(form, 'Failed to assign students. Please try again.', { status: 500 });
		}
	}
};
