import { json } from '@sveltejs/kit';
import { updateTaskTitle as updateTaskTitleService } from '$lib/server/db/service';

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
