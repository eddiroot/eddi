import { getUserLessonsBySubjectOfferingId } from '$lib/server/db/service';

export const load = async ({ locals: { security, user }, params: { subjectOfferingId } }) => {
	security.isAuthenticated();

	let subjectOfferingIdInt;
	try {
		subjectOfferingIdInt = parseInt(subjectOfferingId, 10);
	} catch {
		return { subject: null };
	}

	// User is guaranteed to exist due to security.isAuthenticated()
	const lessons = await getUserLessonsBySubjectOfferingId(user!.id, subjectOfferingIdInt);

	return { user, lessons };
};
