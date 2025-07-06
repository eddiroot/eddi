import { getUsersBySchoolId } from '$lib/server/db/service';

export const load = async ({ locals: { security } }) => {
	// TODO: Switch to this once school admin is implemented
	// const user = security.isAuthenticated().isSchoolAdmin().getUser();
	const user = security.isAuthenticated().getUser();
	const users = await getUsersBySchoolId(user.schoolId);

	return { users };
};
