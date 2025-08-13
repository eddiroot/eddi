import {
	getSubjectClassAllocationsByUserIdForWeek,
	getSchoolEventsForWeekBySchoolId,
	getCampusEventsForWeekByUserId,
	getSubjectOfferingEventsForWeekByUserId,
	getSubjectOfferingClassEventsForWeekByUserId
} from '$lib/server/db/service';

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

	// Get class allocations and events for the week
	const [
		classAllocation,
		schoolEvents,
		campusEvents,
		subjectOfferingEvents,
		subjectOfferingClassEvents
	] = await Promise.all([
		getSubjectClassAllocationsByUserIdForWeek(user.id, weekStartDate),
		getSchoolEventsForWeekBySchoolId(user.schoolId, weekStartDate),
		getCampusEventsForWeekByUserId(user.id, weekStartDate),
		getSubjectOfferingEventsForWeekByUserId(user.id, weekStartDate),
		getSubjectOfferingClassEventsForWeekByUserId(user.id, weekStartDate)
	]);

	return {
		user,
		classAllocation,
		schoolEvents,
		campusEvents,
		subjectOfferingEvents,
		subjectOfferingClassEvents,
		currentWeekStart: weekStartDate.toISOString().split('T')[0]
	};
};

export const actions = {
	changeWeek: async ({ locals: { security }, request }) => {
		const user = security.isAuthenticated().getUser();
		const formData = await request.formData();
		const weekStartDate = new Date(formData.get('week') as string);

		// Get class allocations and events for the new week
		const [
			classAllocation,
			schoolEvents,
			campusEvents,
			subjectOfferingEvents,
			subjectOfferingClassEvents
		] = await Promise.all([
			getSubjectClassAllocationsByUserIdForWeek(user.id, weekStartDate),
			getSchoolEventsForWeekBySchoolId(user.schoolId, weekStartDate),
			getCampusEventsForWeekByUserId(user.id, weekStartDate),
			getSubjectOfferingEventsForWeekByUserId(user.id, weekStartDate),
			getSubjectOfferingClassEventsForWeekByUserId(user.id, weekStartDate)
		]);

		return {
			success: true,
			classAllocation: classAllocation || [],
			schoolEvents: schoolEvents || [],
			campusEvents: campusEvents || [],
			subjectOfferingEvents: subjectOfferingEvents || [],
			subjectOfferingClassEvents: subjectOfferingClassEvents || [],
			currentWeekStart: weekStartDate.toISOString().split('T')[0]
		};
	}
};
