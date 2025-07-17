// need to change over to ussing subjectOffering class instead

import { getClassById, getTeachersBySubjectOfferingClassId, getResourcesBySubjectOfferingClassId, getAssessmentsBySubjectOfferingClassId } from '$lib/server/db/service';

export const load = async ({ locals: { security }, params: { subjectOfferingClassId } }) => {
	security.isAuthenticated();
	const user = security.isAuthenticated().getUser();
	const thisSubjectOffering = await getClassById(Number(subjectOfferingClassId));
	const thisSubjectOfferingTeachers = await getTeachersBySubjectOfferingClassId(
		Number(subjectOfferingClassId)
	);
	const resources = await getResourcesBySubjectOfferingClassId(Number(subjectOfferingClassId));
	const assessments = await getAssessmentsBySubjectOfferingClassId(
		Number(subjectOfferingClassId)
	);
	return { user, thisSubjectOffering, thisSubjectOfferingTeachers, resources, assessments };
};
