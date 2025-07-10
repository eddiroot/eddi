import { json } from '@sveltejs/kit';
import { updateLessonTitle as updateLessonTitleService } from '$lib/server/db/service';

// PATCH /api/lessons - Update lesson title
export async function PATCH({ request }: { request: Request }) {
	try {
		const { lessonId, title } = await request.json();

		if (!lessonId || !title) {
			return json({ error: 'Lesson ID and title are required' }, { status: 400 });
		}

		if (typeof lessonId !== 'number' || typeof title !== 'string') {
			return json({ error: 'Invalid input types' }, { status: 400 });
		}

		const updatedLesson = await updateLessonTitleService(lessonId, title);
		return json({ lesson: updatedLesson });
	} catch (error) {
		console.error('Error updating lesson title:', error);
		return json({ error: 'Failed to update lesson title' }, { status: 500 });
	}
}
