import { constraintTypeEnum, queueStatusEnum, userTypeEnum, yearLevelEnum } from '$lib/enums.js';
import type { FETActivity } from '$lib/schemas/fetSchema';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { days } from '$lib/utils';
import { and, asc, count, eq, inArray } from 'drizzle-orm';

export async function getSchoolTimetablesBySchoolId(
	schoolId: number,
	includeArchived: boolean = false
) {
	const timetables = await db
		.select()
		.from(table.timetable)
		.where(
			and(
				eq(table.timetable.schoolId, schoolId),
				includeArchived ? undefined : eq(table.timetable.isArchived, false)
			)
		)
		.orderBy(asc(table.timetable.name));

	return timetables;
}

export async function createSchoolTimetable(data: {
	schoolId: number;
	name: string;
	schoolYear: number;
}) {
	const [timetable] = await db
		.insert(table.timetable)
		.values({
			schoolId: data.schoolId,
			name: data.name,
			schoolYear: data.schoolYear,
			isArchived: false
		})
		.returning();

	await db.insert(table.timetableDay).values(
		days.map((day) => ({
			timetableId: timetable.id,
			day: day.number
		}))
	);

	await db.insert(table.timetablePeriod).values({
		timetableId: timetable.id,
		startTime: '08:30',
		endTime: '09:30'
	});

	return timetable;
}

export async function getTimetableDays(timetableId: number) {
	const days = await db
		.select()
		.from(table.timetableDay)
		.where(eq(table.timetableDay.timetableId, timetableId))
		.orderBy(asc(table.timetableDay.day));

	return days;
}

export async function getTimetablePeriods(timetableId: number) {
	const periods = await db
		.select()
		.from(table.timetablePeriod)
		.where(eq(table.timetablePeriod.timetableId, timetableId))
		.orderBy(asc(table.timetablePeriod.startTime));

	return periods;
}

export async function updateTimetableDays(timetableId: number, days: number[]) {
	if (days.length === 0) {
		throw new Error('At least one day must be selected');
	}

	for (const day of days) {
		if (typeof day !== 'number' || day < 1 || day > 7) {
			throw new Error(`Invalid day: ${day}. Days must be between 1 and 7.`);
		}
	}

	await db.delete(table.timetableDay).where(eq(table.timetableDay.timetableId, timetableId));

	// Insert new days
	if (days.length > 0) {
		await db.insert(table.timetableDay).values(
			days.map((day) => ({
				timetableId,
				day
			}))
		);
	}

	return await getTimetableDays(timetableId);
}

export async function addTimetablePeriod(timetableId: number, startTime: string, endTime: string) {
	const [period] = await db
		.insert(table.timetablePeriod)
		.values({
			timetableId,
			startTime,
			endTime
		})
		.returning();

	return period;
}

export async function deleteTimetablePeriod(periodId: number, timetableId: number) {
	// Check if this is the last period
	const periods = await getTimetablePeriods(timetableId);
	if (periods.length <= 1) {
		throw new Error('At least one period must exist');
	}

	await db.delete(table.timetablePeriod).where(eq(table.timetablePeriod.id, periodId));

	return await getTimetablePeriods(timetableId);
}

export async function getTimetableStudentGroupsByTimetableId(timetableId: number) {
	const groups = await db
		.select()
		.from(table.timetableGroup)
		.where(eq(table.timetableGroup.timetableId, timetableId))
		.orderBy(asc(table.timetableGroup.name));

	return groups;
}

export async function getTimetableStudentGroupsWithCountsByTimetableId(timetableId: number) {
	const groups = await db
		.select({
			id: table.timetableGroup.id,
			name: table.timetableGroup.name,
			yearLevel: table.timetableGroup.yearLevel,
			count: count(table.timetableGroupMember.userId)
		})
		.from(table.timetableGroup)
		.leftJoin(
			table.timetableGroupMember,
			eq(table.timetableGroup.id, table.timetableGroupMember.groupId)
		)
		.where(eq(table.timetableGroup.timetableId, timetableId))
		.groupBy(table.timetableGroup.id, table.timetableGroup.name, table.timetableGroup.yearLevel)
		.orderBy(asc(table.timetableGroup.yearLevel), asc(table.timetableGroup.name));
	return groups;
}

