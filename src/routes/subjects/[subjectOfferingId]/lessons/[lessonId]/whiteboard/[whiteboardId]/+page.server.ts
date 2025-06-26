import { getWhiteboardWithLesson } from '$lib/server/db/service.js';
import { error } from '@sveltejs/kit';

export const load = async ({ params }: { params: { whiteboardId: string; lessonId: string } }) => {
    const whiteboardId = parseInt(params.whiteboardId);
    const lessonId = parseInt(params.lessonId);

    if (!whiteboardId || !lessonId) {
        throw error(404, 'Whiteboard or lesson not found');
    }

    // Get whiteboard and verify it belongs to the lesson
    const whiteboardData = await getWhiteboardWithLesson(whiteboardId, lessonId);

    if (!whiteboardData) {
        throw error(404, 'Whiteboard not found or does not belong to this lesson');
    }

    return whiteboardData;
};
