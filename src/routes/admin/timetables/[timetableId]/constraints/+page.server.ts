export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();
	// const spaces = await getSpacesBySchoolId(user.schoolId);
	return { user };
};
