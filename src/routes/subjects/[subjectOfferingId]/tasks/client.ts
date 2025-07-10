// Client-side API helper functions for Lessons ordering

import type {
	UpdateLessonOrderRequest,
	UpdateTopicOrderRequest,
	ApiSuccessResponse
} from '../../../api/tasks/types';

const API_BASE = '/api/lessons';

/**
 * Update lesson order within topics
 */
export async function updateLessonOrder(
	request: UpdateLessonOrderRequest
): Promise<ApiSuccessResponse> {
	const response = await fetch(`${API_BASE}/order`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ type: 'lesson', ...request })
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to update lesson order');
	}

	return data;
}

/**
 * Update topic order
 */
export async function updateTopicOrder(
	request: UpdateTopicOrderRequest
): Promise<ApiSuccessResponse> {
	const response = await fetch(`${API_BASE}/order`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ type: 'topic', ...request })
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to update topic order');
	}

	return data;
}
