import {
	getSubjectsOfferingsUserSubjectOfferingsByUserId,
	getTeacherBySubjectOfferingIdForUserInClass
} from '$lib/server/db/service';

// import * as table from '$lib/server/db/schema';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().getUser();

	const subjectInfo = await getSubjectsOfferingsUserSubjectOfferingsByUserId(user.id);

	const info = await Promise.all(
		subjectInfo.map(async (subject) => ({
			subject,
			teacher: await getTeacherBySubjectOfferingIdForUserInClass(
				user.id,
				subject.subjectOffering.id
			)
		}))
	);

	return {
		user,
		info
	};
};
