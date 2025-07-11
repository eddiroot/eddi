// need to change over to ussing subjectOffering class instead

import {
	getClassesForUserInSubjectOffering,
	getSubjectBySubjectOfferingId,
	getTeachersForSubjectOfferingId,
	getTeacherBySubjectOfferingIdForUserInClass
} from '$lib/server/db/service';

export const load = async ({ locals: { security }, params: { subjectOfferingId } }) => {
	security.isAuthenticated();
	// const userClasses = await getSubjectClassTimesAndLocationsByUserIdForToday(user.id);
	const user = security.isAuthenticated().getUser();
	const userClasses = await getClassesForUserInSubjectOffering(user.id, Number(subjectOfferingId));
	const subject = await getSubjectBySubjectOfferingId(Number(subjectOfferingId));
	const allTeachers = await getTeachersForSubjectOfferingId(Number(subjectOfferingId));
	const mainTeacher = await getTeacherBySubjectOfferingIdForUserInClass(
		user.id,
		Number(subjectOfferingId)
	);
	return { user, userClasses, subject, mainTeacher: mainTeacher, teachers: allTeachers };
};
