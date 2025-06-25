import { getLessonById, getLessonSectionsByLessonId } from '$lib/server/db/service';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals: { security }, params: { lessonId } }) => {
	security.isAuthenticated();

	let lessonIdInt;
	try {
		lessonIdInt = parseInt(lessonId, 10);
	} catch {
		throw redirect(302, '/dashboard');
	}

	const lesson = await getLessonById(lessonIdInt);

	if (!lesson) {
		throw redirect(302, '/dashboard');
	}

	const sections = await getLessonSectionsByLessonId(lessonIdInt);

	throw redirect(302, `${lessonId}/sections/${sections[0].id}`);
};
