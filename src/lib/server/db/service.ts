import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { desc, eq, and, gte, inArray, asc, sql, count } from 'drizzle-orm';

export async function getUsersBySchoolId(schoolId: number) {
	const users = await db
		// Selecting specific user fields to avoid returning sensitive data
		.select({
			id: table.user.id,
			email: table.user.email,
			type: table.user.type,
			firstName: table.user.firstName,
			middleName: table.user.middleName,
			lastName: table.user.lastName,
			avatarUrl: table.user.avatarUrl
		})
		.from(table.user)
		.where(eq(table.user.schoolId, schoolId))
		.orderBy(asc(table.user.type), asc(table.user.lastName), asc(table.user.firstName));

	return users;
}

export async function getSchoolById(schoolId: number) {
	const schools = await db
		.select()
		.from(table.school)
		.where(eq(table.school.id, schoolId))
		.limit(1);

	return schools.length > 0 ? schools[0] : null;
}

export async function getSchoolStatsById(schoolId: number) {
	const totalStudents = await db
		.select({ count: count() })
		.from(table.user)
		.where(and(eq(table.user.schoolId, schoolId), eq(table.user.type, table.userTypeEnum.student)))
		.limit(1);

	const totalTeachers = await db
		.select({ count: count() })
		.from(table.user)
		.where(and(eq(table.user.schoolId, schoolId), eq(table.user.type, table.userTypeEnum.teacher)))
		.limit(1);

	const totalAdmins = await db
		.select({ count: count() })
		.from(table.user)
		.where(
			and(eq(table.user.schoolId, schoolId), eq(table.user.type, table.userTypeEnum.schoolAdmin))
		)
		.limit(1);

	const totalSubjects = await db
		.select({ count: count() })
		.from(table.subject)
		.where(eq(table.subject.schoolId, schoolId))
		.groupBy(table.subject.schoolId)
		.limit(1);

	return {
		totalStudents: totalStudents[0].count || 0,
		totalTeachers: totalTeachers[0].count || 0,
		totalAdmins: totalAdmins[0].count || 0,
		totalSubjects: totalSubjects[0].count || 0
	};
}

export async function updateSchool(
	schoolId: number,
	name: string,
	emailSuffix: string,
	logoUrl?: string
) {
	const [updatedSchool] = await db
		.update(table.school)
		.set({
			name,
			emailSuffix,
			// drizzle ignores undefined values
			logoUrl: logoUrl || undefined
		})
		.where(eq(table.school.id, schoolId))
		.returning();

	return updatedSchool;
}

export async function getCampusesBySchoolId(schoolId: number) {
	const campuses = await db
		.select()
		.from(table.campus)
		.where(eq(table.campus.schoolId, schoolId))
		.orderBy(asc(table.campus.name));

	return campuses;
}

export async function getSubjectsByUserId(userId: string) {
	const subjects = await db
		.select({ subject: table.subject })
		.from(table.userSubjectOffering)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOffering.id, table.userSubjectOffering.subjectOfferingId)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(eq(table.userSubjectOffering.userId, userId));

	return subjects.map((row) => row.subject);
}

export async function getSubjectsOfferingsUserSubjectOfferingsByUserId(userId: string) {
	const subjectOfferings = await db
		.select({
			subjectOffering: table.subjectOffering,
			subject: table.subject,
			userSubjectOffering: table.userSubjectOffering
		})
		.from(table.userSubjectOffering)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOffering.id, table.userSubjectOffering.subjectOfferingId)
		)
		.innerJoin(table.subject, eq(table.subject.id, table.subjectOffering.subjectId))
		.where(eq(table.userSubjectOffering.userId, userId));

	return subjectOfferings;
}

export async function getSubjectById(subjectId: number) {
	const subject = await db
		.select({ subject: table.subject })
		.from(table.subject)
		.where(eq(table.subject.id, subjectId))
		.limit(1);

	return subject[0]?.subject;
}

export async function getSubjectOfferingsBySubjectId(subjectId: number) {
	const subjectOfferings = await db
		.select({
			subjectOffering: table.subjectOffering,
			subject: {
				id: table.subject.id,
				name: table.subject.name
			}
		})
		.from(table.subjectOffering)
		.innerJoin(table.subject, eq(table.subject.id, table.subjectOffering.subjectId))
		.where(eq(table.subjectOffering.subjectId, subjectId));

	return subjectOfferings; // Returns both subjectOffering and subject data
}

