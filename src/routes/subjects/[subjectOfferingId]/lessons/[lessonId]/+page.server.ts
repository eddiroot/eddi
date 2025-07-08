import { getLessonById, getLessonBlocksByLessonId } from '$lib/server/db/service';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals: { security }, params: { lessonId, subjectOfferingId } }) => {
	const user = security.isAuthenticated().getUser();

	let lessonIdInt;
	try {
		lessonIdInt = parseInt(lessonId, 10);
	} catch {
		throw redirect(302, '/dashboard');
	}

	const lesson = await getLessonById(lessonIdInt);
	if (!lesson) throw redirect(302, '/dashboard');

	const blocks = await getLessonBlocksByLessonId(lessonIdInt);

	return { lesson, blocks, subjectOfferingId, user };
};
