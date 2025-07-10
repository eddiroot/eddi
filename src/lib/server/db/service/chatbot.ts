import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq, and, asc, desc } from 'drizzle-orm';

// For simplicity, we will grab all of the coursemap topics and descriptions as well as the lesson names and descriptions to
// provide context for the subject offering. This will be used to answer questions about the subject offering in the chatbot.

// These retrieval functions will need to be optimized to better handle large datasets, and grabbing only the necessary data
// for the chatbot to answer questions and redirect the user.

// this function gives the context for a given subject offering class
export async function getSubjectOfferingClassContextForChatbot(
	userId: string,
	subjectOfferingClassId: number
) {
	// First verify the user has access to this class
	const userAccess = await db
		.select()
		.from(table.userSubjectOfferingClass)
		.where(
			and(
				eq(table.userSubjectOfferingClass.userId, userId),
				eq(table.userSubjectOfferingClass.subOffClassId, subjectOfferingClassId),
				eq(table.userSubjectOfferingClass.isArchived, false)
			)
		)
		.limit(1);

	if (userAccess.length === 0) {
		throw new Error('User does not have access to this subject offering class');
	}

	// Get subject offering class details
	const subjectOfferingClass = await db
		.select({
			subjectOfferingClass: table.subjectOfferingClass,
			subjectOffering: table.subjectOffering,
			subject: table.subject,
			coreSubject: table.coreSubject,
			electiveSubject: table.electiveSubject
		})
		.from(table.subjectOfferingClass)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOffering.id, table.subjectOfferingClass.subOfferingId)
		)
		.innerJoin(table.subject, eq(table.subject.id, table.subjectOffering.subjectId))
		.leftJoin(table.coreSubject, eq(table.coreSubject.id, table.subject.coreSubjectId))
		.leftJoin(table.electiveSubject, eq(table.electiveSubject.id, table.subject.electiveSubjectId))
		.where(eq(table.subjectOfferingClass.id, subjectOfferingClassId))
		.limit(1);

	if (subjectOfferingClass.length === 0) {
		throw new Error('Subject offering class not found');
	}

	const classData = subjectOfferingClass[0];

	// Get all course map items for this subject offering
	const courseMapItems = await db
		.select({
			courseMapItem: table.courseMapItem,
			learningArea: table.learningArea
		})
		.from(table.courseMapItem)
		.leftJoin(
			table.courseMapItemLearningArea,
			eq(table.courseMapItemLearningArea.courseMapItemId, table.courseMapItem.id)
		)
		.leftJoin(
			table.learningArea,
			eq(table.learningArea.id, table.courseMapItemLearningArea.learningAreaId)
		)
		.where(
			and(
				eq(table.courseMapItem.subjectOfferingId, classData.subjectOffering.id),
				eq(table.courseMapItem.isCurrentVersion, true),
				eq(table.courseMapItem.isArchived, false)
			)
		)
		.orderBy(asc(table.courseMapItem.startWeek), asc(table.courseMapItem.semester));

	// Group course map items with their learning areas
	const groupedCourseMapItems = courseMapItems.reduce(
		(acc, item) => {
			const existingItem = acc.find((i) => i.courseMapItem.id === item.courseMapItem.id);

			if (existingItem) {
				if (item.learningArea) {
					existingItem.learningAreas.push(item.learningArea);
				}
			} else {
				acc.push({
					courseMapItem: item.courseMapItem,
					learningAreas: item.learningArea ? [item.learningArea] : []
				});
			}

			return acc;
		},
		[] as Array<{
			courseMapItem: typeof table.courseMapItem.$inferSelect;
			learningAreas: (typeof table.learningArea.$inferSelect)[];
		}>
	);

	// Get all tasks assigned to this class
	const classTasks = await db
		.select({
			subjectOfferingClassTask: table.subjectOfferingClassTask,
			subjectOfferingTask: table.subjectOfferingTask,
			task: table.task,
			courseMapItem: table.courseMapItem
		})
		.from(table.subjectOfferingClassTask)
		.innerJoin(
			table.subjectOfferingTask,
			eq(table.subjectOfferingTask.id, table.subjectOfferingClassTask.subjectOfferingTaskId)
		)
		.innerJoin(table.task, eq(table.task.id, table.subjectOfferingTask.taskId))
		.leftJoin(
			table.courseMapItem,
			eq(table.courseMapItem.id, table.subjectOfferingTask.courseMapItemId)
		)
		.where(
			and(
				eq(table.subjectOfferingClassTask.subjectOfferingClassId, subjectOfferingClassId),
				eq(table.subjectOfferingClassTask.isArchived, false),
				eq(table.subjectOfferingTask.isArchived, false)
			)
		)
		.orderBy(asc(table.subjectOfferingClassTask.index));

	// Format the context data for the chatbot
	const context = {
		subjectInfo: {
			id: classData.subjectOfferingClass.id,
			name:
				classData.coreSubject?.name || classData.electiveSubject?.name || classData.subject.name,
			description: classData.coreSubject?.description || classData.electiveSubject?.description,
			yearLevel: classData.subject.yearLevel,
			semester: classData.subjectOffering.semester
		},
		courseMapItems: groupedCourseMapItems.map((item) => ({
			id: item.courseMapItem.id,
			topic: item.courseMapItem.topic,
			description: item.courseMapItem.description,
			learningAreas: item.learningAreas.map((la) => ({
				id: la.id,
				name: la.name,
				description: la.description
			}))
		})),
		tasks: classTasks.map((taskItem) => ({
			id: taskItem.task.id,
			name: taskItem.task.title,
			description: taskItem.task.description,
			index: taskItem.subjectOfferingClassTask.index,
			subjectOfferingTaskId: taskItem.subjectOfferingTask.id,
			courseMapItemId: taskItem.courseMapItem?.id || null,
			courseMapItemTopic: taskItem.courseMapItem?.topic || null
		}))
	};

	return context;
}

