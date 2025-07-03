import { getSubjectsOfferingsUserSubjectOfferingsByUserId } from '$lib/server/db/service';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().getUser();

	const subjects = await getSubjectsOfferingsUserSubjectOfferingsByUserId(user.id);

	// Fetch the upcoming assessments for each subject and add them in

	// Fetch the teachers for the next class for each subject

	return {
		user,
		subjects
	};
};
