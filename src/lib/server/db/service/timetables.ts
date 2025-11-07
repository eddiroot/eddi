import { constraintTypeEnum, queueStatusEnum, userTypeEnum, yearLevelEnum } from '$lib/enums.js';
import type { FETActivity } from '$lib/schema/fet';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { days } from '$lib/utils';
import { and, asc, count, eq, ilike, inArray, or } from 'drizzle-orm';

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

export async function getTimetableWithSchool(timetableId: number) {
	const [result] = await db
		.select({
			timetable: table.timetable,
			school: table.school
		})
		.from(table.timetable)
		.innerJoin(table.school, eq(table.timetable.schoolId, table.school.id))
		.where(eq(table.timetable.id, timetableId))
		.limit(1);

	return result;
}

export async function createSchoolTimetable(data: {
	schoolId: number;
	name: string;
	schoolYear: number;
	schoolSemesterId: number;
}) {
	const [timetable] = await db
		.insert(table.timetable)
		.values({
			schoolId: data.schoolId,
			name: data.name,
			schoolYear: data.schoolYear,
			schoolSemesterId: data.schoolSemesterId,
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

/**
 * Get all student groups organized by year level with individual student subgroups
 * for FET timetable generation
 */
export async function getStudentGroupsByTimetableId(timetableId: number) {
	// Get all groups with their members
	const groupsWithMembers = await db
		.select({
			groupId: table.timetableGroup.id,
			groupName: table.timetableGroup.name,
			yearLevel: table.timetableGroup.yearLevel,
			userId: table.timetableGroupMember.userId,
			userFirstName: table.user.firstName,
			userLastName: table.user.lastName
		})
		.from(table.timetableGroup)
		.leftJoin(
			table.timetableGroupMember,
			eq(table.timetableGroup.id, table.timetableGroupMember.groupId)
		)
		.leftJoin(table.user, eq(table.timetableGroupMember.userId, table.user.id))
		.where(eq(table.timetableGroup.timetableId, timetableId))
		.orderBy(
			asc(table.timetableGroup.yearLevel),
			asc(table.timetableGroup.name),
			asc(table.user.firstName)
		);

	// Organize data by year level
	const yearLevelMap = new Map<
		string,
		{
			totalStudents: Set<string>;
			groups: Map<
				number,
				{
					name: string;
					students: Array<{ id: string; name: string }>;
				}
			>;
		}
	>();

	// Process all rows
	for (const row of groupsWithMembers) {
		const yearLevel = row.yearLevel;

		if (!yearLevelMap.has(yearLevel)) {
			yearLevelMap.set(yearLevel, {
				totalStudents: new Set(),
				groups: new Map()
			});
		}

		const yearData = yearLevelMap.get(yearLevel)!;

		// Track group - use group ID as the name for FET
		if (!yearData.groups.has(row.groupId)) {
			yearData.groups.set(row.groupId, {
				name: row.groupId.toString(),
				students: []
			});
		}

		// Track student if present
		if (row.userId) {
			yearData.totalStudents.add(row.userId);
			// Use user ID as the name for FET
			yearData.groups.get(row.groupId)!.students.push({
				id: row.userId,
				name: row.userId
			});
		}
	}

	// Convert to FET-compatible nested structure
	const result = [];

	for (const [yearLevel, data] of yearLevelMap.entries()) {
		// Build groups for this year with their subgroups
		const groupsForYear = Array.from(data.groups.values()).map((group) => ({
			Name: 'G' + group.name,
			Number_of_Students: group.students.length,
			// Only include Subgroup array if there are students
			...(group.students.length > 0 && {
				Subgroup: group.students.map((student) => ({
					Name: 'S' + student.id,
					Number_of_Students: 1
				}))
			})
		}));

		// Add year entry with nested groups
		result.push({
			Name: 'Y' + yearLevel,
			Number_of_Students: data.totalStudents.size,
			...(groupsForYear.length > 0 && { Group: groupsForYear })
		});
	}

	return result;
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

export async function deleteTimetableStudentGroup(groupId: number) {
	// First, delete all group members
	await db
		.delete(table.timetableGroupMember)
		.where(eq(table.timetableGroupMember.groupId, groupId));

	// Then delete the group itself
	await db.delete(table.timetableGroup).where(eq(table.timetableGroup.id, groupId));
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

export async function addStudentToTimetableGroup(groupId: number, userId: string) {
	const [member] = await db
		.insert(table.timetableGroupMember)
		.values({
			groupId,
			userId
		})
		.onConflictDoNothing()
		.returning();

	return member;
}

export async function removeStudentFromTimetableGroup(groupId: number, userId: string) {
	await db
		.delete(table.timetableGroupMember)
		.where(
			and(
				eq(table.timetableGroupMember.groupId, groupId),
				eq(table.timetableGroupMember.userId, userId)
			)
		);
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

export async function getStudentsByGroupId(groupId: number) {
	const students = await db
		.select({
			id: table.user.id,
			email: table.user.email,
			firstName: table.user.firstName,
			middleName: table.user.middleName,
			lastName: table.user.lastName,
			avatarUrl: table.user.avatarUrl,
			yearLevel: table.user.yearLevel
		})
		.from(table.timetableGroupMember)
		.innerJoin(table.user, eq(table.timetableGroupMember.userId, table.user.id))
		.where(eq(table.timetableGroupMember.groupId, groupId))
		.orderBy(asc(table.user.lastName), asc(table.user.firstName));

	return students;
}

export async function getStudentsForTimetable(timetableId: number, schoolId: number) {
	// Verify timetable belongs to school
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

	// Get all students for the school
	const students = await db
		.select({
			id: table.user.id,
			email: table.user.email,
			firstName: table.user.firstName,
			middleName: table.user.middleName,
			lastName: table.user.lastName,
			avatarUrl: table.user.avatarUrl,
			yearLevel: table.user.yearLevel
		})
		.from(table.user)
		.where(
			and(
				eq(table.user.schoolId, schoolId),
				eq(table.user.type, userTypeEnum.student),
				eq(table.user.isArchived, false)
			)
		)
		.orderBy(asc(table.user.yearLevel), asc(table.user.lastName), asc(table.user.firstName));

	return students;
}

// Timetable Activity Functions

export async function getTimetableActivitiesByTimetableId(timetableId: number) {
	const activities = await db
		.select()
		.from(table.timetableActivity)
		.where(eq(table.timetableActivity.timetableId, timetableId))
		.orderBy(asc(table.timetableActivity.subjectId));

	return activities;
}

export async function getEnhancedTimetableActivitiesByTimetableId(timetableId: number) {
	const baseActivities = await getTimetableActivitiesByTimetableId(timetableId);

	const activities = await Promise.all(
		baseActivities.map(async (activity) => {
			const [teachers, locations, students, groups, years] = await Promise.all([
				getTimetableActivityTeachers(activity.id),
				getTimetableActivityLocations(activity.id),
				getTimetableActivityStudents(activity.id),
				getTimetableActivityGroups(activity.id),
				getTimetableActivityYears(activity.id)
			]);

			return {
				...activity,
				teacherIds: teachers.map((t) => t.id),
				locationIds: locations.map((l) => l.id),
				studentIds: students.map((s) => s.id),
				groupIds: groups.map((g) => g.id),
				yearLevels: years.map((y) => y.yearLevel)
			};
		})
	);

	return activities;
}

export async function getTimetableActivityTeachers(activityId: number) {
	const teachers = await db
		.select({
			id: table.user.id,
			email: table.user.email,
			firstName: table.user.firstName,
			middleName: table.user.middleName,
			lastName: table.user.lastName,
			avatarUrl: table.user.avatarUrl
		})
		.from(table.timetableActivityTeacherPreference)
		.innerJoin(table.user, eq(table.timetableActivityTeacherPreference.teacherId, table.user.id))
		.where(eq(table.timetableActivityTeacherPreference.timetableActivityId, activityId))
		.orderBy(asc(table.user.lastName), asc(table.user.firstName));

	return teachers;
}

export async function getTimetableActivityLocations(activityId: number) {
	const locations = await db
		.select({
			id: table.schoolSpace.id,
			buildingId: table.schoolSpace.buildingId,
			name: table.schoolSpace.name,
			type: table.schoolSpace.type,
			capacity: table.schoolSpace.capacity,
			description: table.schoolSpace.description
		})
		.from(table.timetableActivityPreferredSpace)
		.innerJoin(
			table.schoolSpace,
			eq(table.timetableActivityPreferredSpace.schoolSpaceId, table.schoolSpace.id)
		)
		.where(eq(table.timetableActivityPreferredSpace.timetableActivityId, activityId))
		.orderBy(asc(table.schoolSpace.name));

	return locations;
}

export async function getTimetableActivityStudents(activityId: number) {
	const students = await db
		.select({
			id: table.user.id,
			email: table.user.email,
			firstName: table.user.firstName,
			middleName: table.user.middleName,
			lastName: table.user.lastName,
			avatarUrl: table.user.avatarUrl,
			yearLevel: table.user.yearLevel
		})
		.from(table.timetableActivityAssignedStudent)
		.innerJoin(table.user, eq(table.timetableActivityAssignedStudent.userId, table.user.id))
		.where(eq(table.timetableActivityAssignedStudent.timetableActivityId, activityId))
		.orderBy(asc(table.user.lastName), asc(table.user.firstName));

	return students;
}

export async function getTimetableActivityGroups(activityId: number) {
	const groups = await db
		.select({
			id: table.timetableGroup.id,
			timetableId: table.timetableGroup.timetableId,
			yearLevel: table.timetableGroup.yearLevel,
			name: table.timetableGroup.name
		})
		.from(table.timetableActivityAssignedGroup)
		.innerJoin(
			table.timetableGroup,
			eq(table.timetableActivityAssignedGroup.ttGroupId, table.timetableGroup.id)
		)
		.where(eq(table.timetableActivityAssignedGroup.timetableActivityId, activityId))
		.orderBy(asc(table.timetableGroup.yearLevel), asc(table.timetableGroup.name));

	return groups;
}

export async function getTimetableActivityYears(activityId: number) {
	const years = await db
		.select({
			yearLevel: table.timetableActivityAssignedYear.yearlevel
		})
		.from(table.timetableActivityAssignedYear)
		.where(eq(table.timetableActivityAssignedYear.timetableActivityId, activityId))
		.orderBy(asc(table.timetableActivityAssignedYear.yearlevel));

	return years;
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

export async function createTimetableActivityWithRelations(data: {
	timetableId: number;
	subjectId: number;
	teacherIds: string[];
	yearLevels: string[];
	groupIds: number[];
	studentIds: string[];
	preferredSpaceIds: number[];
	periodsPerInstance: number;
	instancesPerWeek: number;
}) {
	const {
		timetableId,
		subjectId,
		teacherIds,
		yearLevels,
		groupIds,
		studentIds,
		preferredSpaceIds,
		periodsPerInstance,
		instancesPerWeek
	} = data;

	// Calculate total periods (instances per week * periods per instance)
	const totalPeriods = instancesPerWeek * periodsPerInstance;

	// If no group is specified, we need to create activities for each assignment level
	// For now, we'll require at least one group to create the base activity
	// If year levels or students are specified without groups, we'll handle them separately

	// Create base activities for each group
	const activityIds: number[] = [];

	const [activity] = await db
		.insert(table.timetableActivity)
		.values({
			timetableId,
			subjectId,
			periodsPerInstance,
			totalPeriods
		})
		.returning();

	activityIds.push(activity.id);

	// Add additional teachers as preferences
	const otherTeacherIds = teacherIds.slice(1);
	if (otherTeacherIds.length > 0) {
		await db.insert(table.timetableActivityTeacherPreference).values(
			otherTeacherIds.map((teacherId) => ({
				timetableActivityId: activity.id,
				teacherId
			}))
		);
	}

	// Add preferred spaces (if none specified, get all spaces for the school)
	let spaceIds = preferredSpaceIds;
	if (spaceIds.length === 0) {
		// Get school ID from timetable
		const [timetableData] = await db
			.select({ schoolId: table.timetable.schoolId })
			.from(table.timetable)
			.where(eq(table.timetable.id, timetableId));

		// Get all spaces for this school by joining through campus and building
		const allSpaces = await db
			.select({ id: table.schoolSpace.id })
			.from(table.campus)
			.innerJoin(table.schoolBuilding, eq(table.schoolBuilding.campusId, table.campus.id))
			.innerJoin(table.schoolSpace, eq(table.schoolSpace.buildingId, table.schoolBuilding.id))
			.where(eq(table.campus.schoolId, timetableData.schoolId));

		spaceIds = allSpaces.map((space) => space.id);
	}

	if (spaceIds.length > 0) {
		await db.insert(table.timetableActivityPreferredSpace).values(
			spaceIds.map((spaceId) => ({
				timetableActivityId: activity.id,
				schoolSpaceId: spaceId
			}))
		);
	}

	if (groupIds.length > 0) {
		await db.insert(table.timetableActivityAssignedGroup).values(
			groupIds.map((ttGroupId) => ({
				timetableActivityId: activity.id,
				ttGroupId
			}))
		);
	}

	// Add assigned students if specified
	if (studentIds.length > 0) {
		await db.insert(table.timetableActivityAssignedStudent).values(
			studentIds.map((userId) => ({
				timetableActivityId: activity.id,
				userId
			}))
		);
	}

	// Add assigned year levels if specified
	if (yearLevels.length > 0) {
		await db.insert(table.timetableActivityAssignedYear).values(
			yearLevels.map((yearlevel) => ({
				timetableActivityId: activity.id,
				yearlevel: yearlevel as yearLevelEnum
			}))
		);
	}

	return activityIds;
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

export async function createTimetableIteration(timetableId: number) {
	const [draft] = await db
		.insert(table.timetableIteration)
		.values({
			timetableId
		})
		.returning();

	return draft;
}

export async function deleteTimetableIteration(ttDraftId: number) {
	await db.delete(table.timetableIteration).where(eq(table.timetableIteration.id, ttDraftId));
}

export async function updateTimetableIterationError(ttDraftId: number, errorMessage: string) {
	await db
		.update(table.timetableIteration)
		.set({
			errorMessage
		})
		.where(eq(table.timetableIteration.id, ttDraftId));
}

export async function updateTimetableIterationFetResponse(ttDraftId: number, fetResponse: string) {
	await db
		.update(table.timetableIteration)
		.set({
			fetResponse
		})
		.where(eq(table.timetableIteration.id, ttDraftId));
}

export async function createTimetableQueueEntry(
	timetableId: number,
	userId: string,
	fileName: string,
	ttDraftId: number
) {
	const [entry] = await db
		.insert(table.timetableQueue)
		.values({
			timetableId,
			userId,
			fileName,
			ttDraftId,
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

export async function getTimetableQueueByTimetableId(timetableId: number) {
	const entries = await db
		.select({
			id: table.timetableQueue.id,
			timetableId: table.timetableQueue.timetableId,
			ttDraftId: table.timetableQueue.ttDraftId,
			userId: table.timetableQueue.userId,
			fileName: table.timetableQueue.fileName,
			status: table.timetableQueue.status,
			createdAt: table.timetableQueue.createdAt,
			updatedAt: table.timetableQueue.updatedAt,
			errorMessage: table.timetableIteration.errorMessage,
			translatedErrorMessage: table.timetableIteration.translatedErrorMessage,
			fetResponse: table.timetableIteration.fetResponse
		})
		.from(table.timetableQueue)
		.innerJoin(
			table.timetableIteration,
			eq(table.timetableQueue.ttDraftId, table.timetableIteration.id)
		)
		.where(eq(table.timetableQueue.timetableId, timetableId))
		.orderBy(asc(table.timetableQueue.createdAt));

	return entries;
}

export async function getCompletedIterationsByTimetableId(timetableId: number) {
	const entries = await db
		.select({
			id: table.timetableQueue.id,
			timetableId: table.timetableQueue.timetableId,
			ttDraftId: table.timetableQueue.ttDraftId,
			userId: table.timetableQueue.userId,
			fileName: table.timetableQueue.fileName,
			status: table.timetableQueue.status,
			createdAt: table.timetableQueue.createdAt,
			updatedAt: table.timetableQueue.updatedAt
		})
		.from(table.timetableQueue)
		.where(
			and(
				eq(table.timetableQueue.timetableId, timetableId),
				eq(table.timetableQueue.status, queueStatusEnum.completed)
			)
		)
		.orderBy(asc(table.timetableQueue.createdAt));

	return entries;
}

export async function getOldestQueuedTimetable() {
	const [entry] = await db
		.select({
			id: table.timetableQueue.id,
			timetableId: table.timetableQueue.timetableId,
			ttDraftId: table.timetableQueue.ttDraftId,
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

export async function updateTimetableIterationTranslatedError(
	ttDraftId: number,
	translatedErrorMessage: string
) {
	const [entry] = await db
		.update(table.timetableIteration)
		.set({ translatedErrorMessage })
		.where(eq(table.timetableIteration.id, ttDraftId))
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

export async function createTimetableConstraint(data: {
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

export async function getUserFETActivitiesByIterationId(userId: string, ttDraftId: number) {
	const activities = await db
		.select({
			id: table.fetActivity.id,
			day: table.fetActivity.day,
			period: table.fetActivity.period,
			duration: table.fetActivity.duration,
			subjectId: table.fetActivity.subjectId,
			subjectName: table.subject.name,
			spaceId: table.fetActivity.spaceId,
			spaceName: table.schoolSpace.name
		})
		.from(table.userFetActivity)
		.innerJoin(table.fetActivity, eq(table.userFetActivity.fetActivityId, table.fetActivity.id))
		.innerJoin(table.subject, eq(table.fetActivity.subjectId, table.subject.id))
		.leftJoin(table.schoolSpace, eq(table.fetActivity.spaceId, table.schoolSpace.id))
		.where(
			and(eq(table.userFetActivity.userId, userId), eq(table.fetActivity.ttDraftId, ttDraftId))
		)
		.orderBy(asc(table.fetActivity.day), asc(table.fetActivity.period));

	return activities;
}

export async function searchUsersBySchoolId(schoolId: number, searchTerm: string, limit = 20) {
	const searchPattern = `%${searchTerm}%`;

	return db
		.select({
			id: table.user.id,
			firstName: table.user.firstName,
			lastName: table.user.lastName,
			email: table.user.email,
			type: table.user.type
		})
		.from(table.user)
		.where(
			and(
				eq(table.user.schoolId, schoolId),
				eq(table.user.isArchived, false),
				or(
					ilike(table.user.firstName, searchPattern),
					ilike(table.user.lastName, searchPattern),
					ilike(table.user.email, searchPattern)
				)
			)
		)
		.limit(limit)
		.orderBy(asc(table.user.lastName), asc(table.user.firstName));
}

export async function getSpacesBySchoolId(schoolId: number) {
	return db
		.select({
			id: table.schoolSpace.id,
			name: table.schoolSpace.name,
			capacity: table.schoolSpace.capacity,
			buildingName: table.schoolBuilding.name
		})
		.from(table.schoolSpace)
		.innerJoin(table.schoolBuilding, eq(table.schoolSpace.buildingId, table.schoolBuilding.id))
		.innerJoin(table.campus, eq(table.schoolBuilding.campusId, table.campus.id))
		.where(eq(table.campus.schoolId, schoolId))
		.orderBy(asc(table.schoolSpace.name));
}

export async function getSpaceFETActivitiesByIterationId(spaceId: number, ttDraftId: number) {
	const activities = await db
		.select({
			id: table.fetActivity.id,
			day: table.fetActivity.day,
			period: table.fetActivity.period,
			duration: table.fetActivity.duration,
			subjectId: table.fetActivity.subjectId,
			subjectName: table.subject.name,
			spaceId: table.fetActivity.spaceId,
			spaceName: table.schoolSpace.name
		})
		.from(table.fetActivity)
		.innerJoin(table.subject, eq(table.fetActivity.subjectId, table.subject.id))
		.leftJoin(table.schoolSpace, eq(table.fetActivity.spaceId, table.schoolSpace.id))
		.where(and(eq(table.fetActivity.spaceId, spaceId), eq(table.fetActivity.ttDraftId, ttDraftId)))
		.orderBy(asc(table.fetActivity.day), asc(table.fetActivity.period));

	return activities;
}