// Additional helper function to get context for a specific subject offering (without class-specific tasks)
export async function getSubjectOfferingContextForChatbot(
	userId: string,
	subjectOfferingId: number
) {
	// First verify the user has access to this subject offering
	const userAccess = await db
		.select()
		.from(table.userSubjectOffering)
		.where(
			and(
				eq(table.userSubjectOffering.userId, userId),
				eq(table.userSubjectOffering.subOfferingId, subjectOfferingId),
				eq(table.userSubjectOffering.isArchived, 0)
			)
		)
		.limit(1);

	if (userAccess.length === 0) {
		throw new Error('User does not have access to this subject offering');
	}

	// Get subject offering details
	const subjectOffering = await db
		.select({
			subjectOffering: table.subjectOffering,
			subject: table.subject,
			coreSubject: table.coreSubject,
			electiveSubject: table.electiveSubject
		})
		.from(table.subjectOffering)
		.innerJoin(table.subject, eq(table.subject.id, table.subjectOffering.subjectId))
		.leftJoin(table.coreSubject, eq(table.coreSubject.id, table.subject.coreSubjectId))
		.leftJoin(table.electiveSubject, eq(table.electiveSubject.id, table.subject.electiveSubjectId))
		.where(eq(table.subjectOffering.id, subjectOfferingId))
		.limit(1);

	if (subjectOffering.length === 0) {
		throw new Error('Subject offering not found');
	}

	const offeringData = subjectOffering[0];

	// Get all course map items for this subject offering
	const courseMapItems = await db
		.select({
			courseMapItem: table.courseMapItem,
			learningArea: table.learningArea
		})
		.from(table.courseMapItem)
		.leftJoin(
			table.courseMapItemLearningArea,
			eq(table.courseMapItemLearningArea.courseMapItemId, table.courseMapItem.id)
		)
		.leftJoin(
			table.learningArea,
			eq(table.learningArea.id, table.courseMapItemLearningArea.learningAreaId)
		)
		.where(
			and(
				eq(table.courseMapItem.subjectOfferingId, subjectOfferingId),
				eq(table.courseMapItem.isCurrentVersion, true),
				eq(table.courseMapItem.isArchived, false)
			)
		)
		.orderBy(asc(table.courseMapItem.startWeek), asc(table.courseMapItem.semester));

	// Group course map items with their learning areas
	const groupedCourseMapItems = courseMapItems.reduce(
		(acc, item) => {
			const existingItem = acc.find((i) => i.courseMapItem.id === item.courseMapItem.id);

			if (existingItem) {
				if (item.learningArea) {
					existingItem.learningAreas.push(item.learningArea);
				}
			} else {
				acc.push({
					courseMapItem: item.courseMapItem,
					learningAreas: item.learningArea ? [item.learningArea] : []
				});
			}

			return acc;
		},
		[] as Array<{
			courseMapItem: typeof table.courseMapItem.$inferSelect;
			learningAreas: (typeof table.learningArea.$inferSelect)[];
		}>
	);

	// Get all tasks for this subject offering (not class-specific)
	const offeringTasks = await db
		.select({
			subjectOfferingTask: table.subjectOfferingTask,
			task: table.task,
			courseMapItem: table.courseMapItem
		})
		.from(table.subjectOfferingTask)
		.innerJoin(table.task, eq(table.task.id, table.subjectOfferingTask.taskId))
		.leftJoin(
			table.courseMapItem,
			eq(table.courseMapItem.id, table.subjectOfferingTask.courseMapItemId)
		)
		.where(
			and(
				eq(table.subjectOfferingTask.subjectOfferingId, subjectOfferingId),
				eq(table.subjectOfferingTask.isArchived, false)
			)
		);

	// Format the context data for the chatbot
	const context = {
		subjectInfo: {
			id: offeringData.subjectOffering.id,
			name:
				offeringData.coreSubject?.name ||
				offeringData.electiveSubject?.name ||
				offeringData.subject.name,
			description:
				offeringData.coreSubject?.description || offeringData.electiveSubject?.description,
			yearLevel: offeringData.subject.yearLevel,
			semester: offeringData.subjectOffering.semester
		},
		courseMapItems: groupedCourseMapItems.map((item) => ({
			id: item.courseMapItem.id,
			topic: item.courseMapItem.topic,
			description: item.courseMapItem.description,
			learningAreas: item.learningAreas.map((la) => ({
				id: la.id,
				name: la.name,
				description: la.description
			}))
		})),
		tasks: offeringTasks.map((taskItem) => ({
			id: taskItem.task.id,
			name: taskItem.task.title,
			description: taskItem.task.description,
			subjectOfferingTaskId: taskItem.subjectOfferingTask.id,
			courseMapItemId: taskItem.courseMapItem?.id || null,
			courseMapItemTopic: taskItem.courseMapItem?.topic || null
		}))
	};

	return context;
}

