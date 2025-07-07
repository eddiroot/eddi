import { getLocationsBySchoolId } from '$lib/server/db/service';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();
	const locations = await getLocationsBySchoolId(user.schoolId);

	return { locations };
};
