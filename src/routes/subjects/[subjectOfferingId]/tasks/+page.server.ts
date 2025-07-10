import type { Task, TaskTopic } from '$lib/server/db/schema.js';
import { getUserTasksBySubjectOfferingId } from '$lib/server/db/service';

export const load = async ({ locals: { security }, params: { subjectOfferingId } }) => {
	const user = security.isAuthenticated().getUser();

	let subjectOfferingIdInt;
	try {
		subjectOfferingIdInt = parseInt(subjectOfferingId, 10);
	} catch {
		return { subject: null };
	}

	const tasks = await getUserTasksBySubjectOfferingId(user.id, subjectOfferingIdInt);

	const topicsWithTasks = tasks.reduce(
		(acc, task) => {
			const topicId = task.taskTopic.id;
			let topicEntry = acc.find((item) => item.topic.id === topicId);
			if (!topicEntry) {
				topicEntry = { topic: task.taskTopic, tasks: [] };
				acc.push(topicEntry);
			}
			topicEntry.tasks.push(task.task);
			return acc;
		},
		[] as Array<{ topic: TaskTopic; tasks: Array<Task> }>
	);

	return { user, topicsWithTasks };
};
