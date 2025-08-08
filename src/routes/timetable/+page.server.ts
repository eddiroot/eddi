import { getSubjectClassAllocationsByUserIdForWeek } from '$lib/server/db/service';

export const load = async ({ locals: { security }, url }) => {
	const user = security.isAuthenticated().getUser();

	// Get week parameter from URL, default to current week
	const weekParam = url.searchParams.get('week');
	let weekStartDate: Date;

	if (weekParam) {
		weekStartDate = new Date(weekParam);
	} else {
		// Default to current week
		weekStartDate = new Date();
	}

	const classAllocation = await getSubjectClassAllocationsByUserIdForWeek(user.id, weekStartDate);

	if (!classAllocation || classAllocation.length === 0) {
		return {
			user,
			classAllocation: [],
			currentWeekStart: weekStartDate.toISOString().split('T')[0]
		};
	}

	return {
		user,
		classAllocation: classAllocation,
		currentWeekStart: weekStartDate.toISOString().split('T')[0]
	};
};
