import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { desc, eq, and, gte, lt } from 'drizzle-orm';

export async function getSubjectOfferingClassDetailsById(subjectOfferingClassId: number) {
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

	return subjectOfferingClass?.length ? subjectOfferingClass[0] : null;
}

export async function getSubjectClassAllocationsByUserId(userId: string) {
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
		.where(eq(table.userSubjectOfferingClass.userId, userId))
		.orderBy(desc(table.subjectClassAllocation.startTimestamp));

	return classAllocations;
}

export async function getSubjectClassAllocationsByUserIdForToday(userId: string) {
	const today = new Date();
	const classAllocation = await db
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
				gte(
					table.subjectClassAllocation.startTimestamp,
					new Date(today.getFullYear(), today.getMonth(), today.getDate())
				),
				lt(
					table.subjectClassAllocation.startTimestamp,
					new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
				)
			)
		)
		.orderBy(table.subjectClassAllocation.startTimestamp); // Order by start time (earliest first) for today's schedule

	return classAllocation;
}

export async function getSubjectClassAllocationAndStudentAttendancesByClassIdForToday(
	subjectOfferingClassId: number
) {
	const today = new Date();

	const attendances = await db
		.select({
			attendance: table.subjectClassAllocationAttendance,
			user: {
				id: table.user.id,
				firstName: table.user.firstName,
				middleName: table.user.middleName,
				lastName: table.user.lastName,
				avatarUrl: table.user.avatarUrl
			},
			subjectClassAllocation: {
				id: table.subjectClassAllocation.id
			}
		})
		.from(table.userSubjectOfferingClass)
		.innerJoin(table.user, eq(table.user.id, table.userSubjectOfferingClass.userId))
		.innerJoin(
			table.subjectClassAllocation,
			eq(
				table.subjectClassAllocation.subjectOfferingClassId,
				table.userSubjectOfferingClass.subOffClassId
			)
		)
		.leftJoin(
			table.subjectClassAllocationAttendance,
			and(
				eq(
					table.subjectClassAllocationAttendance.subjectClassAllocationId,
					table.subjectClassAllocation.id
				),
				eq(table.subjectClassAllocationAttendance.userId, table.user.id)
			)
		)
		.where(
			and(
				eq(table.userSubjectOfferingClass.subOffClassId, subjectOfferingClassId),
				gte(
					table.subjectClassAllocation.startTimestamp,
					new Date(today.getFullYear(), today.getMonth(), today.getDate())
				),
				lt(
					table.subjectClassAllocation.startTimestamp,
					new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
				),
				eq(table.userSubjectOfferingClass.role, table.userSubjectOfferingClassRoleEnum.student)
			)
		)
		.orderBy(desc(table.userSubjectOfferingClass.role), table.user.lastName, table.user.firstName);

	return attendances;
}

export async function getClassesForUserInSubjectOffering(
	userId: string,
	subjectOfferingId: number
) {
	const classes = await db
		.select({
			classAllocation: table.subjectClassAllocation,
			schoolSpace: table.schoolSpace
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
		.where(
			and(
				eq(table.userSubjectOfferingClass.userId, userId),
				eq(table.subjectOfferingClass.subOfferingId, subjectOfferingId)
			)
		)
		.orderBy(desc(table.subjectClassAllocation.startTimestamp));

	return classes;
}

export async function getGuardiansChildrensScheduleWithAttendanceByUserId(userId: string) {
	const scheduleWithAttendance = await db
		.select({
			user: {
				id: table.user.id,
				firstName: table.user.firstName,
				middleName: table.user.middleName,
				lastName: table.user.lastName,
				avatarUrl: table.user.avatarUrl
			},
			subjectClassAllocation: {
				id: table.subjectClassAllocation.id,
				startTimestamp: table.subjectClassAllocation.startTimestamp,
				endTimestamp: table.subjectClassAllocation.endTimestamp
			},
			subjectOfferingClass: {
				id: table.subjectOfferingClass.id,
				name: table.subjectOfferingClass.name
			},
			subject: {
				name: table.subject.name
			},
			attendance: table.subjectClassAllocationAttendance
		})
		.from(table.userRelationship)
		.innerJoin(table.user, eq(table.user.id, table.userRelationship.userId))
		.innerJoin(
			table.userSubjectOfferingClass,
			eq(table.userSubjectOfferingClass.userId, table.user.id)
		)
		.innerJoin(
			table.subjectOfferingClass,
			eq(table.userSubjectOfferingClass.subOffClassId, table.subjectOfferingClass.id)
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.innerJoin(
			table.subjectClassAllocation,
			eq(
				table.subjectClassAllocation.subjectOfferingClassId,
				table.userSubjectOfferingClass.subOffClassId
			)
		)
		.leftJoin(
			table.subjectClassAllocationAttendance,
			and(
				eq(
					table.subjectClassAllocationAttendance.subjectClassAllocationId,
					table.subjectClassAllocation.id
				),
				eq(table.subjectClassAllocationAttendance.userId, table.user.id)
			)
		)
		.where(eq(table.userRelationship.relatedUserId, userId))
		.orderBy(table.subjectClassAllocation.startTimestamp);

	return scheduleWithAttendance;
}

export async function getSubjectOfferingClassByAllocationId(allocationId: number) {
	const result = await db
		.select({
			subjectOfferingClass: table.subjectOfferingClass,
			subjectOffering: table.subjectOffering,
			subject: table.subject
		})
		.from(table.subjectClassAllocation)
		.innerJoin(
			table.subjectOfferingClass,
			eq(table.subjectClassAllocation.subjectOfferingClassId, table.subjectOfferingClass.id)
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(eq(table.subjectClassAllocation.id, allocationId))
		.limit(1);

	return result?.length ? result[0] : null;
}
