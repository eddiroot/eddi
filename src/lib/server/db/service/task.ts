import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { desc, eq, and, gte, inArray, asc, sql } from 'drizzle-orm';
import { verifyUserAccessToClass } from './user';

export async function addTasksToClass(
	subjectOfferingTaskIds: number[],
	subjectOfferingClassId: number
) {
	if (subjectOfferingTaskIds.length === 0) {
		return [];
	}

	// get the next available index for the class tasks
	const maxIndexResult = await db
		.select({ maxIndex: table.subjectOfferingClassTask.index })
		.from(table.subjectOfferingClassTask)
		.where(eq(table.subjectOfferingClassTask.subjectOfferingClassId, subjectOfferingClassId))
		.orderBy(desc(table.subjectOfferingClassTask.index))
		.limit(1);
	let nextIndex = (maxIndexResult[0]?.maxIndex ?? -1) + 1;

	const classTasks = await db
		.insert(table.subjectOfferingClassTask)
		.values(
			subjectOfferingTaskIds.map((taskId) => ({
				subjectOfferingTaskId: taskId,
				subjectOfferingClassId: subjectOfferingClassId,
				index: nextIndex++
			}))
		)
		.onConflictDoNothing()
		.returning();

	return classTasks;
}

// Remove a task from a class
export async function removeTaskFromClass(
	subjectOfferingTaskId: number,
	subjectOfferingClassId: number
) {
	const deletedClassTask = await db
		.delete(table.subjectOfferingClassTask)
		.where(
			and(
				eq(table.subjectOfferingClassTask.subjectOfferingTaskId, subjectOfferingTaskId),
				eq(table.subjectOfferingClassTask.subjectOfferingClassId, subjectOfferingClassId)
			)
		)
		.returning();

	return deletedClassTask;
}

// Get all tasks assigned to a specific class
export async function getTasksBySubjectOfferingClassId(
	userId: string,
	subjectOfferingClassId: number
) {
	const userAccess = await verifyUserAccessToClass(userId, subjectOfferingClassId);

	if (!userAccess) {
		return [];
	}

	const classTasks = await db
		.select({
			task: table.task,
			subjectOfferingTask: table.subjectOfferingTask,
			subjectOfferingClassTask: table.subjectOfferingClassTask,
			courseMapItem: table.courseMapItem
		})
		.from(table.subjectOfferingClassTask)
		.innerJoin(
			table.subjectOfferingTask,
			eq(table.subjectOfferingClassTask.subjectOfferingTaskId, table.subjectOfferingTask.id)
		)
		.innerJoin(table.task, eq(table.subjectOfferingTask.taskId, table.task.id))
		.innerJoin(
			table.courseMapItem,
			eq(table.subjectOfferingTask.courseMapItemId, table.courseMapItem.id)
		)
		.where(eq(table.subjectOfferingClassTask.subjectOfferingClassId, subjectOfferingClassId))
		.orderBy(asc(table.task.id));

	return classTasks?.length == 0 ? [] : classTasks;
}

export async function getTopics(subjectOfferingClassId: number) {
	const topics = await db
		.select({
			id: table.courseMapItem.id,
			name: table.courseMapItem.topic
		})
		.from(table.courseMapItem)
		.innerJoin(
			table.subjectOffering,
			eq(table.courseMapItem.subjectOfferingId, table.subjectOffering.id)
		)
		.innerJoin(
			table.subjectOfferingClass,
			eq(table.subjectOffering.id, table.subjectOfferingClass.subOfferingId)
		)
		.where(eq(table.subjectOfferingClass.id, subjectOfferingClassId))
		.orderBy(asc(table.courseMapItem.startWeek));

	return topics;
}

export async function getClassTasksByTopicId(subjectOfferingClassId: number, topicId: number) {
	const tasks = await db
		.select({
			task: table.task
		})
		.from(table.subjectOfferingClassTask)
		.innerJoin(
			table.subjectOfferingTask,
			eq(table.subjectOfferingClassTask.subjectOfferingTaskId, table.subjectOfferingTask.id)
		)
		.innerJoin(
			table.courseMapItem,
			eq(table.subjectOfferingTask.courseMapItemId, table.courseMapItem.id)
		)
		.where(
			and(
				eq(table.subjectOfferingClassTask.subjectOfferingClassId, subjectOfferingClassId),
				eq(table.courseMapItem.id, topicId)
			)
		)
		.orderBy(asc(table.subjectOfferingClassTask.index));

	return tasks.map((row) => row.task);
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
	version: number,
	type: table.taskTypeEnum,
	isArchived: boolean = false
) {
	const [task] = await db
		.insert(table.task)
		.values({
			title,
			type,
			description,
			originalId: null,
			version,
			isArchived
		})
		.returning();

	return task;
}

