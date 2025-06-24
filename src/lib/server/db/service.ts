import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { desc, eq, and, gte } from 'drizzle-orm';

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

export async function getSubjectClassTimesByUserId(userId: string) {
	const classTimesAndLocations = await db
		.select({
			classLocation: table.subjectClassLocation,
			classTime: table.subjectClassTime,
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
			table.subjectClassLocation,
			eq(table.subjectClass.locationId, table.subjectClassLocation.id)
		)
		.innerJoin(
			table.subjectClassTime,
			eq(table.subjectClassTime.subjectClassId, table.subjectClass.id)
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
	const lessons = await db
		.select({
			lesson: table.lesson
		})
		.from(table.lesson)
		.where(eq(table.lesson.id, lessonId))
		.limit(1);

	return lessons.length > 0 ? lessons[0] : null;
}

export async function createLesson(
	title: string,
	description: string,
	lessonStatus: 'draft' | 'published' | 'archived',
	subjectWeek: number,
	lessonTopicId: number,
	dueDate?: Date | null
) {
	const [lesson] = await db
		.insert(table.lesson)
		.values({
			title,
			description,
			lessonStatus,
			subjectWeek,
			lessonTopicId,
			dueDate
		})
		.returning();

	return lesson;
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
		.insert(table.subjectClassLocation)
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
		.from(table.subjectClassLocation)
		.where(
			and(
				eq(table.subjectClassLocation.schoolId, schoolId),
				eq(table.subjectClassLocation.isActive, true)
			)
		)
		.orderBy(table.subjectClassLocation.name);

	return locations;
}

export async function getLocationById(locationId: number) {
	const locations = await db
		.select()
		.from(table.subjectClassLocation)
		.where(eq(table.subjectClassLocation.id, locationId))
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
		.update(table.subjectClassLocation)
		.set(updates)
		.where(eq(table.subjectClassLocation.id, locationId))
		.returning();

	return location;
}

export async function deleteLocation(locationId: number) {
	// Soft delete by setting isActive to 0
	const [location] = await db
		.update(table.subjectClassLocation)
		.set({ isActive: false })
		.where(eq(table.subjectClassLocation.id, locationId))
		.returning();

	return location;
}

export async function getClassLocationsForUser(userId: string) {
	const classLocations = await db
		.select({
			subjectClass: {
				id: table.subjectClass.id
			},
			location: table.subjectClassLocation,
			subject: {
				id: table.subject.id,
				name: table.subject.name
			},
			subjectOffering: {
				id: table.subjectOffering.id,
				year: table.subjectOffering.year
			}
		})
		.from(table.userSubjectClass)
		.innerJoin(table.subjectClass, eq(table.userSubjectClass.subjectClassId, table.subjectClass.id))
		.leftJoin(
			table.subjectClassLocation,
			eq(table.subjectClass.locationId, table.subjectClassLocation.id)
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectClass.subjectOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(eq(table.userSubjectClass.userId, userId))
		.orderBy(table.subject.name, table.subjectClassLocation.name);

	return classLocations;
}
