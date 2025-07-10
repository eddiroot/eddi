import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import type { UpdateTaskOrderRequest } from '../types';
import { updateTaskOrder } from '$lib/server/db/service';

export const PATCH: RequestHandler = async ({ request, locals: { security } }) => {
	security.isAuthenticated();

	try {
		const body = await request.json();
		const { type } = body;

		if (type === 'task') {
			const { taskOrder } = body as UpdateTaskOrderRequest;
			await updateTaskOrder(taskOrder);
		} else {
			return json({ error: 'Invalid order type' }, { status: 400 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error updating order:', error);
		return json({ error: 'Failed to update order' }, { status: 500 });
	}
};