export async function createTimetableStudentGroup(
	timetableId: number,
	yearLevel: yearLevelEnum,
	name: string
) {
	const [group] = await db
		.insert(table.timetableGroup)
		.values({
			timetableId,
			yearLevel,
			name
		})
		.returning();

	return group;
}

export async function assignStudentsToGroupsRandomly(
	timetableId: number,
	yearLevel: yearLevelEnum,
	schoolId: number
) {
	// Get all students for this year level
	const students = await db
		.select({
			id: table.user.id
		})
		.from(table.user)
		.where(
			and(
				eq(table.user.schoolId, schoolId),
				eq(table.user.type, userTypeEnum.student),
				eq(table.user.yearLevel, yearLevel),
				eq(table.user.isArchived, false)
			)
		);

	// Get all groups for this year level and timetable
	const groups = await db
		.select()
		.from(table.timetableGroup)
		.where(
			and(
				eq(table.timetableGroup.timetableId, timetableId),
				eq(table.timetableGroup.yearLevel, yearLevel)
			)
		);

	if (groups.length === 0) {
		throw new Error('No groups found for this year level');
	}

	// Remove existing assignments for these students
	const studentIds = students.map((s) => s.id);
	if (studentIds.length > 0) {
		const existingGroupIds = await db
			.select({ id: table.timetableGroup.id })
			.from(table.timetableGroup)
			.where(eq(table.timetableGroup.timetableId, timetableId));

		if (existingGroupIds.length > 0) {
			await db.delete(table.timetableGroupMember).where(
				and(
					inArray(table.timetableGroupMember.userId, studentIds),
					inArray(
						table.timetableGroupMember.groupId,
						existingGroupIds.map((g) => g.id)
					)
				)
			);
		}
	}

	// Shuffle students array
	const shuffledStudents = [...students].sort(() => Math.random() - 0.5);

	// Assign students to groups in round-robin fashion
	const assignments = shuffledStudents.map((student, index) => ({
		userId: student.id,
		groupId: groups[index % groups.length].id
	}));

	// Insert new assignments
	if (assignments.length > 0) {
		await db.insert(table.timetableGroupMember).values(assignments);
	}

	return assignments.length;
}

export async function getStudentsWithGroupsByTimetableId(timetableId: number, schoolId: number) {
	const timetable = await db
		.select()
		.from(table.timetable)
		.where(and(eq(table.timetable.id, timetableId), eq(table.timetable.schoolId, schoolId)))
		.limit(1);

	if (timetable.length === 0) {
		throw new Error(
			`Timetable with ID ${timetableId} does not belong to school with ID ${schoolId}`
		);
	}

	const students = await db
		.select({
			id: table.user.id,
			email: table.user.email,
			firstName: table.user.firstName,
			middleName: table.user.middleName,
			lastName: table.user.lastName,
			avatarUrl: table.user.avatarUrl,
			yearLevel: table.user.yearLevel,
			groupId: table.timetableGroup.id,
			groupName: table.timetableGroup.name
		})
		.from(table.user)
		.leftJoin(table.timetableGroupMember, eq(table.user.id, table.timetableGroupMember.userId))
		.leftJoin(
			table.timetableGroup,
			and(
				eq(table.timetableGroupMember.groupId, table.timetableGroup.id),
				eq(table.timetableGroup.timetableId, timetableId)
			)
		)
		.where(
			and(
				eq(table.user.schoolId, schoolId),
				eq(table.user.type, userTypeEnum.student),
				eq(table.user.isArchived, false)
			)
		)
		.orderBy(
			asc(table.timetableGroup.name),
			asc(table.user.lastName),
			asc(table.user.middleName),
			asc(table.user.firstName)
		);

	return students;
}

// Timetable Activity Functions

export async function getTimetableActivitiesByTimetableId(timetableId: number) {
	const activities = await db
		.select({
			activity: table.timetableActivity,
			subject: table.subject,
			teacher: {
				id: table.user.id,
				firstName: table.user.firstName,
				middleName: table.user.middleName,
				lastName: table.user.lastName
			},
			studentGroup: table.timetableGroup
		})
		.from(table.timetableActivity)
		.innerJoin(table.subject, eq(table.timetableActivity.subjectId, table.subject.id))
		.innerJoin(table.user, eq(table.timetableActivity.teacherId, table.user.id))
		.innerJoin(table.timetableGroup, eq(table.timetableActivity.groupId, table.timetableGroup.id))
		.where(eq(table.timetableActivity.timetableId, timetableId))
		.orderBy(
			asc(table.timetableGroup.yearLevel),
			asc(table.subject.name),
			asc(table.timetableGroup.name)
		);

	return activities;
}

