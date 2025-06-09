import { createSubjectThread } from '$lib/server/db/service.js';
import { redirect, fail } from '@sveltejs/kit';

export const load = async ({ locals: { security }, params: { subjectId } }) => {
	security.isAuthenticated();

	let subjectIdInt;
	try {
		subjectIdInt = parseInt(subjectId, 10);
	} catch {
		return { subject: null };
	}

	return { subjectIdInt };
};

export const actions = {
	create: async ({ locals: { security }, params: { subjectId }, request }) => {
		const user = security.isAuthenticated().getUser();

		let subjectIdInt;
		try {
			subjectIdInt = parseInt(subjectId, 10);
		} catch {
			return fail(400, { message: 'Invalid subject ID' });
		}

		const data = await request.formData();
		const type = data.get('type') as string;
		const title = data.get('title') as string;
		const content = data.get('content') as string;

		if (!type || !title || !content) {
			return fail(400, { message: 'All fields are required' });
		}

		if (!['discussion', 'question', 'announcement', 'qanda'].includes(type)) {
			return fail(400, { message: 'Invalid post type' });
		}

		try {
			await createSubjectThread(type, subjectIdInt, user.id, title, content);
			throw redirect(303, `/subjects/${subjectIdInt}/discussion`);
		} catch (error) {
			console.error('Error creating thread:', error);
			return fail(500, { message: 'Failed to create discussion post' });
		}
	}
};
