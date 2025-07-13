import { getTaskById, getTaskBlocksByTaskId } from '$lib/server/db/service';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals: { security }, params: { taskId, subjectOfferingId } }) => {
	const user = security.isAuthenticated().getUser();

	let taskIdInt;
	try {
		taskIdInt = parseInt(taskId, 10);
	} catch {
		throw redirect(302, '/dashboard');
	}

	const task = await getTaskById(taskIdInt);
	if (!task) throw redirect(302, '/dashboard');

	const blocks = await getTaskBlocksByTaskId(taskIdInt);

	return { task, blocks, subjectOfferingId, user };
};