export async function createSubjectOfferingTask(
	taskId: number,
	subjectOfferingId: number,
	authorId: string,
	courseMapItemId: number | null = null
) {
	const [subjectOfferingTask] = await db
		.insert(table.subjectOfferingTask)
		.values({
			taskId,
			subjectOfferingId,
			authorId,
			courseMapItemId
		})
		.returning();

	return subjectOfferingTask;
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
		task: whiteboardData[0].task
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

export async function updateTaskOrder(
	taskOrder: Array<{ id: number; index: number }>
): Promise<void> {
	await db.transaction(async (tx) => {
		for (const task of taskOrder) {
			await tx
				.update(table.subjectOfferingClassTask)
				.set({ index: task.index })
				.where(eq(table.task.id, task.id));
		}
	});
}

export async function getLearningAreaContentByCourseMapItemId(courseMapItemId: number) {
	const learningAreaContents = await db
		.select({
			learningAreaContent: table.learningAreaContent
		})
		.from(table.learningAreaContent)
		.innerJoin(
			table.courseMapItemLearningArea,
			eq(table.learningAreaContent.learningAreaId, table.courseMapItemLearningArea.learningAreaId)
		)
		.innerJoin(
			table.courseMapItem,
			eq(table.courseMapItemLearningArea.courseMapItemId, table.courseMapItem.id)
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.courseMapItem.subjectOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(
			and(
				eq(table.courseMapItemLearningArea.courseMapItemId, courseMapItemId),
				eq(table.learningAreaContent.yearLevel, table.subject.yearLevel)
			)
		)
		.orderBy(asc(table.learningAreaContent.id));
	return learningAreaContents.map((row) => row.learningAreaContent);
}

export async function getLearningAreasBySubjectOfferingId(subjectOfferingId: number) {
	const learningAreas = await db
		.select({
			learningArea: table.learningArea
		})
		.from(table.subjectOffering)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.innerJoin(table.coreSubject, eq(table.subject.coreSubjectId, table.coreSubject.id))
		.innerJoin(
			table.curriculumSubject,
			eq(table.coreSubject.curriculumSubjectId, table.curriculumSubject.id)
		)
		.innerJoin(
			table.learningArea,
			eq(table.learningArea.curriculumSubjectId, table.curriculumSubject.id)
		)
		.where(eq(table.subjectOffering.id, subjectOfferingId))
		.orderBy(asc(table.learningArea.id));
	return learningAreas.map((row) => row.learningArea);
}

// Select the learningAreaContents and add this to the gemini service, use coursemap.ts funtion to get the learning area content
export async function getContentElaborationsByLearningAreaContentIds(
	learningAreaContentIds: number[]
) {
	if (learningAreaContentIds.length === 0) return [];

	const elaborations = await db
		.select({
			id: table.contentElaboration.id,
			learningAreaContentId: table.contentElaboration.learningAreaContentId,
			name: table.contentElaboration.name,
			contentElaboration: table.contentElaboration.contentElaboration
		})
		.from(table.contentElaboration)
		.where(inArray(table.contentElaboration.learningAreaContentId, learningAreaContentIds))
		.orderBy(asc(table.contentElaboration.id));

	return elaborations;
}

export async function getLearningAreaContentWithElaborationsByIds(
	learningAreaContentIds: number[]
) {
	if (learningAreaContentIds.length === 0) return [];

	// Get the learning area content
	const learningAreaContents = await db
		.select({
			learningAreaContent: table.learningAreaContent
		})
		.from(table.learningAreaContent)
		.where(inArray(table.learningAreaContent.id, learningAreaContentIds))
		.orderBy(asc(table.learningAreaContent.id));

	// Get elaborations for these content IDs
	const elaborations = await getContentElaborationsByLearningAreaContentIds(learningAreaContentIds);

	// Combine the data
	const contentWithElaborations = learningAreaContents.map((row) => {
		const content = row.learningAreaContent;
		const contentElaborations = elaborations.filter(
			(elaboration) => elaboration.learningAreaContentId === content.id
		);

		return {
			...content,
			elaborations: contentElaborations
		};
	});

	return contentWithElaborations;
}
