import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { desc, eq, and, gte, lt, inArray, asc } from 'drizzle-orm';

export async function getSubjectsByUserId(userId: string) {
	const subjects = await db
		.select({ subject: table.subject, subjectOffering: table.subjectOffering })
		.from(table.userSubjectOffering)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOffering.id, table.userSubjectOffering.subOfferingId)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(eq(table.userSubjectOffering.userId, userId));

	return subjects;
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
			eq(table.subjectOffering.id, table.userSubjectOffering.subOfferingId)
		)
		.innerJoin(table.subject, eq(table.subject.id, table.subjectOffering.subjectId))
		.where(eq(table.userSubjectOffering.userId, userId));

	return subjectOfferings;
}

export async function getSubjectOfferingById(subjectOfferingId: number) {
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

	return subjectOffering?.length ? subjectOffering[0] : null;
}

export async function getSubjectById(subjectId: number) {
	const subject = await db
		.select({ subject: table.subject })
		.from(table.subject)
		.where(eq(table.subject.id, subjectId))
		.limit(1);

	return subject[0]?.subject;
}

export async function getSubjectBySubjectOfferingId(subjectOfferingId: number) {
	const [subject] = await db
		.select({
			subject: table.subject
		})
		.from(table.subjectOffering)
		.innerJoin(table.subject, eq(table.subject.id, table.subjectOffering.subjectId))
		.where(eq(table.subjectOffering.id, subjectOfferingId))
		.limit(1);

	return subject ? subject.subject : null;
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
	content: string,
	isArchived: boolean = false
) {
	const [thread] = await db
		.insert(table.subjectThread)
		.values({
			type: type as table.subjectThreadTypeEnum,
			subjectOfferingId,
			userId,
			title,
			content,
			isArchived
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
	parentResponseId?: number | null,
	isArchived: boolean = false
) {
	const [response] = await db
		.insert(table.subjectThreadResponse)
		.values({
			type: type as table.subjectThreadResponseTypeEnum,
			subjectThreadId,
			userId,
			content,
			parentResponseId: parentResponseId || null,
			isArchived
		})
		.returning();

	return response;
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
			eq(table.subjectOffering.id, table.userSubjectOffering.subOfferingId)
		)
		.innerJoin(table.subject, eq(table.subject.id, table.subjectOffering.subjectId))
		.innerJoin(
			table.subjectThread,
			and(
				eq(table.subjectThread.subjectOfferingId, table.subjectOffering.id),
				eq(table.subjectThread.type, table.subjectThreadTypeEnum.announcement),
				gte(table.subjectThread.createdAt, oneWeekAgo)
			)
		)
		.innerJoin(table.user, eq(table.user.id, table.subjectThread.userId))
		.where(eq(table.userSubjectOffering.userId, userId))
		.orderBy(desc(table.subjectThread.createdAt));

	return announcements;
}

export async function getTeachersForSubjectOfferingId(subjectOfferingId: number) {
	const teachers = await db
		.selectDistinct({
			teacher: table.user
		})
		.from(table.userSubjectOfferingClass)
		.innerJoin(table.user, eq(table.user.id, table.userSubjectOfferingClass.userId))
		.innerJoin(
			table.subjectOfferingClass,
			eq(table.userSubjectOfferingClass.subOffClassId, table.subjectOfferingClass.id)
		)
		.where(
			and(
				eq(table.subjectOfferingClass.subOfferingId, subjectOfferingId),
				eq(table.userSubjectOfferingClass.role, table.userSubjectOfferingClassRoleEnum.teacher)
			)
		)
		.orderBy(asc(table.user.lastName), asc(table.user.firstName));

	return teachers;
}

export async function getTeacherBySubjectOfferingIdForUserInClass(
	userId: string,
	subjectOfferingId: number
) {
	// First, get all subject class IDs that the user is enrolled in for this subject offering
	const userSubjectClasses = await db
		.select({
			subjectClassId: table.subjectOfferingClass.id
		})
		.from(table.userSubjectOfferingClass)
		.innerJoin(
			table.subjectOfferingClass,
			eq(table.userSubjectOfferingClass.subOffClassId, table.subjectOfferingClass.id)
		)
		.where(
			and(
				eq(table.userSubjectOfferingClass.userId, userId),
				eq(table.subjectOfferingClass.subOfferingId, subjectOfferingId),
				eq(table.userSubjectOfferingClass.isArchived, false) // Only consider non-archived records
			)
		);

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
		.from(table.userSubjectOfferingClass)
		.innerJoin(table.user, eq(table.user.id, table.userSubjectOfferingClass.userId))
		.where(
			and(
				inArray(table.userSubjectOfferingClass.subOffClassId, subjectClassIds),
				eq(table.userSubjectOfferingClass.role, table.userSubjectOfferingClassRoleEnum.teacher),
				eq(table.userSubjectOfferingClass.isArchived, false) // Only consider non-archived records
			)
		);

	return teachers;
}

export async function getSubjectsBySchoolId(schoolId: number, includeArchived: boolean = false) {
	const subjects = await db
		.select({
			id: table.subject.id,
			name: table.subject.name,
			schoolId: table.subject.schoolId,
			yearLevel: table.subject.yearLevel,
			createdAt: table.subject.createdAt,
			updatedAt: table.subject.updatedAt
		})
		.from(table.subject)
		.where(
			includeArchived
				? eq(table.subject.schoolId, schoolId)
				: and(eq(table.subject.schoolId, schoolId), eq(table.subject.isArchived, false))
		)
		.orderBy(asc(table.subject.yearLevel), asc(table.subject.name));

	return subjects;
}

export async function getClassesByUserId(userId: string) {
	const classes = await db
		.select({
			subjectOfferingClass: table.subjectOfferingClass,
			subjectOffering: table.subjectOffering
		})
		.from(table.userSubjectOfferingClass)
		.innerJoin(
			table.subjectOfferingClass,
			eq(table.userSubjectOfferingClass.subOffClassId, table.subjectOfferingClass.id)
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id)
		)
		.where(eq(table.userSubjectOfferingClass.userId, userId))
		.orderBy(asc(table.subjectOfferingClass.id));

	return classes;
}

