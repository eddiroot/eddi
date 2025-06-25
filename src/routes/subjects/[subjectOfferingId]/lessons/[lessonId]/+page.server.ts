import {
	createLessonSectionBlock,
	getLessonBlocksByLessonSectionId,
	getLessonWithSectionsById
} from '$lib/server/db/service';
import { fail } from '@sveltejs/kit';

export const load = async ({ locals: { security }, params: { lessonId } }) => {
	security.isAuthenticated();

	let lessonIdInt;
	try {
		lessonIdInt = parseInt(lessonId, 10);
	} catch {
		return { subject: null };
	}

	const lesson = await getLessonWithSectionsById(lessonIdInt);
	const lessonBlocks = await getLessonBlocksByLessonSectionId(lesson[0].lessonSection.id);

	return { lesson, lessonBlocks };
};

export const actions = {
	createBlock: async (event) => {
		const formData = await event.request.formData();

		const lessonSectionId = formData.get('lessonSectionId');
		const type = formData.get('type');
		const content = formData.get('content');

		if (!lessonSectionId || !type || !content) {
			return fail(400, { message: 'All fields are required' });
		}

		if (
			typeof lessonSectionId !== 'string' ||
			typeof type !== 'string' ||
			typeof content !== 'string'
		) {
			return fail(400, { message: 'Invalid input types' });
		}

		let lessonSectionIdInt;
		try {
			lessonSectionIdInt = parseInt(lessonSectionId, 10);
		} catch {
			return fail(400, { message: 'Invalid lesson section ID' });
		}

		await createLessonSectionBlock(lessonSectionIdInt, type, content);
	}
};
