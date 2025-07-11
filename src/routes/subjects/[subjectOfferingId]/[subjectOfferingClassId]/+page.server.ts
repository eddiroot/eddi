// need to change over to ussing subjectOffering class instead

import { getClassById, getTeachersBySubjectOfferingClassId } from '$lib/server/db/service';

export const load = async ({ locals: { security }, params: { subjectOfferingClassId } }) => {
	security.isAuthenticated();
	const user = security.isAuthenticated().getUser();
	const thisClass = await getClassById(Number(subjectOfferingClassId));
	const thisClassTeachers = await getTeachersBySubjectOfferingClassId(
		Number(subjectOfferingClassId)
	);

	return { user, thisClass, thisClassTeachers };
};
