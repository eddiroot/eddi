import { yearLevelEnum } from '$lib/enums';
import {
	addStudentToTimetableGroup,
	assignStudentsToGroupsRandomly,
	createTimetableStudentGroup,
	deleteTimetableStudentGroup,
	getStudentsByGroupId,
	getStudentsForTimetable,
	getSubjectsByYearLevel,
	getTimetableStudentGroupsByTimetableId,
	removeStudentFromTimetableGroup
} from '$lib/server/db/service';
import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions } from './$types.js';
import { createGroupSchema, randomlyAssignSchema } from './schema.js';

export const load = async ({ locals: { security }, params }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();
	const timetableId = parseInt(params.timetableId);

	// Get all students for the school
	const students = await getStudentsForTimetable(timetableId, user.schoolId);
	const groups = await getTimetableStudentGroupsByTimetableId(timetableId);
	const defaultYearLevel = students.length > 0 ? students[0].yearLevel : '';

	// Get students for each group
	const studentsByGroupId: Record<number, typeof students> = {};
	for (const group of groups) {
		const groupStudents = await getStudentsByGroupId(group.id);
		studentsByGroupId[group.id] = groupStudents;
	}

	return {
		defaultYearLevel,
		students,
		groups,
		studentsByGroupId,
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
	},

	autoCreateGroups: async ({ request, params, locals: { security } }) => {
		const user = security.isAuthenticated().isSchoolAdmin().getUser();

		const timetableId = parseInt(params.timetableId);
		if (isNaN(timetableId)) {
			return fail(400, { error: 'Invalid timetable ID' });
		}

		const formData = await request.formData();
		const yearLevel = formData.get('yearLevel') as string;

		if (!yearLevel) {
			return fail(400, { error: 'Year level is required' });
		}

		try {
			const subjects = await getSubjectsByYearLevel(user.schoolId, yearLevel as yearLevelEnum);

			let createdCount = 0;
			for (const subject of subjects) {
				const groupName = `${subject.name}`;
				await createTimetableStudentGroup(timetableId, yearLevel as yearLevelEnum, groupName);
				createdCount++;
			}

			return { success: true, message: `Successfully created ${createdCount} groups!` };
		} catch (error) {
			console.error('Error auto-creating groups:', error);
			return fail(500, { error: 'Failed to auto-create groups. Please try again.' });
		}
	},

	addStudent: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		const timetableId = parseInt(params.timetableId);
		if (isNaN(timetableId)) {
			return fail(400, { error: 'Invalid timetable ID' });
		}

		const formData = await request.formData();
		const groupId = formData.get('groupId');
		const userId = formData.get('userId');

		if (!groupId || !userId) {
			return fail(400, { error: 'Group ID and User ID are required' });
		}

		try {
			await addStudentToTimetableGroup(parseInt(groupId as string), userId as string);
			return { success: true };
		} catch (error) {
			console.error('Error adding student to group:', error);
			return fail(500, { error: 'Failed to add student to group. Please try again.' });
		}
	},

	removeStudent: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		const timetableId = parseInt(params.timetableId);
		if (isNaN(timetableId)) {
			return fail(400, { error: 'Invalid timetable ID' });
		}

		const formData = await request.formData();
		const groupId = formData.get('groupId');
		const userId = formData.get('userId');

		if (!groupId || !userId) {
			return fail(400, { error: 'Group ID and User ID are required' });
		}

		try {
			await removeStudentFromTimetableGroup(parseInt(groupId as string), userId as string);
			return { success: true };
		} catch (error) {
			console.error('Error removing student from group:', error);
			return fail(500, { error: 'Failed to remove student from group. Please try again.' });
		}
	},

	deleteGroup: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		const timetableId = parseInt(params.timetableId);
		if (isNaN(timetableId)) {
			return fail(400, { error: 'Invalid timetable ID' });
		}

		const formData = await request.formData();
		const groupId = formData.get('groupId');

		if (!groupId) {
			return fail(400, { error: 'Group ID is required' });
		}

		try {
			await deleteTimetableStudentGroup(parseInt(groupId as string));
			return { success: true };
		} catch (error) {
			console.error('Error deleting group:', error);
			return fail(500, { error: 'Failed to delete group. Please try again.' });
		}
	}
};
