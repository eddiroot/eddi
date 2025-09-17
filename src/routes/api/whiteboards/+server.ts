import { json } from '@sveltejs/kit';
import { createWhiteboard } from '$lib/server/db/service';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { taskId, title } = await request.json();

		if (!taskId) {
			return json({ error: 'Task ID is required' }, { status: 400 });
		}

		const newWhiteboard = await createWhiteboard(parseInt(taskId), title);

		return json({
			whiteboardId: newWhiteboard.id,
			title: newWhiteboard.title
		});
	} catch (error) {
		console.error('Error creating whiteboard:', error);
		return json({ error: 'Failed to create whiteboard' }, { status: 500 });
	}
};