export async function createTimetableActivity(data: {
	timetableId: number;
	subjectId: number;
	teacherId: string;
	groupId: number;
	periodsPerInstance: number;
	totalPeriods: number;
}) {
	await db.insert(table.timetableActivity).values(data).returning();
}

export async function deleteTimetableActivitiesByGroupId(groupId: number) {
	await db.delete(table.timetableActivity).where(eq(table.timetableActivity.groupId, groupId));
}

export async function updateTimetableActivity(
	activityId: number,
	data: {
		periodsPerInstance?: number;
		totalPeriods?: number;
		teacherId?: string;
	}
) {
	const [activity] = await db
		.update(table.timetableActivity)
		.set(data)
		.where(eq(table.timetableActivity.id, activityId))
		.returning();

	return activity;
}

export async function deleteTimetableActivity(activityId: number) {
	await db.delete(table.timetableActivity).where(eq(table.timetableActivity.id, activityId));
}

export async function createTimetableQueueEntry(
	timetableId: number,
	userId: string,
	fileName: string
) {
	const [entry] = await db
		.insert(table.timetableQueue)
		.values({
			timetableId,
			userId,
			fileName,
			status: queueStatusEnum.queued
		})
		.returning();

	return entry;
}

export async function getInProgressTimetableQueues() {
	const entries = await db
		.select()
		.from(table.timetableQueue)
		.where(eq(table.timetableQueue.status, queueStatusEnum.inProgress));

	return entries;
}

export async function getOldestQueuedTimetable() {
	const [entry] = await db
		.select({
			id: table.timetableQueue.id,
			timetableId: table.timetableQueue.timetableId,
			userId: table.timetableQueue.userId,
			fileName: table.timetableQueue.fileName,
			status: table.timetableQueue.status,
			createdAt: table.timetableQueue.createdAt,
			timetable: table.timetable,
			school: table.school
		})
		.from(table.timetableQueue)
		.innerJoin(table.timetable, eq(table.timetableQueue.timetableId, table.timetable.id))
		.innerJoin(table.school, eq(table.timetable.schoolId, table.school.id))
		.where(eq(table.timetableQueue.status, queueStatusEnum.queued))
		.orderBy(asc(table.timetableQueue.createdAt))
		.limit(1);

	return entry;
}

export async function updateTimetableQueueStatus(
	queueId: number,
	status: queueStatusEnum,
	completedAt?: Date
) {
	const updateData: { status: queueStatusEnum; updatedAt?: Date } = { status };
	if (completedAt) {
		updateData.updatedAt = completedAt;
	}

	const [entry] = await db
		.update(table.timetableQueue)
		.set(updateData)
		.where(eq(table.timetableQueue.id, queueId))
		.returning();

	return entry;
}

export async function createTimetableFETActivitiesFromFETExport(
	timetableId: number,
	fetActivities: FETActivity[]
) {
	const activities = fetActivities.map((activity) => ({
		timetableId,
		subjectId: activity.Subject,
		teacherId: activity.Teacher,
		groupId: activity.Students,
		spaceId: activity.Room,
		day: activity.Day,
		period: activity.Period,
		duration: activity.Duration
	}));

	await db.insert(table.fetActivity).values(activities);
}

export async function createConstraint(data: {
	FETName: string;
	friendlyName: string;
	description: string;
	type: constraintTypeEnum;
	optional: boolean;
	repeatable: boolean;
}) {
	const [constraint] = await db
		.insert(table.constraint)
		.values({
			FETName: data.FETName,
			friendlyName: data.friendlyName,
			description: data.description,
			type: data.type,
			optional: data.optional,
			repeatable: data.repeatable
		})
		.returning();

	return constraint;
}

export async function createTimetableConstriant(data: {
	timetableId: number;
	constraintId: number;
	active: boolean;
	parameters: Record<string, unknown>;
}) {
	const [constraint] = await db
		.insert(table.timetableConstraint)
		.values({
			timetableId: data.timetableId,
			constraintId: data.constraintId,
			active: data.active,
			parameters: data.parameters
		})
		.returning();

	return constraint;
}

