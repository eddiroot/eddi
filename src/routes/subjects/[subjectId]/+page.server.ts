import { getSubjectById, getSubjectThreadsBySubjectId } from '$lib/server/db/service.js';

export const load = async (event) => {
	const subjectIdStr = event.params.subjectId;

	let subjectIdInt;
	try {
		subjectIdInt = parseInt(subjectIdStr, 10);
	} catch (error) {
		console.error('Invalid subjectId:', subjectIdStr);
		return { subject: null };
	}

	const subject = await getSubjectById(subjectIdInt);
	const threads = await getSubjectThreadsBySubjectId(subjectIdInt);

	return { subject, threads };
};
