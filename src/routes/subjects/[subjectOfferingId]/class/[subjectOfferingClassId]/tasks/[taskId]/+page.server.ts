import {
	getTaskById,
	getTaskBlocksByTaskId,
	getSubjectOfferingClassTaskByTaskId,
	updateSubjectOfferingClassTaskStatus
} from '$lib/server/db/service';
import { redirect, fail } from '@sveltejs/kit';
import { taskStatusEnum } from '$lib/enums';

export const load = async ({
	locals: { security },
	params: { taskId, subjectOfferingId, subjectOfferingClassId }
}) => {
	const user = security.isAuthenticated().getUser();

	let taskIdInt;
	try {
		taskIdInt = parseInt(taskId, 10);
	} catch {
		throw redirect(302, '/dashboard');
	}

	const classIdInt = parseInt(subjectOfferingClassId, 10);
	if (isNaN(classIdInt)) {
		throw redirect(302, '/dashboard');
	}

	const task = await getTaskById(taskIdInt);
	if (!task) throw redirect(302, '/dashboard');

	// Get the class task to access status
	const classTask = await getSubjectOfferingClassTaskByTaskId(taskIdInt, classIdInt);
	if (!classTask) throw redirect(302, '/dashboard');

	const blocks = await getTaskBlocksByTaskId(taskIdInt);

	return { task, classTask, blocks, subjectOfferingId, subjectOfferingClassId, user };
};

export const actions = {
	publish: async ({ locals: { security }, params: { taskId, subjectOfferingClassId } }) => {
		security.isAuthenticated();

		const taskIdInt = parseInt(taskId, 10);
		const classIdInt = parseInt(subjectOfferingClassId, 10);

		if (isNaN(taskIdInt) || isNaN(classIdInt)) {
			return fail(400, { message: 'Invalid task or class ID' });
		}

		try {
			await updateSubjectOfferingClassTaskStatus(taskIdInt, classIdInt, taskStatusEnum.published);

			return { success: true };
		} catch (error) {
			console.error('Error publishing task:', error);
			return fail(500, { message: 'Failed to publish task' });
		}
	},

	setToDraft: async ({ locals: { security }, params: { taskId, subjectOfferingClassId } }) => {
		security.isAuthenticated();

		const taskIdInt = parseInt(taskId, 10);
		const classIdInt = parseInt(subjectOfferingClassId, 10);

		if (isNaN(taskIdInt) || isNaN(classIdInt)) {
			return fail(400, { message: 'Invalid task or class ID' });
		}

		try {
			await updateSubjectOfferingClassTaskStatus(taskIdInt, classIdInt, taskStatusEnum.draft);

			return { success: true };
		} catch (error) {
			console.error('Error setting task to draft:', error);
			return fail(500, { message: 'Failed to set task to draft' });
		}
	}
};
