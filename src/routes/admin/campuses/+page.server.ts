import { getCampusesBySchoolId } from '$lib/server/db/service';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();
	const campuses = await getCampusesBySchoolId(user.schoolId);

	return { campuses };
};
