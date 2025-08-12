export const load = async ({ locals: { security } }) => {
	security.isAuthenticated().isSchoolAdmin();
};