export async function getSubjectThreadsMinimalBySubjectId(subjectOfferingId: number) {
	const threads = await db
		.select({
			thread: {
				id: table.subjectThread.id,
				title: table.subjectThread.title,
				type: table.subjectThread.type,
				createdAt: table.subjectThread.createdAt
			},
			user: {
				firstName: table.user.firstName,
				middleName: table.user.middleName,
				lastName: table.user.lastName,
				avatarUrl: table.user.avatarUrl
			}
		})
		.from(table.subjectThread)
		.innerJoin(table.user, eq(table.user.id, table.subjectThread.userId))
		.where(eq(table.subjectThread.subjectOfferingId, subjectOfferingId))
		.orderBy(desc(table.subjectThread.createdAt));

	return threads;
}

export async function getSubjectThreadById(threadId: number) {
	const threads = await db
		.select({
			thread: table.subjectThread,
			user: {
				firstName: table.user.firstName,
				middleName: table.user.middleName,
				lastName: table.user.lastName,
				avatarUrl: table.user.avatarUrl
			}
		})
		.from(table.subjectThread)
		.innerJoin(table.user, eq(table.user.id, table.subjectThread.userId))
		.where(eq(table.subjectThread.id, threadId))
		.limit(1);

	if (threads.length === 0) {
		return null;
	}

	return threads[0];
}

export async function createSubjectThread(
	type: 'announcement' | 'qanda' | 'discussion' | 'question',
	subjectOfferingId: number,
	userId: string,
	title: string,
	content: string
) {
	const [thread] = await db
		.insert(table.subjectThread)
		.values({
			type: type as table.subjectThreadTypeEnum,
			subjectOfferingId,
			userId,
			title,
			content
		})
		.returning();

	return thread;
}

export async function getSubjectThreadResponsesById(threadId: number) {
	const responses = await db
		.select({
			response: table.subjectThreadResponse,
			user: {
				firstName: table.user.firstName,
				middleName: table.user.middleName,
				lastName: table.user.lastName,
				avatarUrl: table.user.avatarUrl
			}
		})
		.from(table.subjectThreadResponse)
		.innerJoin(table.user, eq(table.user.id, table.subjectThreadResponse.userId))
		.where(eq(table.subjectThreadResponse.subjectThreadId, threadId))
		.orderBy(table.subjectThreadResponse.createdAt);

	return responses;
}

export async function createSubjectThreadResponse(
	type: 'answer' | 'comment',
	subjectThreadId: number,
	userId: string,
	content: string,
	parentResponseId?: number | null
) {
	const [response] = await db
		.insert(table.subjectThreadResponse)
		.values({
			type: type as table.subjectThreadResponseTypeEnum,
			subjectThreadId,
			userId,
			content,
			parentResponseId: parentResponseId || null
		})
		.returning();

	return response;
}

