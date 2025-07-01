// Client-side API helper functions for Lessons API

import type {
	UpdateLessonTitleRequest,
	UpdateLessonTitleResponse,
	CreateBlockRequest,
	CreateBlockResponse,
	UpdateBlockRequest,
	UpdateBlockResponse,
	GetLessonBlocksResponse,
	UpdateBlockOrderRequest,
	ApiSuccessResponse
} from '../../../../api/lessons/types';

const API_BASE = '/api/lessons';

/**
 * Update a lesson's title
 */
export async function updateLessonTitle(
	request: UpdateLessonTitleRequest
): Promise<UpdateLessonTitleResponse> {
	const response = await fetch(API_BASE, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(request)
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to update lesson title');
	}

	return data;
}

/**
 * Get blocks for a lesson
 */
export async function getLessonBlocks(lessonId: number): Promise<GetLessonBlocksResponse> {
	const response = await fetch(`${API_BASE}?lessonId=${lessonId}`);
	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to fetch lesson blocks');
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
