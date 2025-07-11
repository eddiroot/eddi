import type { Task } from '$lib/server/db/schema';
import { getUserTasksSubjectOfferingClassId } from '$lib/server/db/service';

export const load = async ({ locals: { security }, params: { subjectOfferingClassId } }) => {
	const user = security.isAuthenticated().getUser();

	let subjectOfferingClassIdInt;
	try {
		subjectOfferingClassIdInt = parseInt(subjectOfferingClassId, 10);
	} catch {
		return { subject: null };
	}

	const tasks = await getUserTasksSubjectOfferingClassId(user.id, subjectOfferingClassIdInt);

	interface Topic {
		id: number;
		name: string;
	}

	const topicsWithTasks = tasks.reduce(
		(acc, task) => {
			const topicId = task.courseMapItemId;
			let topicEntry = acc.find((item) => item.topic.id === topicId);
			if (!topicEntry) {
				// Create a simple topic object with id and name (topic)
				const topic: Topic = {
					id: task.courseMapItemId,
					name: task.courseMapItemTopic
				};
				topicEntry = { topic: topic, tasks: [] };
				acc.push(topicEntry);
			}
			topicEntry.tasks.push(task.task);
			return acc;
		},
		[] as Array<{ topic: Topic; tasks: Array<Task> }>
	);

	return { user, topicsWithTasks };
};