export async function getSubjectClassAllocationByUserId(userId: string) {
	const classAllocation = await db
		.select({
			classAllocation: table.subjectClassAllocation,
			schoolLocation: table.schoolLocation,
			subjectOffering: {
				id: table.subjectOffering.id
			},
			subject: {
				id: table.subject.id,
				name: table.subject.name
			},
			userSubjectOffering: table.userSubjectOffering
		})
		.from(table.userSubjectClass)
		.innerJoin(table.subjectClass, eq(table.userSubjectClass.subjectClassId, table.subjectClass.id))
		.innerJoin(
			table.subjectClassAllocation,
			eq(table.subjectClassAllocation.subjectClassId, table.subjectClass.id)
		)
		.innerJoin(
			table.schoolLocation,
			eq(table.subjectClassAllocation.schoolLocationId, table.schoolLocation.id)
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectClass.subjectOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.innerJoin(
			table.userSubjectOffering,
			and(
				eq(table.userSubjectOffering.subjectOfferingId, table.subjectOffering.id),
				eq(table.userSubjectOffering.userId, userId)
			)
		)
		.where(eq(table.userSubjectClass.userId, userId))
		.orderBy(desc(table.subjectClassAllocation.startTime));

	return classAllocation;
}

export async function getSubjectClassAllocationsByUserIdForToday(userId: string) {
	const today = new Date();
	const todayDayOfWeek = today.getDay();
	const dayOfWeekKeys = [
		'sunday',
		'monday',
		'tuesday',
		'wednesday',
		'thursday',
		'friday',
		'saturday'
	] as const;
	const tableDayOfWeek = table.dayOfWeekEnum[dayOfWeekKeys[todayDayOfWeek]];

	const classAllocation = await db
		.select({
			classAllocation: table.subjectClassAllocation,
			schoolLocation: table.schoolLocation,
			subjectOffering: {
				id: table.subjectOffering.id
			},
			subject: {
				id: table.subject.id,
				name: table.subject.name
			},
			userSubjectOffering: table.userSubjectOffering
		})
		.from(table.userSubjectClass)
		.innerJoin(table.subjectClass, eq(table.userSubjectClass.subjectClassId, table.subjectClass.id))
		.innerJoin(
			table.subjectClassAllocation,
			eq(table.subjectClassAllocation.subjectClassId, table.subjectClass.id)
		)
		.innerJoin(
			table.schoolLocation,
			eq(table.subjectClassAllocation.schoolLocationId, table.schoolLocation.id)
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectClass.subjectOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.innerJoin(
			table.userSubjectOffering,
			and(
				eq(table.userSubjectOffering.subjectOfferingId, table.subjectOffering.id),
				eq(table.userSubjectOffering.userId, userId)
			)
		)
		.where(
			and(
				eq(table.userSubjectClass.userId, userId),
				eq(table.subjectClassAllocation.dayOfWeek, tableDayOfWeek)
			)
		)
		.orderBy(table.subjectClassAllocation.startTime); // Order by start time (earliest first) for today's schedule

	return classAllocation;
}

export async function getClassesForUserInSubjectOffering(
	userId: string,
	subjectOfferingId: number
) {
	const classes = await db
		.select({
			classAllocation: table.subjectClassAllocation,
			schoolLocation: table.schoolLocation
		})
		.from(table.userSubjectClass)
		.innerJoin(table.subjectClass, eq(table.userSubjectClass.subjectClassId, table.subjectClass.id))
		.innerJoin(
			table.subjectClassAllocation,
			eq(table.subjectClassAllocation.subjectClassId, table.subjectClass.id)
		)
		.innerJoin(
			table.schoolLocation,
			eq(table.subjectClassAllocation.schoolLocationId, table.schoolLocation.id)
		)
		.where(
			and(
				eq(table.userSubjectClass.userId, userId),
				eq(table.subjectClass.subjectOfferingId, subjectOfferingId)
			)
		)
		.orderBy(desc(table.subjectClassAllocation.startTime));

	return classes;
}

export async function getRecentAnnouncementsByUserId(userId: string) {
	const oneWeekAgo = new Date();
	oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

	const announcements = await db
		.select({
			announcement: {
				id: table.subjectThread.id,
				title: table.subjectThread.title,
				content: table.subjectThread.content,
				createdAt: table.subjectThread.createdAt
			},
			subject: {
				id: table.subject.id,
				name: table.subject.name
			},
			subjectOffering: {
				id: table.subjectOffering.id
			}
		})
		.from(table.userSubjectOffering)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOffering.id, table.userSubjectOffering.subjectOfferingId)
		)
		.innerJoin(table.subject, eq(table.subject.id, table.subjectOffering.subjectId))
		.innerJoin(
			table.subjectThread,
			and(
				eq(table.subjectThread.subjectOfferingId, table.subjectOffering.id),
				eq(table.subjectThread.type, table.subjectThreadTypeEnum.announcement),
				gte(table.subjectThread.createdAt, oneWeekAgo.toISOString())
			)
		)
		.innerJoin(table.user, eq(table.user.id, table.subjectThread.userId))
		.where(eq(table.userSubjectOffering.userId, userId))
		.orderBy(desc(table.subjectThread.createdAt));

	return announcements;
}

