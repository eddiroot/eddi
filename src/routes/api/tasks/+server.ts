import { json } from '@sveltejs/kit';
import { updateTaskTitle as updateTaskTitleService } from '$lib/server/db/service';
import { getLearningAreaStandardByCourseMapItemId } from '$lib/server/db/service/task';

// PATCH /api/tasks - Update task title
export async function PATCH({ request }: { request: Request }) {
	try {
		const { taskId, title } = await request.json();

		if (!taskId || !title) {
			return json({ error: 'Task ID and title are required' }, { status: 400 });
		}

		if (typeof taskId !== 'number' || typeof title !== 'string') {
			return json({ error: 'Invalid input types' }, { status: 400 });
		}

		const updatedTask = await updateTaskTitleService(taskId, title);
		return json({ task: updatedTask });
	} catch (error) {
		console.error('Error updating task title:', error);
		return json({ error: 'Failed to update task title' }, { status: 500 });
	}
}

export async function GET({ url, locals: { security } }) {
	security.isAuthenticated();

	const courseMapItemId = url.searchParams.get('courseMapItemId');

	if (!courseMapItemId) {
		return json({ error: 'Course map item ID is required' }, { status: 400 });
	}

	try {
		const courseMapItemIdInt = parseInt(courseMapItemId, 10);

		// Get grouped learning area content for the course map item
		const learningAreaWithContents =
			await getLearningAreaStandardByCourseMapItemId(courseMapItemIdInt);

		// For the frontend, send grouped structure: [{ learningArea, contents: [...] }]
		return json({
			learningAreaWithContents
		});
	} catch (error) {
		console.error('Error loading learning content:', error);
		return json({ error: 'Failed to load learning content' }, { status: 500 });
	}
}