export async function getSubjectsWithClassesByUserId(userId: string) {
	// Get all subject offerings for the user
	const userSubjectOfferings = await db
		.select({
			subject: table.subject,
			subjectOffering: table.subjectOffering
		})
		.from(table.userSubjectOffering)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOffering.id, table.userSubjectOffering.subOfferingId)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(eq(table.userSubjectOffering.userId, userId));

	// Get all classes for the user
	const userClasses = await db
		.select({
			subjectOfferingClass: table.subjectOfferingClass,
			subjectOffering: table.subjectOffering,
			subject: table.subject
		})
		.from(table.userSubjectOfferingClass)
		.innerJoin(
			table.subjectOfferingClass,
			eq(table.userSubjectOfferingClass.subOffClassId, table.subjectOfferingClass.id)
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(eq(table.userSubjectOfferingClass.userId, userId))
		.orderBy(asc(table.subjectOfferingClass.id));

	// Group classes by subject offering
	const subjectsWithClasses = userSubjectOfferings.map((subjectOffering) => {
		const classes = userClasses.filter(
			(userClass) => userClass.subjectOffering.id === subjectOffering.subjectOffering.id
		);

		return {
			subject: subjectOffering.subject,
			subjectOffering: subjectOffering.subjectOffering,
			classes: classes.map((cls) => ({
				id: cls.subjectOfferingClass.id,
				name: cls.subjectOfferingClass.name,
				subOfferingId: cls.subjectOfferingClass.subOfferingId
			}))
		};
	});

	return subjectsWithClasses;
}

export async function getClassById(classId: number) {
	const classData = await db
		.select({
			subjectOfferingClass: table.subjectOfferingClass
		})
		.from(table.subjectOfferingClass)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOffering.id, table.subjectOfferingClass.subOfferingId)
		)
		.innerJoin(table.subject, eq(table.subject.id, table.subjectOffering.subjectId))
		.where(eq(table.subjectOfferingClass.id, classId))
		.limit(1);

	return classData[0];
}

export async function getTeachersBySubjectOfferingClassId(subjectOfferingClassId: number) {
	const teachers = await db
		.select({
			teacher: {
				id: table.user.id,
				firstName: table.user.firstName,
				middleName: table.user.middleName,
				lastName: table.user.lastName,
				email: table.user.email,
				avatarUrl: table.user.avatarUrl
			}
		})
		.from(table.userSubjectOfferingClass)
		.innerJoin(table.user, eq(table.user.id, table.userSubjectOfferingClass.userId))
		.where(
			and(
				eq(table.userSubjectOfferingClass.subOffClassId, subjectOfferingClassId),
				eq(table.userSubjectOfferingClass.role, table.userSubjectOfferingClassRoleEnum.teacher)
			)
		);

	return teachers;
}

export async function getTasksBySubjectOfferingId(subjectOfferingId: number) {
	const offeringTasks = await db
		.select({
			subjectOfferingClassTask: table.subjectOfferingClassTask,
			task: table.task,
			courseMapItem: table.courseMapItem
		})
		.from(table.subjectOfferingClassTask)
		.innerJoin(table.task, eq(table.subjectOfferingClassTask.taskId, table.task.id))
		.leftJoin(
			table.courseMapItem,
			eq(table.courseMapItem.id, table.subjectOfferingClassTask.courseMapItemId)
		)
		.where(and(eq(table.courseMapItem.subjectOfferingId, subjectOfferingId)));

	return offeringTasks;
}

