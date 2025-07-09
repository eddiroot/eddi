import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { desc, eq, and, gte, inArray, asc, sql } from 'drizzle-orm';

export async function getUserTasksBySchoolSubjectOfferingId(
	userId: string,
	schoolSubjectOfferingId: number
) {
	const tasks = await db
		.select({
			task: table.task
		})
		.from(table.userSchoolSubjectOffering)
		.innerJoin(
			table.schoolSubjectOfferingClass,
			eq(table.schoolSubjectOfferingClass.schSubOfferingId, schoolSubjectOfferingId)
		)
		.innerJoin(
			table.classTask,
			eq(table.schoolSubjectOfferingClass.id, table.classTask.schoolSubjectOfferingClassId)
		)
		.innerJoin(
			table.schoolSubjectTask,
			eq(table.classTask.schoolSubjectTaskId, table.schoolSubjectTask.id)
		)
		.innerJoin(table.task, eq(table.schoolSubjectTask.taskId, table.task.id))
		.where(
			and(
				eq(table.userSchoolSubjectOffering.userId, userId),
				eq(table.schoolSubjectOfferingClass.schSubOfferingId, schoolSubjectOfferingId)
			)
		)
		.orderBy(asc(table.task.index));

	return tasks;
}

export async function getTaskCMTopicsBySchoolSubjectOfferingId(schoolSubjectOfferingId: number) {
	const TaskTopics = await db
		.select({
			id: table.courseMapItem.id,
			topic: table.courseMapItem.topic
		})
		.from(table.courseMapItem)
		.where(eq(table.courseMapItem.schoolSubjectOfferingId, schoolSubjectOfferingId))
		.orderBy(asc(table.courseMapItem.id));

	return TaskTopics;
}

export async function getTaskById(taskId: number) {
	const task = await db
		.select({
			task: table.task
		})
		.from(table.task)
		.where(eq(table.task.id, taskId))
		.limit(1);

	return task?.length ? task[0].task : null;
}

export async function getTaskBlocksByTaskId(taskId: number) {
	const taskBlocks = await db
		.select({
			block: table.taskBlock
		})
		.from(table.taskBlock)
		.where(eq(table.taskBlock.taskId, taskId))
		.orderBy(table.taskBlock.index);

	return taskBlocks.map((row) => row.block);
}

export async function createTask(
	title: string,
	description: string,
	taskStatus: table.taskStatusEnum,
	type: table.taskTypeEnum,
	courseMapItemId: number,
	dueDate?: Date | null,
	isArchived: boolean = false
) {
	const maxTaskIndexIfCM = await db
		.select({ index: table.task.index })
		.from(table.courseMapItem)
		.innerJoin(
			table.schoolSubjectTask,
			eq(table.courseMapItem.id, table.schoolSubjectTask.courseMapItemId)
		)
		.innerJoin(table.task, eq(table.schoolSubjectTask.taskId, table.task.id))
		.where(eq(table.courseMapItem.id, courseMapItemId))
		.orderBy(desc(table.task.index))
		.limit(1);

	const nextIndex = (maxTaskIndexIfCM[0]?.index ?? -1) + 1;

	const [task] = await db
		.insert(table.task)
		.values({
			title,
			description,
			isPublished: taskStatus === 'published',
			type,
			index: nextIndex,
			dueDate,
			originalId: null,
			previousId: null,
			version: 1,
			isArchived
		})
		.returning();

	return task;
}

export async function updateTaskTitle(taskId: number, title: string) {
	const [task] = await db
		.update(table.task)
		.set({ title })
		.where(eq(table.task.id, taskId))
		.returning();

	return task;
}

export async function createTaskBlock(
	taskId: number,
	type: table.taskBlockTypeEnum,
	content: unknown,
	index: number | undefined = undefined
) {
	// If index is not provided, calculate the next available index used for LLM
	if (index === undefined) {
		const maxIndexResult = await db
			.select({ maxIndex: table.taskBlock.index })
			.from(table.taskBlock)
			.where(eq(table.taskBlock.taskId, taskId))
			.orderBy(desc(table.taskBlock.index))
			.limit(1);

		index = (maxIndexResult[0]?.maxIndex ?? -1) + 1;
	}

	await db
		.update(table.taskBlock)
		.set({
			index: sql`${table.taskBlock.index} + 1`
		})
		.where(and(eq(table.taskBlock.taskId, taskId), gte(table.taskBlock.index, index)));

	const [lessonBlock] = await db
		.insert(table.taskBlock)
		.values({
			taskId,
			type,
			content,
			index
		})
		.returning();

	return lessonBlock;
}

