import { getSubjectThreadById } from '$lib/server/db/service.js';

export const load = async ({ locals: { security }, params: { threadId } }) => {
	security.isAuthenticated();

	let threadIdInt;
	try {
		threadIdInt = parseInt(threadId, 10);
	} catch {
		return { subject: null };
	}

	const thread = await getSubjectThreadById(threadIdInt);

	return { thread };
};
