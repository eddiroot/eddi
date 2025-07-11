import { getSubjectThreadsMinimalBySubjectId } from '$lib/server/db/service';

export const load = async ({ locals: { security }, params: { subjectOfferingId } }) => {
	security.isAuthenticated();

	let subjectOfferingIdInt;
	try {
		subjectOfferingIdInt = parseInt(subjectOfferingId, 10);
	} catch {
		return { subject: null };
	}

	const threads = await getSubjectThreadsMinimalBySubjectId(subjectOfferingIdInt);

	return { subjectOfferingIdInt, threads };
};
