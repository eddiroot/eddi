import { json } from '@sveltejs/kit';
import { createLessonBlock, updateLessonBlock, deleteLessonBlock } from '$lib/server/db/service';
import { lessonBlockTypeEnum } from '$lib/server/db/schema';

// POST /api/lessons/blocks - Create a new block
export async function POST({ request }: { request: Request }) {
	try {
		const { lessonId, type, content, index } = await request.json();

		if (!lessonId || !type || (!index && index != 0) || content === undefined) {
			return json({ error: 'Lesson ID, type, index, and content are required' }, { status: 400 });
		}

		if (typeof lessonId !== 'number' || typeof type !== 'string' || typeof index !== 'number') {
			return json({ error: 'Invalid input types' }, { status: 400 });
		}

		if (!Object.values(lessonBlockTypeEnum).includes(type as lessonBlockTypeEnum)) {
			return json({ error: 'Invalid block type' }, { status: 400 });
		}

		const block = await createLessonBlock(lessonId, type as lessonBlockTypeEnum, content, index);

		return json({ block });
	} catch (error) {
		console.error('Error creating block:', error);
		return json({ error: 'Failed to create block' }, { status: 500 });
	}
}

// PATCH /api/lessons/blocks - Update a block
export async function PATCH({ request }: { request: Request }) {
	try {
		const { blockId, content, type } = await request.json();

		if (!blockId) {
			return json({ error: 'Block ID is required' }, { status: 400 });
		}

		if (typeof blockId !== 'number') {
			return json({ error: 'Invalid block ID type' }, { status: 400 });
		}

		const updates: { content?: unknown; type?: lessonBlockTypeEnum } = {};
		if (content !== undefined) updates.content = content;
		if (type !== undefined) {
			if (typeof type !== 'string') {
				return json({ error: 'Invalid block type' }, { status: 400 });
			}
			updates.type = type as lessonBlockTypeEnum;
		}

		if (Object.keys(updates).length === 0) {
			return json({ error: 'No valid updates provided' }, { status: 400 });
		}

		const updatedBlock = await updateLessonBlock(blockId, updates);
		return json({ block: updatedBlock });
	} catch (error) {
		console.error('Error updating block:', error);
		return json({ error: 'Failed to update block' }, { status: 500 });
	}
}

// DELETE /api/lessons/blocks?blockId=123 - Delete a block
export async function DELETE({ url }: { url: URL }) {
	try {
		const blockIdParam = url.searchParams.get('blockId');

		if (!blockIdParam) {
			return json({ error: 'Block ID is required' }, { status: 400 });
		}

		let blockId: number;
		try {
			blockId = parseInt(blockIdParam, 10);
		} catch {
			return json({ error: 'Invalid block ID' }, { status: 400 });
		}

		await deleteLessonBlock(blockId);
		return json({ success: true });
	} catch (error) {
		console.error('Error deleting block:', error);
		return json({ error: 'Failed to delete block' }, { status: 500 });
	}
}