export async function getResourcesBySubjectOfferingClassId(subjectOfferingClassId: number) {
	const resources = await db
		.select({
			resource: table.resource,
			resourceRelation: table.subjectOfferingClassResource,
			author: table.user
		})
		.from(table.subjectOfferingClassResource)
		.innerJoin(table.resource, eq(table.resource.id, table.subjectOfferingClassResource.resourceId))
		.innerJoin(table.user, eq(table.user.id, table.subjectOfferingClassResource.authorId))
		.where(
			and(
				eq(table.subjectOfferingClassResource.subjectOfferingClassId, subjectOfferingClassId),
				eq(table.subjectOfferingClassResource.isArchived, false),
				eq(table.resource.isArchived, false)
			)
		)
		.orderBy(table.subjectOfferingClassResource.createdAt);

	return resources;
}

export async function addResourceToSubjectOfferingClass(
	subjectOfferingClassId: number,
	resourceId: number,
	authorId: string,
	title?: string,
	description?: string,
	coursemapItemId?: number
) {
	const [resourceRelation] = await db
		.insert(table.subjectOfferingClassResource)
		.values({
			resourceId,
			subjectOfferingClassId,
			authorId,
			title: title || null,
			description: description || null,
			coursemapItemId: coursemapItemId || null,
			isArchived: false
		})
		.returning();

	return resourceRelation;
}

export async function removeResourceFromSubjectOfferingClass(
	subjectOfferingClassId: number,
	resourceId: number
) {
	await db
		.update(table.subjectOfferingClassResource)
		.set({ isArchived: true })
		.where(
			and(
				eq(table.subjectOfferingClassResource.subjectOfferingClassId, subjectOfferingClassId),
				eq(table.subjectOfferingClassResource.resourceId, resourceId)
			)
		);
}

export async function getAssessmentsBySubjectOfferingClassId(subjectOfferingClassId: number) {
	const assessments = await db
		.select({
			task: table.task
		})
		.from(table.subjectOfferingClassTask)
		.innerJoin(table.task, eq(table.task.id, table.subjectOfferingClassTask.taskId))
		.where(
			and(
				eq(table.subjectOfferingClassTask.subjectOfferingClassId, subjectOfferingClassId),
				eq(table.task.type, table.taskTypeEnum.assessment)
			)
		);

	return assessments;
}

export async function upsertSubjectClassAllocationAttendance(
	subjectClassAllocationId: number,
	userId: string,
	didAttend: boolean,
	attendanceNote?: string | null,
	behaviourNote?: string | null
) {
	const [attendance] = await db
		.insert(table.subjectClassAllocationAttendance)
		.values({
			subjectClassAllocationId,
			userId,
			didAttend,
			attendanceNote,
			behaviourNote
		})
		.onConflictDoUpdate({
			target: [
				table.subjectClassAllocationAttendance.subjectClassAllocationId,
				table.subjectClassAllocationAttendance.userId
			],
			set: {
				didAttend,
				attendanceNote,
				behaviourNote
			}
		})
		.returning();

	return attendance;
}

export async function getSubjectYearLevelBySubjectOfferingId(subjectOfferingId: number) {
	const subject = await db
		.select({
			yearLevel: table.subject.yearLevel
		})
		.from(table.subjectOffering)
		.innerJoin(table.subject, eq(table.subject.id, table.subjectOffering.subjectId))
		.where(eq(table.subjectOffering.id, subjectOfferingId))
		.limit(1);

	return subject[0]?.yearLevel.toString() || null;
}

export async function getSubjectClassAllocationsByUserIdForDate(userId: string, date: Date) {
	const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

	const classAllocations = await db
		.select({
			classAllocation: table.subjectClassAllocation,
			schoolSpace: table.schoolSpace,
			subjectOffering: {
				id: table.subjectOffering.id
			},
			subject: {
				id: table.subject.id,
				name: table.subject.name
			},
			userSubjectOffering: table.userSubjectOffering
		})
		.from(table.userSubjectOfferingClass)
		.innerJoin(
			table.subjectOfferingClass,
			eq(table.userSubjectOfferingClass.subOffClassId, table.subjectOfferingClass.id)
		)
		.innerJoin(
			table.subjectClassAllocation,
			eq(table.subjectClassAllocation.subjectOfferingClassId, table.subjectOfferingClass.id)
		)
		.innerJoin(
			table.schoolSpace,
			eq(table.subjectClassAllocation.schoolSpaceId, table.schoolSpace.id)
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.innerJoin(
			table.userSubjectOffering,
			and(
				eq(table.userSubjectOffering.subOfferingId, table.subjectOffering.id),
				eq(table.userSubjectOffering.userId, userId)
			)
		)
		.where(
			and(
				eq(table.userSubjectOfferingClass.userId, userId),
				gte(table.subjectClassAllocation.startTimestamp, startOfDay),
				lt(table.subjectClassAllocation.startTimestamp, endOfDay)
			)
		)
		.orderBy(table.subjectClassAllocation.startTimestamp);

	return classAllocations;
}
