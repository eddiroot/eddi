// Client-side API helper functions for Tasks API

import type {
	UpdateTaskTitleRequest,
	UpdateTaskTitleResponse,
	CreateBlockRequest,
	CreateBlockResponse,
	UpdateBlockRequest,
	UpdateBlockResponse,
	GetTaskBlocksResponse,
	UpdateBlockOrderRequest,
	ApiSuccessResponse
} from '../../../../../../api/tasks/types';

const API_BASE = '/api/tasks';

/**
 * Update a task's title
 */
export async function updateTaskTitle(
	request: UpdateTaskTitleRequest
): Promise<UpdateTaskTitleResponse> {
	const response = await fetch(API_BASE, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(request)
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to update task title');
	}

	return data;
}

/**
 * Get blocks for a task
 */
export async function getTaskBlocks(taskId: number): Promise<GetTaskBlocksResponse> {
	const response = await fetch(`${API_BASE}?taskId=${taskId}`);
	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to fetch task blocks');
	}

	return data;
}

/**
 * Create a new block
 */
export async function createBlock(request: CreateBlockRequest): Promise<CreateBlockResponse> {
	const response = await fetch(`${API_BASE}/blocks`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(request)
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to create block');
	}

	return data;
}

/**
 * Update an existing block
 */
export async function updateBlock(request: UpdateBlockRequest): Promise<UpdateBlockResponse> {
	const response = await fetch(`${API_BASE}/blocks`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(request)
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to update block');
	}

	return data;
}

/**
 * Delete a block
 */
export async function deleteBlock(blockId: number): Promise<ApiSuccessResponse> {
	const response = await fetch(`${API_BASE}/blocks?blockId=${blockId}`, {
		method: 'DELETE'
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to delete block');
	}

	return data;
}

/**
 * Update the order of blocks
 */
export async function updateBlockOrder(
	request: UpdateBlockOrderRequest
): Promise<ApiSuccessResponse> {
	const response = await fetch(`${API_BASE}/blocks/order`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(request)
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to update block order');
	}

	return data;
}
