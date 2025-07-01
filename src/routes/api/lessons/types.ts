import type { Lesson, LessonBlock } from '$lib/server/db/schema';

export interface UpdateLessonTitleRequest {
	lessonId: number;
	title: string;
}

export interface UpdateLessonTitleResponse {
	lesson: Lesson;
}

export interface CreateBlockRequest {
	lessonId: number;
	type: string;
	content: unknown;
	index: number;
}

export interface CreateBlockResponse {
	block: LessonBlock;
}

export interface UpdateBlockRequest {
	block: LessonBlock;
	content?: unknown;
}

export interface UpdateBlockResponse {
	block: LessonBlock;
}

export interface GetLessonBlocksResponse {
	blocks: LessonBlock[];
}

export interface UpdateBlockOrderRequest {
	blockOrder: Array<{
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
