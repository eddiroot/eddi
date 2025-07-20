import { json } from '@sveltejs/kit';
import { createOrUpdateTaskBlockResponse } from '$lib/server/db/service';

export async function POST({ request, locals: { security } }) {
	try {
		const user = security.isAuthenticated().getUser();
		const { taskBlockId, classTaskId, response } = await request.json();

		if (!taskBlockId || !classTaskId || response === undefined) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		const savedResponse = await createOrUpdateTaskBlockResponse(
			taskBlockId,
			user.id,
			classTaskId,
			response
		);

		return json({ success: true, response: savedResponse });
	} catch (error) {
		console.error('Error saving task block response:', error);
		return json({ error: 'Failed to save response' }, { status: 500 });
	}
}
