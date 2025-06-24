import { getLessonById } from '$lib/server/db/service';

export const load = async ({ locals: { security }, params: { lessonId } }) => {
	security.isAuthenticated();

	let lessonIdInt;
	try {
		lessonIdInt = parseInt(lessonId, 10);
	} catch {
		return { subject: null };
	}

	const lesson = await getLessonById(lessonIdInt);

	return { lesson };
};
