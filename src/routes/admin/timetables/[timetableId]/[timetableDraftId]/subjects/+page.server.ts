import { getSubjectsBySchoolId } from '$lib/server/db/service';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();
	const subjects = await getSubjectsBySchoolId(user.schoolId);
	return { subjects };
};
