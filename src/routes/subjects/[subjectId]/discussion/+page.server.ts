import { getSubjectThreadsBySubjectId } from '$lib/server/db/service.js';

export const load = async ({ locals: { security }, params: { subjectId } }) => {
	security.isAuthenticated();

	let subjectIdInt;
	try {
		subjectIdInt = parseInt(subjectId, 10);
	} catch {
		return { subject: null };
	}

	const threads = await getSubjectThreadsBySubjectId(subjectIdInt);

	return { subjectIdInt, threads };
};