export async function getAllConstraintsByTimetableId(timetableId: number) {
	return db
		.select({
			id: table.constraint.id,
			FETName: table.constraint.FETName,
			friendlyName: table.constraint.friendlyName,
			description: table.constraint.description,
			type: table.constraint.type,
			active: table.timetableConstraint.active,
			optional: table.constraint.optional,
			repeatable: table.constraint.repeatable,
			parameters: table.timetableConstraint.parameters,
			createdAt: table.timetableConstraint.createdAt,
			updatedAt: table.timetableConstraint.updatedAt
		})
		.from(table.timetableConstraint)
		.innerJoin(table.constraint, eq(table.timetableConstraint.constraintId, table.constraint.id))
		.where(eq(table.timetableConstraint.timetableId, timetableId))
		.orderBy(asc(table.constraint.FETName));
}

export async function getTimeConstraintsByTimetableId(timetableId: number) {
	return db
		.select({
			id: table.constraint.id,
			FETName: table.constraint.FETName,
			friendlyName: table.constraint.friendlyName,
			description: table.constraint.description,
			type: table.constraint.type,
			active: table.timetableConstraint.active,
			parameters: table.timetableConstraint.parameters
		})
		.from(table.timetableConstraint)
		.innerJoin(table.constraint, eq(table.timetableConstraint.constraintId, table.constraint.id))
		.where(
			and(
				eq(table.timetableConstraint.timetableId, timetableId),
				eq(table.constraint.type, constraintTypeEnum.time)
			)
		)
		.orderBy(asc(table.constraint.FETName));
}

export async function getSpaceConstraintsByTimetableId(timetableId: number) {
	return db
		.select({
			id: table.constraint.id,
			FETName: table.constraint.FETName,
			friendlyName: table.constraint.friendlyName,
			description: table.constraint.description,
			type: table.constraint.type,
			active: table.timetableConstraint.active,
			parameters: table.timetableConstraint.parameters
		})
		.from(table.timetableConstraint)
		.innerJoin(table.constraint, eq(table.timetableConstraint.constraintId, table.constraint.id))
		.where(
			and(
				eq(table.timetableConstraint.timetableId, timetableId),
				eq(table.constraint.type, constraintTypeEnum.space)
			)
		)
		.orderBy(asc(table.constraint.FETName));
}

export async function getActiveTimetableConstraintsForTimetable(timetableId: number) {
	return db
		.select({
			id: table.constraint.id,
			FETName: table.constraint.FETName,
			friendlyName: table.constraint.friendlyName,
			description: table.constraint.description,
			type: table.constraint.type,
			active: table.timetableConstraint.active,
			parameters: table.timetableConstraint.parameters
		})
		.from(table.timetableConstraint)
		.innerJoin(table.constraint, eq(table.timetableConstraint.constraintId, table.constraint.id))
		.where(
			and(
				eq(table.timetableConstraint.timetableId, timetableId),
				eq(table.timetableConstraint.active, true)
			)
		)
		.orderBy(asc(table.constraint.FETName));
}

export async function getAllConstraints() {
	const constraints = await db
		.select()
		.from(table.constraint)
		.orderBy(asc(table.constraint.FETName));

	return constraints;
}

export async function getConstraintById(constraintId: number) {
	const [constraint] = await db
		.select()
		.from(table.constraint)
		.where(eq(table.constraint.id, constraintId))
		.limit(1);

	return constraint;
}

export async function deleteTimetableConstraint(timetableId: number, constraintId: number) {
	await db
		.delete(table.timetableConstraint)
		.where(
			and(
				eq(table.timetableConstraint.timetableId, timetableId),
				eq(table.timetableConstraint.constraintId, constraintId)
			)
		);
}

export async function updateTimetableConstraintActiveStatus(
	timetableId: number, 
	constraintId: number, 
	active: boolean
) {
	const result = await db
		.update(table.timetableConstraint)
		.set({ active })
		.where(
			and(
				eq(table.timetableConstraint.timetableId, timetableId),
				eq(table.timetableConstraint.constraintId, constraintId)
			)
		)
		.returning();

	return result[0];
}
