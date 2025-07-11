import {
	getSchoolById,
	getCampusesByUserId,
	getSubjectsWithClassesByUserId
} from '$lib/server/db/service';

export const load = async ({ locals: { user } }) => {
	if (!user) {
		return { user: null, school: null, subjects: [], classes: [] };
	}

	// Needed to populate the sidebar with subjects and their classes
	const subjects = await getSubjectsWithClassesByUserId(user.id);

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
