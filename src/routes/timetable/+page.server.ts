import { getSubjectClassAllocationByUserId } from '$lib/server/db/service';

export const load = async ({ locals: { security, user } }) => {
	security.isAuthenticated();

	if (!user) {
		return { user: null, subjects: [] };
	}

	const classAllocation = await getSubjectClassAllocationByUserId(user.id);

	if (!classAllocation || classAllocation.length === 0) {
		return { user, classAllocation: [] };
	}

	return {
		user,
		classAllocation: classAllocation
	};
};
