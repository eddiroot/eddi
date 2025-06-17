import { getSubjectClassTimesByUserId } from '$lib/server/db/service';

export const load = async ({ locals: { security, user } }) => {
	security.isAuthenticated();

	if (!user) {
		return { user: null, subjects: [] };
	}

	const classTimes = await getSubjectClassTimesByUserId(user.id);
	if (!classTimes || classTimes.length === 0) {
		return { user, classTimes: [] };
	}

	return {
		user,
		classTimes
	};
};
