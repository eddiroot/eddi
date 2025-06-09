import { getSubjectsByUserId } from '$lib/server/db/service.js';

export const load = async ({ locals: { user } }) => {
	if (!user) {
		return { user: null, subjects: [] };
	}

	const subjects = await getSubjectsByUserId(user.id);

	return {
		user,
		subjects
	};
};
