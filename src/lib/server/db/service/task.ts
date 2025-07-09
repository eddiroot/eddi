import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { desc, eq, and, gte, inArray, asc, sql } from 'drizzle-orm';

export async function getUserTasksBySchoolSubjectOfferingId(
	userId: string,
	schoolSubjectId: number
) {
	const lessons = await db
		.select({
			lesson: table.task,
			lessonTopic: table.lessonTopic
		})
		.from(table.userSubjectClass)
		.innerJoin(table.subjectClass, eq(table.userSubjectClass.subjectClassId, table.subjectClass.id))
		.innerJoin(table.lessonTopic, eq(table.lessonTopic.subjectClassId, table.subjectClass.id))
		.innerJoin(table.lesson, eq(table.lesson.lessonTopicId, table.lessonTopic.id))
		.where(
			and(
				eq(table.userSubjectClass.userId, userId),
				eq(table.subjectClass.subjectOfferingId, subjectOfferingId)
			)
		)
		.orderBy(asc(table.lessonTopic.index), asc(table.lesson.index));

	return lessons;
}

export async function getLessonTopicsBySubjectOfferingId(subjectOfferingId: number) {
	const lessonTopics = await db
		.select({
			id: table.lessonTopic.id,
			name: table.lessonTopic.name
		})
		.from(table.lessonTopic)
		.innerJoin(table.subjectClass, eq(table.subjectClass.subjectOfferingId, subjectOfferingId))
		.where(eq(table.lessonTopic.subjectClassId, table.subjectClass.id))
		.orderBy(asc(table.lessonTopic.index));

	return lessonTopics;
}

export async function getLessonById(lessonId: number) {
	const lesson = await db
		.select({
			lesson: table.lesson
		})
		.from(table.lesson)
		.where(eq(table.lesson.id, lessonId))
		.limit(1);

	return lesson?.length ? lesson[0].lesson : null;
}

export async function getLessonBlocksByLessonId(lessonId: number) {
	const lessonBlocks = await db
		.select({
			block: table.lessonBlock
		})
		.from(table.lessonBlock)
		.where(eq(table.lessonBlock.lessonId, lessonId))
		.orderBy(table.lessonBlock.index);

	return lessonBlocks.map((row) => row.block);
}

export async function createLesson(
	title: string,
	description: string,
	lessonStatus: table.lessonStatusEnum,
	type: table.lessonTypeEnum,
	lessonTopicId: number,
	dueDate?: Date | null,
	isArchived: boolean = false
) {
	const maxLessonIndexPerTopic = await db
		.select({ index: table.lesson.index })
		.from(table.lesson)
		.where(eq(table.lesson.lessonTopicId, lessonTopicId))
		.orderBy(desc(table.lesson.index))
		.limit(1);

	const nextIndex = (maxLessonIndexPerTopic[0]?.index ?? -1) + 1;

	const [lesson] = await db
		.insert(table.lesson)
		.values({
			title,
			description,
			lessonStatus,
			type,
			index: nextIndex,
			lessonTopicId,
			dueDate,
			isArchived
		})
		.returning();

	return lesson;
}

export async function updateLessonTitle(lessonId: number, title: string) {
	const [lesson] = await db
		.update(table.lesson)
		.set({ title })
		.where(eq(table.lesson.id, lessonId))
		.returning();

	return lesson;
}

export async function createLessonBlock(
	lessonId: number,
	type: table.lessonBlockTypeEnum,
	content: unknown,
	index: number | undefined = undefined
) {
	// If index is not provided, calculate the next available index used for LLM
	if (index === undefined) {
		const maxIndexResult = await db
			.select({ maxIndex: table.lessonBlock.index })
			.from(table.lessonBlock)
			.where(eq(table.lessonBlock.lessonId, lessonId))
			.orderBy(desc(table.lessonBlock.index))
			.limit(1);

		index = (maxIndexResult[0]?.maxIndex ?? -1) + 1;
	}

	await db
		.update(table.lessonBlock)
		.set({
			index: sql`${table.lessonBlock.index} + 1`
		})
		.where(and(eq(table.lessonBlock.lessonId, lessonId), gte(table.lessonBlock.index, index)));

	const [lessonBlock] = await db
		.insert(table.lessonBlock)
		.values({
			lessonId,
			type,
			content,
			index
		})
		.returning();

	return lessonBlock;
}

export async function updateLessonBlock(
	blockId: number,
	updates: {
		content?: unknown;
		type?: table.lessonBlockTypeEnum;
	}
) {
	const [lessonBlock] = await db
		.update(table.lessonBlock)
		.set({ ...updates })
		.where(eq(table.lessonBlock.id, blockId))
		.returning();

	return lessonBlock;
}

export async function deleteLessonBlock(blockId: number) {
	await db.delete(table.lessonBlock).where(eq(table.lessonBlock.id, blockId));
}

// Whiteboard functions
export async function createWhiteboard(lessonId: number, title?: string | null) {
	const [newWhiteboard] = await db
		.insert(table.whiteboard)
		.values({
			lessonId,
			title: title && title.trim() ? title.trim() : null
		})
		.returning();

	return newWhiteboard;
}

