import { getSubjectClassAllocationByUserId } from '$lib/server/db/service';

export const load = async ({ locals: { security, user } }) => {
	security.isAuthenticated();

	if (!user) {
		return { user: null, subjects: [] };
	}

	const classTimesAndLocations = await getSubjectClassAllocationByUserId(user.id);

	if (!classTimesAndLocations || classTimesAndLocations.length === 0) {
		return { user, classTimes: [] };
	}

	return {
		user,
		classTimes: classTimesAndLocations
	};
};
