import type { Task, TaskBlock } from '$lib/server/db/schema';

export interface UpdateTaskTitleRequest {
	taskId: number;
	title: string;
}

export interface UpdateTaskTitleResponse {
	task: Task;
}

export interface CreateBlockRequest {
	taskId: number;
	type: string;
	content: unknown;
	index: number;
}

export interface CreateBlockResponse {
	block: TaskBlock;
}

export interface UpdateBlockRequest {
	block: TaskBlock;
	content?: unknown;
}

export interface UpdateBlockResponse {
	block: TaskBlock;
}

export interface GetTaskBlocksResponse {
	blocks: TaskBlock[];
}

export interface UpdateBlockOrderRequest {
	blockOrder: Array<{
		id: number;
		index: number;
	}>;
}

export interface UpdateTaskOrderRequest {
	taskOrder: Array<{
		id: number;
		index: number;
	}>;
}

export interface UpdateTopicOrderRequest {
	topicOrder: Array<{
		id: number;
		index: number;
	}>;
}

export interface ApiErrorResponse {
	error: string;
}

export interface ApiSuccessResponse {
	success: true;
}

// Helper type for API responses
export type ApiResponse<T> = T | ApiErrorResponse;