export async function getUserLessonsBySubjectOfferingId(userId: string, subjectOfferingId: number) {
	const lessons = await db
		.select({
			lesson: table.lesson,
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
	dueDate?: Date | null
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
			dueDate
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

// Location related functions:
export async function createLocation(
	campusId: number,
	name: string,
	type: table.schoolLocationTypeEnum,
	capacity?: number | null,
	description?: string | null,
	isActive: boolean = true
) {
	const [location] = await db
		.insert(table.schoolLocation)
		.values({
			campusId,
			name,
			type,
			capacity: capacity || null,
			description: description || null,
			isActive: isActive
		})
		.returning();

	return location;
}

export async function getLocationsByCampusId(campusId: number) {
	const locations = await db
		.select()
		.from(table.schoolLocation)
		.where(
			and(eq(table.schoolLocation.campusId, campusId), eq(table.schoolLocation.isActive, true))
		)
		.orderBy(table.schoolLocation.name);

	return locations;
}

export async function getLocationById(locationId: number) {
	const locations = await db
		.select()
		.from(table.schoolLocation)
		.where(eq(table.schoolLocation.id, locationId))
		.limit(1);

	return locations.length > 0 ? locations[0] : null;
}

export async function updateLocation(
	locationId: number,
	updates: {
		name?: string;
		type?: table.schoolLocationTypeEnum;
		capacity?: number | null;
		description?: string | null;
		isActive?: boolean;
	}
) {
	const [location] = await db
		.update(table.schoolLocation)
		.set(updates)
		.where(eq(table.schoolLocation.id, locationId))
		.returning();

	return location;
}

export async function deleteLocation(locationId: number) {
	// Soft delete by setting isActive to 0
	const [location] = await db
		.update(table.schoolLocation)
		.set({ isActive: false })
		.where(eq(table.schoolLocation.id, locationId))
		.returning();

	return location;
}

export async function getTeachersForUserInSubjectOffering(
	userId: string,
	subjectOfferingId: number
) {
	// First, get all subject class IDs that the user is enrolled in for this subject offering
	const userSubjectClasses = await db
		.select({
			subjectClassId: table.subjectClass.id
		})
		.from(table.userSubjectClass)
		.innerJoin(table.subjectClass, eq(table.userSubjectClass.subjectClassId, table.subjectClass.id))
		.where(
			and(
				eq(table.userSubjectClass.userId, userId),
				eq(table.subjectClass.subjectOfferingId, subjectOfferingId)
			)
		);

	if (userSubjectClasses.length === 0) {
		return [];
	}

	const subjectClassIds = userSubjectClasses.map((usc) => usc.subjectClassId);

	// Now get all unique teachers from those subject classes
	const teachers = await db
		.selectDistinct({
			teacher: {
				id: table.user.id,
				firstName: table.user.firstName,
				middleName: table.user.middleName,
				lastName: table.user.lastName,
				email: table.user.email,
				avatarUrl: table.user.avatarUrl
			}
		})
		.from(table.userSubjectClass)
		.innerJoin(table.user, eq(table.user.id, table.userSubjectClass.userId))
		.where(
			and(
				inArray(table.userSubjectClass.subjectClassId, subjectClassIds),
				eq(table.userSubjectClass.role, table.userSubjectClassRoleEnum.teacher)
			)
		);

	return teachers;
}

export async function createLessonTopic(subjectClassId: number, name: string) {
	// Get the current max index for this subjectClassId
	const maxIndexResult = await db
		.select({ maxIndex: table.lessonTopic.index })
		.from(table.lessonTopic)
		.where(eq(table.lessonTopic.subjectClassId, subjectClassId))
		.orderBy(desc(table.lessonTopic.index))
		.limit(1);

	const nextIndex = (maxIndexResult[0]?.maxIndex ?? -1) + 1;

	const [lessonTopic] = await db
		.insert(table.lessonTopic)
		.values({
			subjectClassId,
			name,
			index: nextIndex
		})
		.returning();

	return lessonTopic;
}

export async function getChatbotChatById(chatId: number) {
	const chats = await db
		.select()
		.from(table.chatbotChat)
		.where(eq(table.chatbotChat.id, chatId))
		.limit(1);

	return chats.length > 0 ? chats[0] : null;
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

export async function getLocationsBySchoolId(schoolId: number) {
	const locations = await db
		.select({
			id: table.schoolLocation.id,
			name: table.schoolLocation.name,
			type: table.schoolLocation.type,
			capacity: table.schoolLocation.capacity,
			description: table.schoolLocation.description,
			isActive: table.schoolLocation.isActive,
			campusName: table.campus.name,
			campusId: table.campus.id
		})
		.from(table.schoolLocation)
		.innerJoin(table.campus, eq(table.schoolLocation.campusId, table.campus.id))
		.where(eq(table.campus.schoolId, schoolId))
		.orderBy(asc(table.campus.name), asc(table.schoolLocation.name));

	return locations;
}

export async function getSubjectsBySchoolId(schoolId: number) {
	const subjects = await db
		.select({
			id: table.subject.id,
			name: table.subject.name,
			description: table.subject.description,
			schoolId: table.subject.schoolId,
			createdAt: table.subject.createdAt,
			updatedAt: table.subject.updatedAt
		})
		.from(table.subject)
		.where(eq(table.subject.schoolId, schoolId))
		.orderBy(asc(table.subject.name));

	return subjects;
}
