import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { desc, eq, and, gte, inArray } from 'drizzle-orm';

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
	type: string,
	subjectOfferingId: number,
	userId: string,
	title: string,
	content: string
) {
	const [thread] = await db
		.insert(table.subjectThread)
		.values({
			type,
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
	type: string,
	subjectThreadId: number,
	userId: string,
	content: string,
	parentResponseId?: number | null
) {
	const [response] = await db
		.insert(table.subjectThreadResponse)
		.values({
			type,
			subjectThreadId,
			userId,
			content,
			parentResponseId: parentResponseId || null
		})
		.returning();

	return response;
}

export async function getSubjectClassTimesAndLocationsByUserId(userId: string) {
	const classTimesAndLocations = await db
		.select({
			classTime: table.subjectClassTime,
			schoolLocation: table.schoolLocation,
			subjectOffering: {
				id: table.subjectOffering.id
			},
			subject: {
				id: table.subject.id,
				name: table.subject.name
			}
		})
		.from(table.userSubjectClass)
		.innerJoin(table.subjectClass, eq(table.userSubjectClass.subjectClassId, table.subjectClass.id))
		.innerJoin(
			table.subjectClassTime,
			eq(table.subjectClassTime.subjectClassId, table.subjectClass.id)
		)
		.innerJoin(
			table.schoolLocation,
			eq(table.subjectClassTime.schoolLocationId, table.schoolLocation.id)
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectClass.subjectOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(eq(table.userSubjectClass.userId, userId))
		.orderBy(desc(table.subjectClassTime.startTime));

	return classTimesAndLocations;
}

export async function getSubjectClassTimesAndLocationsByUserIdForToday(userId: string) {
	// Get today's day of the week in lowercase
	const today = new Date();
	const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
	const todayDayOfWeek = dayNames[today.getDay()];

	const classTimesAndLocations = await db
		.select({
			classTime: table.subjectClassTime,
			schoolLocation: table.schoolLocation,
			subjectOffering: {
				id: table.subjectOffering.id
			},
			subject: {
				id: table.subject.id,
				name: table.subject.name
			}
		})
		.from(table.userSubjectClass)
		.innerJoin(table.subjectClass, eq(table.userSubjectClass.subjectClassId, table.subjectClass.id))
		.innerJoin(
			table.subjectClassTime,
			eq(table.subjectClassTime.subjectClassId, table.subjectClass.id)
		)
		.innerJoin(
			table.schoolLocation,
			eq(table.subjectClassTime.schoolLocationId, table.schoolLocation.id)
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectClass.subjectOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(
			and(
				eq(table.userSubjectClass.userId, userId),
				eq(table.subjectClassTime.dayOfWeek, todayDayOfWeek)
			)
		)
		.orderBy(table.subjectClassTime.startTime); // Order by start time (earliest first) for today's schedule

	return classTimesAndLocations;
}

export async function getClassesForUserInSubjectOffering(
	userId: string,
	subjectOfferingId: number
) {
	const classes = await db
		.select({
			classTime: table.subjectClassTime,
			schoolLocation: table.schoolLocation
		})
		.from(table.userSubjectClass)
		.innerJoin(table.subjectClass, eq(table.userSubjectClass.subjectClassId, table.subjectClass.id))
		.innerJoin(
			table.subjectClassTime,
			eq(table.subjectClassTime.subjectClassId, table.subjectClass.id)
		)
		.innerJoin(
			table.schoolLocation,
			eq(table.subjectClassTime.schoolLocationId, table.schoolLocation.id)
		)
		.where(
			and(
				eq(table.userSubjectClass.userId, userId),
				eq(table.subjectClass.subjectOfferingId, subjectOfferingId)
			)
		)
		.orderBy(desc(table.subjectClassTime.startTime));

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
				eq(table.subjectThread.type, 'announcement'),
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
		.orderBy(desc(table.lesson.createdAt));

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
		.where(eq(table.lessonTopic.subjectClassId, table.subjectClass.id));

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

export async function getLessonSectionById(sectionId: number) {
	const lessonSection = await db
		.select({
			lessonSection: table.lessonSection
		})
		.from(table.lessonSection)
		.where(eq(table.lessonSection.id, sectionId))
		.limit(1);

	return lessonSection?.length ? lessonSection[0].lessonSection : null;
}

export async function getLessonSectionsByLessonId(lessonId: number) {
	const lessonSections = await db
		.select({
			lessonSection: table.lessonSection
		})
		.from(table.lessonSection)
		.where(eq(table.lessonSection.lessonId, lessonId))
		.orderBy(table.lessonSection.index);

	return lessonSections.map((row) => row.lessonSection);
}

export async function getLessonSectionCountByLessonId(lessonId: number) {
	const count = await db.$count(table.lessonSection, eq(table.lessonSection.lessonId, lessonId));

	return count;
}

export async function getLessonBlocksByLessonSectionId(lessonSectionId: number) {
	const lessonBlocks = await db
		.select({
			block: table.lessonSectionBlock
		})
		.from(table.lessonSectionBlock)
		.where(eq(table.lessonSectionBlock.lessonSectionId, lessonSectionId))
		.orderBy(table.lessonSectionBlock.index);

	return lessonBlocks.map((row) => row.block);
}

export async function createLesson(
	title: string,
	description: string,
	lessonStatus: 'draft' | 'published' | 'archived',
	index: number,
	lessonTopicId: number,
	dueDate?: Date | null
) {
	const [lesson] = await db
		.insert(table.lesson)
		.values({
			title,
			description,
			lessonStatus,
			index,
			lessonTopicId,
			dueDate
		})
		.returning();

	await db.insert(table.lessonSection).values({
		lessonId: lesson.id,
		title: 'Default'
	});

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

export async function createLessonSectionBlock(
	lessonSectionId: number,
	type: string,
	content: unknown
) {
	// Get the current max index for this section
	const maxIndexResult = await db
		.select({ index: table.lessonSectionBlock.index })
		.from(table.lessonSectionBlock)
		.where(eq(table.lessonSectionBlock.lessonSectionId, lessonSectionId))
		.orderBy(desc(table.lessonSectionBlock.index))
		.limit(1);

	const nextIndex = (maxIndexResult[0]?.index ?? -1) + 1;

	const [lessonSectionBlock] = await db
		.insert(table.lessonSectionBlock)
		.values({
			lessonSectionId,
			type,
			content,
			index: nextIndex
		})
		.returning();

	return lessonSectionBlock;
}

export async function updateLessonSectionBlock(
	blockId: number,
	updates: {
		content?: unknown;
		type?: string;
	}
) {
	const [lessonSectionBlock] = await db
		.update(table.lessonSectionBlock)
		.set({ ...updates })
		.where(eq(table.lessonSectionBlock.id, blockId))
		.returning();

	return lessonSectionBlock;
}

export async function deleteLessonSectionBlock(blockId: number) {
	await db.delete(table.lessonSectionBlock).where(eq(table.lessonSectionBlock.id, blockId));
}

export async function reorderLessonSectionBlocks(blockOrders: { id: number; order: number }[]) {
	const promises = blockOrders.map(({ id, order }) =>
		db
			.update(table.lessonSectionBlock)
			.set({ index: order })
			.where(eq(table.lessonSectionBlock.id, id))
	);

	await Promise.all(promises);
}

export async function createLessonSection(lessonId: number, title: string) {
	// Get the current max index for this lesson
	const maxIndexResult = await db
		.select({ index: table.lessonSection.index })
		.from(table.lessonSection)
		.where(eq(table.lessonSection.lessonId, lessonId))
		.orderBy(desc(table.lessonSection.index))
		.limit(1);

	const nextIndex = (maxIndexResult[0]?.index ?? -1) + 1;

	const [lessonSection] = await db
		.insert(table.lessonSection)
		.values({
			lessonId,
			title,
			index: nextIndex
		})
		.returning();

	return lessonSection;
}

export async function updateLessonSection(sectionId: number, title: string) {
	const [lessonSection] = await db
		.update(table.lessonSection)
		.set({ title })
		.where(eq(table.lessonSection.id, sectionId))
		.returning();

	return lessonSection;
}

export async function deleteLessonSection(sectionId: number) {
	await db.delete(table.lessonSection).where(eq(table.lessonSection.id, sectionId));
}

// Whiteboard functions
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
	objectType: string;
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
	schoolId: number,
	name: string,
	type: string,
	capacity?: number | null,
	description?: string | null,
	isActive: boolean = true
) {
	const [location] = await db
		.insert(table.schoolLocation)
		.values({
			schoolId,
			name,
			type,
			capacity: capacity || null,
			description: description || null,
			isActive: isActive
		})
		.returning();

	return location;
}

export async function getLocationsBySchoolId(schoolId: number) {
	const locations = await db
		.select()
		.from(table.schoolLocation)
		.where(
			and(eq(table.schoolLocation.schoolId, schoolId), eq(table.schoolLocation.isActive, true))
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
		type?: string;
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

// Reorder lesson sections
export async function reorderLessonSections(sectionOrders: { id: number; order: number }[]) {
	const promises = sectionOrders.map(({ id, order }) =>
		db.update(table.lessonSection).set({ index: order }).where(eq(table.lessonSection.id, id))
	);

	await Promise.all(promises);
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
				eq(table.userSubjectClass.role, 'teacher')
			)
		);

	return teachers;
}