export async function updateTaskBlock(
	blockId: number,
	updates: {
		content?: unknown;
		type?: table.taskBlockTypeEnum;
	}
) {
	const [taskBlock] = await db
		.update(table.taskBlock)
		.set({ ...updates })
		.where(eq(table.taskBlock.id, blockId))
		.returning();

	return taskBlock;
}

export async function deleteTaskBlock(blockId: number) {
	await db.delete(table.taskBlock).where(eq(table.taskBlock.id, blockId));
}

// Whiteboard functions
export async function createWhiteboard(taskId: number, title?: string | null) {
	const [newWhiteboard] = await db
		.insert(table.whiteboard)
		.values({
			taskId,
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

export async function getWhiteboardWithTask(whiteboardId: number, taskId: number) {
	const whiteboardData = await db
		.select({
			whiteboard: table.whiteboard,
			task: {
				id: table.task.id,
				title: table.task.title
			}
		})
		.from(table.whiteboard)
		.innerJoin(table.task, eq(table.whiteboard.taskId, table.task.id))
		.where(eq(table.whiteboard.id, whiteboardId))
		.limit(1);

	if (!whiteboardData.length || whiteboardData[0].task.id !== taskId) {
		return null;
	}

	return {
		whiteboard: whiteboardData[0].whiteboard,
		lesson: whiteboardData[0].task
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

export async function updateTaskBlocksOrder(blockUpdates: Array<{ id: number; index: number }>) {
	await db.transaction(async (tx) => {
		for (const update of blockUpdates) {
			await tx
				.update(table.taskBlock)
				.set({ index: update.index })
				.where(eq(table.taskBlock.id, update.id));
		}
	});
}

export async function getSubjectOfferingContextForAI(userId: string, subjectOfferingId: number) {
	const subjectOfferingContext = await db
		.select({
			taskTitle: table.task.title,
			taskBlock: table.taskBlock
		})
		.from(table.userSchoolSubjectOfferingClass)
		.innerJoin(
			table.schoolSubjectOfferingClass,
			eq(table.userSchoolSubjectOfferingClass.schSubOffClassId, table.schoolSubjectOfferingClass.id)
		)
		.innerJoin(
			table.schoolSubjectOffering,
			eq(table.schoolSubjectOfferingClass.schSubOfferingId, table.schoolSubjectOffering.id)
		)
		.innerJoin(
			table.classTask,
			eq(table.schoolSubjectOfferingClass.id, table.classTask.schoolSubjectOfferingClassId)
		)
		.innerJoin(
			table.schoolSubjectTask,
			eq(table.classTask.schoolSubjectTaskId, table.schoolSubjectTask.id)
		)
		.innerJoin(table.task, eq(table.schoolSubjectTask.taskId, table.task.id))
		.innerJoin(table.taskBlock, eq(table.task.id, table.taskBlock.taskId))
		.where(
			and(
				eq(table.userSchoolSubjectOfferingClass.userId, userId),
				eq(table.schoolSubjectOffering.id, subjectOfferingId)
			)
		)
		.orderBy(asc(table.taskBlock.index));
	return subjectOfferingContext;
}

export async function updateTaskOrder(
	taskOrder: Array<{ id: number; index: number }>
): Promise<void> {
	await db.transaction(async (tx) => {
		for (const lesson of taskOrder) {
			await tx.update(table.task).set({ index: lesson.index }).where(eq(table.task.id, lesson.id));
		}
	});
}

// export async function updateCMTopicOrder(
// 	topicOrder: Array<{ id: number; index: number }>
// ): Promise<void> {
// 	await db.transaction(async (tx) => {
// 		for (const topic of topicOrder) {
// 			await tx
// 				.update(table.lessonTopic)
// 				.set({ index: topic.index })
// 				.where(eq(table.lessonTopic.id, topic.id));
// 		}
// 	});
// }
