// need to change over to ussing subjectOffering class instead

import { getClassById, getTeachersBySubjectOfferingClassId, getResourcesBySubjectOfferingId, getAssessmentsBySubjectOfferingId } from '$lib/server/db/service';

export const load = async ({ locals: { security }, params: { subjectOfferingClassId } }) => {
	security.isAuthenticated();
	const user = security.isAuthenticated().getUser();
	const thisSubjectOffering = await getClassById(Number(subjectOfferingClassId));
	const thisSubjectOfferingTeachers = await getTeachersBySubjectOfferingClassId(
		Number(subjectOfferingClassId)
	);
	const resources = await getResourcesBySubjectOfferingId(Number(subjectOfferingClassId));
	const assessments = await getAssessmentsBySubjectOfferingId(
		Number(subjectOfferingClassId)
	);
	return { user, thisSubjectOffering, thisSubjectOfferingTeachers, resources, assessments };
};
