// need to change over to ussing subjectOffering class instead

import {
	getSubjectBySubjectOfferingClassId,
	getClassById,
	getTeachersBySubjectOfferingClassId,
	getAssessmentsBySubjectOfferingClassId,
	getResourcesBySubjectOfferingClassId,
	getAnnouncementsBySubjectOfferingClassId,
	getLessonsAndHomeworkBySubjectOfferingClassId
} from '$lib/server/db/service';

export const load = async ({ locals: { security }, params: { subjectOfferingClassId } }) => {
	security.isAuthenticated();
	const user = security.isAuthenticated().getUser();
	const thisSubjectOffering = await getSubjectBySubjectOfferingClassId(Number(subjectOfferingClassId));
	const thisSubjectOfferingClass = await getClassById(Number(subjectOfferingClassId));
	const thisSubjectOfferingTeachers = await getTeachersBySubjectOfferingClassId(
		Number(subjectOfferingClassId)
	);
	const assessments = await getAssessmentsBySubjectOfferingClassId(
		Number(subjectOfferingClassId)
	);
	const tasks = await getLessonsAndHomeworkBySubjectOfferingClassId(
		user.id,
		Number(subjectOfferingClassId)
	);
	const resources = await getResourcesBySubjectOfferingClassId(
		Number(subjectOfferingClassId)
	);
	const announcements = await getAnnouncementsBySubjectOfferingClassId(
		Number(subjectOfferingClassId)
	);

	return { user, thisSubjectOffering, thisSubjectOfferingClass, thisSubjectOfferingTeachers, assessments, tasks, resources, announcements };
};
