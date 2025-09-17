import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq, and, asc, desc } from 'drizzle-orm';
import { getTasksBySubjectOfferingClassId } from './task';
import { verifyUserAccessToClass, verifyUserAccessToSubjectOffering } from './user';
import {
	getCourseMapItemAndLearningAreaByVersionAndBySubjectOfferingId,
	getLatestVersionForCourseMapItemBySubjectOfferingId
} from './coursemap';
import type { SubjectContextData } from '../../../../routes/api/chatbot/constants';
import {
	getSubjectOfferingById,
	getSubjectOfferingClassDetailsById,
	getTasksBySubjectOfferingId
} from './';

// For simplicity, we will grab all of the coursemap topics and descriptions as well as the lesson names and descriptions to
// provide context for the subject offering. This will be used to answer questions about the subject offering in the chatbot.

// These retrieval functions will need to be optimized to better handle large datasets, and grabbing only the necessary data
// for the chatbot to answer questions and redirect the user.

// this function gives the context for a given subject offering class
export async function getSubjectOfferingClassContextForChatbot(
	userId: string,
	subjectOfferingClassId: number
) {
	const hasAccess = await verifyUserAccessToClass(userId, subjectOfferingClassId);

	if (!hasAccess) {
		throw new Error('User does not have access to this subject offering class');
	}

	const classData = await getSubjectOfferingClassDetailsById(subjectOfferingClassId);

	if (!classData) {
		throw new Error('Subject offering class not found');
	}

	const maxVersion = await getLatestVersionForCourseMapItemBySubjectOfferingId(
		classData.subjectOffering.id
	);

	if (maxVersion === null) {
		throw new Error('No course map item/s found for this subject offering class');
	}

	const courseMapItems = await getCourseMapItemAndLearningAreaByVersionAndBySubjectOfferingId(
		classData.subjectOffering.id,
		maxVersion
	);

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

	const classTasks = await getTasksBySubjectOfferingClassId(userId, subjectOfferingClassId);

	const context = {
		subjectInfo: {
			id: classData.subjectOfferingClass.id,
			name:
				classData.coreSubject?.name || classData.electiveSubject?.name || classData.subject.name,
			description: classData.coreSubject?.description || classData.electiveSubject?.description,
			yearLevel: classData.subject.yearLevel
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
			subjectOfferingClassTaskId: taskItem.subjectOfferingClassTask.id,
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
): Promise<SubjectContextData> {
	const hasAccess = await verifyUserAccessToSubjectOffering(userId, subjectOfferingId);

	if (!hasAccess) {
		throw new Error('User does not have access to this subject offering');
	}

	const offeringData = await getSubjectOfferingById(subjectOfferingId);

	if (!offeringData) {
		throw new Error('Subject offering not found');
	}

	const maxVersion = await getLatestVersionForCourseMapItemBySubjectOfferingId(
		offeringData.subjectOffering.id
	);

	if (maxVersion === null) {
		throw new Error('No course map items found for this subject offering');
	}

	const courseMapItems = await getCourseMapItemAndLearningAreaByVersionAndBySubjectOfferingId(
		offeringData.subjectOffering.id,
		maxVersion
	);

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
	const offeringTasks = await getTasksBySubjectOfferingId(subjectOfferingId);

	// Format the context data for the chatbot
	const context = {
		subjectInfo: {
			id: offeringData.subjectOffering.id,
			name:
				offeringData.coreSubject?.name ||
				offeringData.electiveSubject?.name ||
				offeringData.subject.name,
			yearLevel: offeringData.subject.yearLevel
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
			subjectOfferingClassTaskId: taskItem.subjectOfferingClassTask.id,
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
