export const load = async ({ locals: { security, user } }) => {
	security.isAuthenticated();

	if (!user) {
		return { user: null, subjects: [] };
	}

	return {
		user
	};
};
