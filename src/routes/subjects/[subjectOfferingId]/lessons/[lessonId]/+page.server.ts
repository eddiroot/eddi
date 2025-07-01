import {
	getLessonById,
	updateLessonTitle,
	getLessonBlocksByLessonId,
	createLessonBlock,
	updateLessonBlock,
	swapLessonBlocks,
	deleteLessonBlock
} from '$lib/server/db/service';
import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals: { security }, params: { lessonId, subjectOfferingId } }) => {
	security.isAuthenticated();

	let lessonIdInt;
	try {
		lessonIdInt = parseInt(lessonId, 10);
	} catch {
		throw redirect(302, '/dashboard');
	}

	const lesson = await getLessonById(lessonIdInt);
	if (!lesson) throw redirect(302, '/dashboard');

	const blocks = await getLessonBlocksByLessonId(lessonIdInt);

	return { lesson, blocks, subjectOfferingId };
};

export const actions = {
	updateLessonTitle: async (event) => {
		const formData = await event.request.formData();
		const lessonId = formData.get('lessonId');
		const title = formData.get('title');

		if (!lessonId || !title) {
			return fail(400, { message: 'Lesson ID and title are required' });
		}
		if (typeof lessonId !== 'string' || typeof title !== 'string') {
			return fail(400, { message: 'Invalid input types' });
		}

		let lessonIdInt;
		try {
			lessonIdInt = parseInt(lessonId, 10);
		} catch {
			return fail(400, { message: 'Invalid lesson ID' });
		}

		await updateLessonTitle(lessonIdInt, title);
	},
	createBlock: async (event) => {
		const formData = await event.request.formData();

		const lessonId = formData.get('lessonId');
		const type = formData.get('type');
		const content = formData.get('content');

		if (!lessonId || !type || !content) {
			return fail(400, { message: 'All fields are required' });
		}

		if (typeof lessonId !== 'string' || typeof type !== 'string' || typeof content !== 'string') {
			return fail(400, { message: 'Invalid input types' });
		}

		let lessonIdInt;
		try {
			lessonIdInt = parseInt(lessonId, 10);
		} catch {
			return fail(400, { message: 'Invalid lesson ID' });
		}

		const block = await createLessonBlock(lessonIdInt, type, content);
		return block;
	},

	updateBlock: async (event) => {
		const formData = await event.request.formData();

		const blockId = formData.get('blockId');
		const content = formData.get('content');
		const type = formData.get('type');

		if (!blockId) {
			return fail(400, { message: 'Block ID is required' });
		}

		if (typeof blockId !== 'string') {
			return fail(400, { message: 'Invalid block ID type' });
		}

		let blockIdInt;
		try {
			blockIdInt = parseInt(blockId, 10);
		} catch {
			return fail(400, { message: 'Invalid block ID' });
		}

		const updates: { content?: unknown; type?: string } = {};
		if (content !== null && typeof content === 'string') updates.content = content;
		if (type !== null && typeof type === 'string') updates.type = type;

		await updateLessonBlock(blockIdInt, updates);
	},

	deleteBlock: async (event) => {
		const formData = await event.request.formData();

		const blockId = formData.get('blockId');

		if (!blockId || typeof blockId !== 'string') {
			return fail(400, { message: 'Invalid block ID' });
		}

		let blockIdInt;
		try {
			blockIdInt = parseInt(blockId, 10);
		} catch {
			return fail(400, { message: 'Invalid block ID' });
		}

		await deleteLessonBlock(blockIdInt);
	},

	swapBlocks: async (event) => {
		const formData = await event.request.formData();
		const blockOneId = formData.get('blockOneId');
		const blockTwoId = formData.get('blockTwoId');
		const blockOneIndex = formData.get('blockOneIndex');
		const blockTwoIndex = formData.get('blockTwoIndex');

		if (!blockOneId || !blockTwoId || blockOneIndex === null || blockTwoIndex === null) {
			return fail(400, { message: 'Block IDs and indices are required' });
		}

		if (
			typeof blockOneId !== 'string' ||
			typeof blockTwoId !== 'string' ||
			typeof blockOneIndex !== 'string' ||
			typeof blockTwoIndex !== 'string'
		) {
			return fail(400, { message: 'Invalid input types' });
		}

		let blockOneIdInt;
		let blockTwoIdInt;
		let blockOneIndexInt;
		let blockTwoIndexInt;
		try {
			blockOneIdInt = parseInt(blockOneId, 10);
			blockTwoIdInt = parseInt(blockTwoId, 10);
			blockOneIndexInt = parseInt(blockOneIndex, 10);
			blockTwoIndexInt = parseInt(blockTwoIndex, 10);
		} catch {
			return fail(400, { message: 'Invalid block IDs or indices' });
		}

		await swapLessonBlocks(blockOneIdInt, blockTwoIdInt, blockOneIndexInt, blockTwoIndexInt);
	},

	getBlocks: async (event) => {
		const formData = await event.request.formData();
		const lessonId = formData.get('lessonId');

		if (!lessonId || typeof lessonId !== 'string') {
			return fail(400, { message: 'Lesson ID is required' });
		}

		let lessonIdInt;
		try {
			lessonIdInt = parseInt(lessonId, 10);
		} catch {
			return fail(400, { message: 'Invalid lesson ID' });
		}

		const blocks = await getLessonBlocksByLessonId(lessonIdInt);
		return { blocks };
	}
};
