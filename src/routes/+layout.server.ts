import { getSchoolById, getSubjectsByUserId } from '$lib/server/db/service.js';

export const load = async ({ locals: { user } }) => {
	if (!user) {
		return { user: null, school: null, subjects: [] };
	}

	// Needed to populate the sidebar
	const subjects = await getSubjectsByUserId(user.id);

	// Needed to display the school top left
	const school = await getSchoolById(user.schoolId);

	return {
		user,
		school,
		subjects
	};
};
