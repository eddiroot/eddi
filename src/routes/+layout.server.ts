import { getSchoolById, getCampusesByUserId, getSubjectsByUserId } from '$lib/server/db/service.js';

export const load = async ({ locals: { user } }) => {
	if (!user) {
		return { user: null, school: null, subjects: [] };
	}

	// Needed to populate the sidebar
	const subjects = await getSubjectsByUserId(user.id);

	// Needed to display the school and campus top left
	const school = await getSchoolById(user.schoolId);

	const campuses = await getCampusesByUserId(user.id);

	return {
		user,
		school,
		campuses,
		subjects
	};
};
