import {
	getClassesForUserInSubjectOffering,
	getSubjectById,
	getTeachersForUserInSubjectOffering
} from '$lib/server/db/service';

export const load = async ({ locals: { security }, params: { subjectOfferingId } }) => {
	security.isAuthenticated();
	// const userClasses = await getSubjectClassTimesAndLocationsByUserIdForToday(user.id);
	const user = security.isAuthenticated().getUser();
	const userClasses = await getClassesForUserInSubjectOffering(user.id, Number(subjectOfferingId));
	const subject = await getSubjectById(Number(subjectOfferingId));
	const teachers = await getTeachersForUserInSubjectOffering(user.id, Number(subjectOfferingId));
	return { user, userClasses, subject, teachers };
};
