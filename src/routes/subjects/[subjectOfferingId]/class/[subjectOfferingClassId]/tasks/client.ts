// Client-side API helper functions for Tasks ordering

import type {
	UpdateTaskOrderRequest,
	UpdateTopicOrderRequest,
	ApiSuccessResponse
} from '../../../../../api/tasks/types';

const API_BASE = '/api/tasks';

/**
 * Update task order within topics
 */
export async function updateTaskOrder(
	request: UpdateTaskOrderRequest
): Promise<ApiSuccessResponse> {
	const response = await fetch(`${API_BASE}/order`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ type: 'task', ...request })
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to update task order');
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