export async function getWhiteboardById(whiteboardId: number) {
	const whiteboards = await db
		.select()
		.from(table.whiteboard)
		.where(eq(table.whiteboard.id, whiteboardId))
		.limit(1);

	return whiteboards[0] || null;
}

export async function getWhiteboardWithLesson(whiteboardId: number, lessonId: number) {
	const whiteboardData = await db
		.select({
			whiteboard: table.whiteboard,
			lesson: {
				id: table.lesson.id,
				title: table.lesson.title
			}
		})
		.from(table.whiteboard)
		.innerJoin(table.lesson, eq(table.whiteboard.lessonId, table.lesson.id))
		.where(eq(table.whiteboard.id, whiteboardId))
		.limit(1);

	if (!whiteboardData.length || whiteboardData[0].lesson.id !== lessonId) {
		return null;
	}

	return {
		whiteboard: whiteboardData[0].whiteboard,
		lesson: whiteboardData[0].lesson
	};
}

export async function getWhiteboardObjects(whiteboardId: number = 1) {
	const objects = await db
		.select()
		.from(table.whiteboardObject)
		.where(eq(table.whiteboardObject.whiteboardId, whiteboardId))
		.orderBy(table.whiteboardObject.createdAt);

	return objects;
}

export async function saveWhiteboardObject(data: {
	objectId: string;
	objectType: table.whiteboardObjectTypeEnum;
	objectData: Record<string, unknown>;
	whiteboardId?: number;
}) {
	const [savedObject] = await db
		.insert(table.whiteboardObject)
		.values({
			...data,
			whiteboardId: data.whiteboardId ?? 1 // Default to whiteboard ID 1
		})
		.returning();

	return savedObject;
}

export async function updateWhiteboardObject(
	objectId: string,
	objectData: Record<string, unknown>,
	whiteboardId: number = 1
) {
	const [updatedObject] = await db
		.update(table.whiteboardObject)
		.set({ objectData })
		.where(
			and(
				eq(table.whiteboardObject.objectId, objectId),
				eq(table.whiteboardObject.whiteboardId, whiteboardId)
			)
		)
		.returning();

	return updatedObject;
}

export async function deleteWhiteboardObject(objectId: string, whiteboardId: number = 1) {
	await db
		.delete(table.whiteboardObject)
		.where(
			and(
				eq(table.whiteboardObject.objectId, objectId),
				eq(table.whiteboardObject.whiteboardId, whiteboardId)
			)
		);
}

export async function deleteWhiteboardObjects(objectIds: string[], whiteboardId: number = 1) {
	if (objectIds.length === 0) return;

	await db
		.delete(table.whiteboardObject)
		.where(
			and(
				eq(table.whiteboardObject.whiteboardId, whiteboardId),
				inArray(table.whiteboardObject.objectId, objectIds)
			)
		);
}

export async function clearWhiteboard(whiteboardId: number = 1) {
	await db
		.delete(table.whiteboardObject)
		.where(eq(table.whiteboardObject.whiteboardId, whiteboardId));
}

export async function updateLessonBlocksOrder(blockUpdates: Array<{ id: number; index: number }>) {
	await db.transaction(async (tx) => {
		for (const update of blockUpdates) {
			await tx
				.update(table.lessonBlock)
				.set({ index: update.index })
				.where(eq(table.lessonBlock.id, update.id));
		}
	});
}

export async function getSubjectOfferingContextForAI(userID: string, subjectOfferingId: number) {
	const subjectOfferingContext = await db
		.select({
			lessonTopicName: table.lessonTopic.name,
			lessonTitle: table.lesson.title,
			lessonBlock: table.lessonBlock
		})
		.from(table.userSubjectClass)
		.innerJoin(table.subjectClass, eq(table.userSubjectClass.subjectClassId, table.subjectClass.id))
		.innerJoin(table.lessonTopic, eq(table.lessonTopic.subjectClassId, table.subjectClass.id))
		.innerJoin(table.lesson, eq(table.lesson.lessonTopicId, table.lessonTopic.id))
		.leftJoin(table.lessonBlock, eq(table.lessonBlock.lessonId, table.lesson.id))
		.where(
			and(
				eq(table.userSubjectClass.userId, userID),
				eq(table.subjectClass.subjectOfferingId, subjectOfferingId)
			)
		)
		.orderBy(asc(table.lessonTopic.index));

	return subjectOfferingContext;
}

export async function updateLessonOrder(
	lessonOrder: Array<{ id: number; index: number }>
): Promise<void> {
	await db.transaction(async (tx) => {
		for (const lesson of lessonOrder) {
			await tx
				.update(table.lesson)
				.set({ index: lesson.index })
				.where(eq(table.lesson.id, lesson.id));
		}
	});
}

export async function updateTopicOrder(
	topicOrder: Array<{ id: number; index: number }>
): Promise<void> {
	await db.transaction(async (tx) => {
		for (const topic of topicOrder) {
			await tx
				.update(table.lessonTopic)
				.set({ index: topic.index })
				.where(eq(table.lessonTopic.id, topic.id));
		}
	});
}