export async function createChatbotChat(userId: string) {
	const [chat] = await db
		.insert(table.chatbotChat)
		.values({
			userId
		})
		.returning();

	return chat;
}

export async function createChatbotMessage(
	chatId: number,
	authorId: string | null,
	content: string
) {
	const [message] = await db
		.insert(table.chatbotMessage)
		.values({
			chatId,
			authorId,
			content
		})
		.returning();

	return message;
}

export async function getLatestChatbotMessageByChatId(chatId: number) {
	const messages = await db
		.select()
		.from(table.chatbotMessage)
		.where(eq(table.chatbotMessage.chatId, chatId))
		.orderBy(desc(table.chatbotMessage.createdAt))
		.limit(1);

	return messages.length > 0 ? messages[0] : null;
}

export async function getChatbotMessagesByChatId(chatId: number) {
	const messages = await db
		.select()
		.from(table.chatbotMessage)
		.where(eq(table.chatbotMessage.chatId, chatId))
		.orderBy(asc(table.chatbotMessage.createdAt));

	return messages;
}

export async function getChatbotChatsByUserId(userId: string) {
	const chats = await db
		.select()
		.from(table.chatbotChat)
		.where(eq(table.chatbotChat.userId, userId))
		.orderBy(desc(table.chatbotChat.createdAt));

	return chats;
}

export async function getChatbotChatsWithFirstMessageByUserId(userId: string) {
	const chats = await db
		.select({
			chat: table.chatbotChat,
			firstMessage: {
				content: table.chatbotMessage.content,
				createdAt: table.chatbotMessage.createdAt
			}
		})
		.from(table.chatbotChat)
		.leftJoin(
			table.chatbotMessage,
			and(
				eq(table.chatbotMessage.chatId, table.chatbotChat.id),
				eq(table.chatbotMessage.authorId, userId) // Only user messages, not AI responses
			)
		)
		.where(eq(table.chatbotChat.userId, userId))
		.orderBy(desc(table.chatbotChat.createdAt));

	// Group by chat and get the first user message for each
	const chatMap = new Map();

	for (const row of chats) {
		const chatId = row.chat.id;
		if (!chatMap.has(chatId)) {
			chatMap.set(chatId, {
				...row.chat,
				firstMessage: row.firstMessage
			});
		} else if (
			row.firstMessage &&
			row.firstMessage.createdAt < chatMap.get(chatId).firstMessage?.createdAt
		) {
			chatMap.set(chatId, {
				...row.chat,
				firstMessage: row.firstMessage
			});
		}
	}

	return Array.from(chatMap.values());
}

export async function getChatbotChatById(chatId: number) {
	const chat = await db
		.select()
		.from(table.chatbotChat)
		.where(eq(table.chatbotChat.id, chatId))
		.limit(1);

	return chat.length > 0 ? chat[0] : null;
}
