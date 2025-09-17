import {
	getTaskById,
	getTaskBlocksByTaskId,
	getSubjectOfferingClassTaskByTaskId,
	updateSubjectOfferingClassTaskStatus,
	getClassTaskResponsesWithStudents,
	getClassTaskBlockResponsesByClassTaskId,
	getClassTaskBlockResponsesByAuthorId
} from '$lib/server/db/service';
import { redirect, fail } from '@sveltejs/kit';
import { taskStatusEnum, userTypeEnum } from '$lib/enums';

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

	const classTask = await getSubjectOfferingClassTaskByTaskId(taskIdInt, classIdInt);
	if (!classTask) throw redirect(302, '/dashboard');

	const blocks = await getTaskBlocksByTaskId(taskIdInt);

	if (user.type === userTypeEnum.student) {
		const blockResponses = await getClassTaskBlockResponsesByAuthorId(classTask.id, user.id);
		return {
			task,
			classTask,
			blocks,
			blockResponses,
			subjectOfferingId,
			subjectOfferingClassId,
			user
		};
	}

	const responses = await getClassTaskResponsesWithStudents(classTask.id);
	const groupedBlockResponses = await getClassTaskBlockResponsesByClassTaskId(classTask.id);

	return {
		task,
		classTask,
		blocks,
		responses,
		groupedBlockResponses,
		subjectOfferingId,
		subjectOfferingClassId,
		user
	};
};

export const actions = {
	status: async ({ request, locals: { security }, params: { taskId, subjectOfferingClassId } }) => {
		const user = security.isAuthenticated().getUser();

		if (user.type === userTypeEnum.student) {
			return fail(403, { message: 'Students are not allowed to change task status' });
		}

		const taskIdInt = parseInt(taskId, 10);
		const classIdInt = parseInt(subjectOfferingClassId, 10);

		if (isNaN(taskIdInt) || isNaN(classIdInt)) {
			return fail(400, { message: 'Invalid task or class ID' });
		}

		const data = await request.formData();
		let newStatus;
		try {
			newStatus = data.get('status') as taskStatusEnum;
		} catch (error) {
			console.error('Error parsing status:', error);
			return fail(400, { message: 'Invalid task status' });
		}

		if (!newStatus || !Object.values(taskStatusEnum).includes(newStatus)) {
			return fail(400, { message: 'Invalid task status' });
		}

		try {
			await updateSubjectOfferingClassTaskStatus(taskIdInt, classIdInt, newStatus);
			return { success: true };
		} catch (error) {
			console.error('Error changing task status:', error);
			return fail(500, { message: 'Failed to change task status' });
		}
	}
};
