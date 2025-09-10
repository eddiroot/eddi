import {
	getTimeConstraintsByTimetableId,
	getSpaceConstraintsByTimetableId
} from '$lib/server/db/service/timetables';

export const load = async ({ locals: { security }, params }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();
	const timetableId = parseInt(params.timetableId);
	const timeConstraints = await getTimeConstraintsByTimetableId(timetableId);
	const spaceConstraints = await getSpaceConstraintsByTimetableId(timetableId);

	return {
		user,
		timeConstraints,
		spaceConstraints,
		timetableId
	};
};
