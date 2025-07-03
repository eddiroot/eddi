import { getSubjectClassAllocationByUserId } from '$lib/server/db/service';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().getUser();

	const classAllocation = await getSubjectClassAllocationByUserId(user.id);

	if (!classAllocation || classAllocation.length === 0) {
		return { user, classAllocation: [] };
	}

	return {
		user,
		classAllocation: classAllocation
	};
};
