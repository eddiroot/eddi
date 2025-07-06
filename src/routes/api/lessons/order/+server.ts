import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import type { UpdateLessonOrderRequest, UpdateTopicOrderRequest } from '../types';
import { updateLessonOrder, updateTopicOrder } from '$lib/server/db/service';

export const PATCH: RequestHandler = async ({ request, locals: { security } }) => {
	security.isAuthenticated();

	try {
		const body = await request.json();
		const { type } = body;

		if (type === 'lesson') {
			const { lessonOrder } = body as UpdateLessonOrderRequest;
			await updateLessonOrder(lessonOrder);
		} else if (type === 'topic') {
			const { topicOrder } = body as UpdateTopicOrderRequest;
			await updateTopicOrder(topicOrder);
		} else {
			return json({ error: 'Invalid order type' }, { status: 400 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error updating order:', error);
		return json({ error: 'Failed to update order' }, { status: 500 });
	}
};
