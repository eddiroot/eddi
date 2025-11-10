import { constraintTypeEnum, queueStatusEnum, userTypeEnum, yearLevelEnum } from '$lib/enums.js';
import type { FETActivity } from '$lib/schema/fet';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { and, asc, count, eq, ilike, inArray, or } from 'drizzle-orm';

// ============================================================================
// TIMETABLE - Core Operations
// ============================================================================
export async function getTimetableByTimetableId(timetableId: number) {
	const [timetable] = await db

		.select()
		.from(table.timetable)
		.where(eq(table.timetable.id, timetableId))
		.limit(1);

	return timetable;
}

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

export async function getTimetableAndSchoolByTimetableId(timetableId: number) {
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

	return timetable;
}

// ============================================================================
// TIMETABLE DAYS - Operations
// ============================================================================

export async function getTimetableDraftDaysByTimetableDraftId(timetableDraftId: number) {
	const days = await db
		.select()
		.from(table.timetableDay)
		.where(eq(table.timetableDay.timetableDraftId, timetableDraftId))
		.orderBy(asc(table.timetableDay.day));

	return days;
}

export async function updateTimetableDraftDaysByTimetableDraftId(
	timetableDraftId: number,
	days: number[]
) {
	if (days.length === 0) {
		throw new Error('At least one day must be selected');
	}

	for (const day of days) {
		if (typeof day !== 'number' || day < 1 || day > 7) {
			throw new Error(`Invalid day: ${day}. Days must be between 1 and 7.`);
		}
	}

	await db
		.delete(table.timetableDay)
		.where(eq(table.timetableDay.timetableDraftId, timetableDraftId));

	// Insert new days
	if (days.length > 0) {
		await db.insert(table.timetableDay).values(
			days.map((day) => ({
				timetableDraftId,
				day
			}))
		);
	}

	return await getTimetableDraftDaysByTimetableDraftId(timetableDraftId);
}

// ============================================================================
// TIMETABLE PERIODS - Operations
// ============================================================================

export async function getTimetableDraftPeriodsByTimetableDraftId(timetableDraftId: number) {
	const periods = await db
		.select()
		.from(table.timetablePeriod)
		.where(eq(table.timetablePeriod.timetableDraftId, timetableDraftId))
		.orderBy(asc(table.timetablePeriod.startTime));

	return periods;
}

export async function addTimetableDraftPeriod(
	timetableDraftId: number,
	startTime: string,
	endTime: string
) {
	const [period] = await db
		.insert(table.timetablePeriod)
		.values({
			timetableDraftId,
			startTime,
			endTime
		})
		.returning();

	return period;
}

export async function deleteTimetableDraftPeriodByPeriodId(periodId: number, timetableId: number) {
	// Check if this is the last period
	const periods = await getTimetableDraftPeriodsByTimetableDraftId(timetableId);
	if (periods.length <= 1) {
		throw new Error('At least one period must exist');
	}

	await db.delete(table.timetablePeriod).where(eq(table.timetablePeriod.id, periodId));

	return await getTimetableDraftPeriodsByTimetableDraftId(timetableId);
}

// ============================================================================
// TIMETABLE DRAFT - Core Operations
// ============================================================================

export async function getTimetableDraftById(timetableDraftId: number) {
	const [timetableDraft] = await db
		.select()
		.from(table.timetableDraft)
		.where(eq(table.timetableDraft.id, timetableDraftId))
		.limit(1);
	return timetableDraft;
}

export async function getTimetableDraftsByTimetableId(timetableId: number) {
	const timetableDrafts = await db
		.select()
		.from(table.timetableDraft)
		.where(eq(table.timetableDraft.timetableId, timetableId))
		.orderBy(asc(table.timetableDraft.createdAt));

	return timetableDrafts;
}

export async function createTimetableDraft(data: { timetableId: number; name: string }) {
	const [draft] = await db
		.insert(table.timetableDraft)
		.values({
			name: data.name,
			timetableId: data.timetableId
		})
		.returning();

	const defaultDays = [1, 2, 3, 4, 5]; // Monday to Friday
	await updateTimetableDraftDaysByTimetableDraftId(draft.id, defaultDays);

	return draft;
}

export async function deleteTimetableDraft(timetableDraftId: number) {
	await db.delete(table.timetableDraft).where(eq(table.timetableDraft.id, timetableDraftId));
}

export async function updateTimetableDraftError(timetableDraftId: number, errorMessage: string) {
	await db
		.update(table.timetableDraft)
		.set({
			errorMessage
		})
		.where(eq(table.timetableDraft.id, timetableDraftId));
}

export async function updateTimetableDraftTranslatedError(
	timetableDraftId: number,
	translatedErrorMessage: string
) {
	const [entry] = await db
		.update(table.timetableDraft)
		.set({ translatedErrorMessage })
		.where(eq(table.timetableDraft.id, timetableDraftId))
		.returning();

	return entry;
}

export async function updateTimetableDraftFetResponse(
	timetableDraftId: number,
	fetResponse: string
) {
	await db
		.update(table.timetableDraft)
		.set({
			fetResponse
		})
		.where(eq(table.timetableDraft.id, timetableDraftId));
}

// ============================================================================
// STUDENT GROUPS - Core Operations
// ============================================================================

export async function getTimetableDraftGroupsByTimetableDraftId(timetableDraftId: number) {
	const groups = await db
		.select()
		.from(table.timetableGroup)
		.where(eq(table.timetableGroup.timetableDraftId, timetableDraftId))
		.orderBy(asc(table.timetableGroup.name));

	return groups;
}

export async function getTimetableDraftStudentGroupsWithCountsByTimetableDraftId(
	timetableDraftId: number
) {
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
		.where(eq(table.timetableGroup.timetableDraftId, timetableDraftId))
		.groupBy(table.timetableGroup.id, table.timetableGroup.name, table.timetableGroup.yearLevel)
		.orderBy(asc(table.timetableGroup.yearLevel), asc(table.timetableGroup.name));
	return groups;
}

/**
 * Get all student groups organized by year level with individual student subgroups
 * for FET timetable generation
 */
export async function getAllStudentGroupsByTimetableDraftId(timetableDraftId: number) {
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
		.where(eq(table.timetableGroup.timetableDraftId, timetableDraftId))
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

export async function createTimetableDraftStudentGroup(
	timetableDraftId: number,
	yearLevel: yearLevelEnum,
	name: string
) {
	const [group] = await db
		.insert(table.timetableGroup)
		.values({
			timetableDraftId,
			yearLevel,
			name
		})
		.returning();

	return group;
}

export async function deleteTimetableDraftStudentGroup(groupId: number) {
	// First, delete all group members
	await db
		.delete(table.timetableGroupMember)
		.where(eq(table.timetableGroupMember.groupId, groupId));

	// Then delete the group itself
	await db.delete(table.timetableGroup).where(eq(table.timetableGroup.id, groupId));
}

// ============================================================================
// STUDENT GROUP MEMBERSHIP - Operations
// ============================================================================

export async function addStudentToTimetableDraftGroup(groupId: number, userId: string) {
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

export async function removeStudentFromTimetableDraftGroup(groupId: number, userId: string) {
	await db
		.delete(table.timetableGroupMember)
		.where(
			and(
				eq(table.timetableGroupMember.groupId, groupId),
				eq(table.timetableGroupMember.userId, userId)
			)
		);
}

export async function assignStudentsToGroupsRandomly(
	timetableDraftId: number,
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
				eq(table.timetableGroup.timetableDraftId, timetableDraftId),
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
			.where(eq(table.timetableGroup.timetableDraftId, timetableDraftId));

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

// ============================================================================
// STUDENTS - Retrieval Operations
// ============================================================================

export async function getStudentsWithGroupsByTimetableDraftId(
	timetableDraftId: number,
	schoolId: number
) {
	const timetable = await db
		.select()
		.from(table.timetable)
		.where(and(eq(table.timetable.id, timetableDraftId), eq(table.timetable.schoolId, schoolId)))
		.limit(1);

	if (timetable.length === 0) {
		throw new Error(
			`Timetable Draft with ID ${timetableDraftId} does not belong to school with ID ${schoolId}`
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
				eq(table.timetableGroup.timetableDraftId, timetableDraftId)
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

// ============================================================================
// TIMETABLE DRAFT ACTIVITIES - Core Operations
// ============================================================================

export async function getTimetableDraftActivitiesByTimetableDraftId(timetableDraftId: number) {
	const activities = await db
		.select()
		.from(table.timetableActivity)
		.where(eq(table.timetableActivity.timetableDraftId, timetableDraftId))
		.orderBy(asc(table.timetableActivity.subjectId));

	return activities;
}

export async function getEnhancedTimetableDraftActivitiesByTimetableDraftId(timetableId: number) {
	const baseActivities = await getTimetableDraftActivitiesByTimetableDraftId(timetableId);

	const activities = await Promise.all(
		baseActivities.map(async (activity) => {
			const [teachers, locations, students, groups, years] = await Promise.all([
				getActivityTeachersByActivityId(activity.id),
				getActivityLocationsByActivityId(activity.id),
				getActivityStudentsByActivityId(activity.id),
				getActivityGroupsByActivityId(activity.id),
				getActivityYearsByActivityId(activity.id)
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

export async function createTimetableDraftActivity(data: {
	timetableDraftId: number;
	subjectId: number;
	teacherId: string;
	groupId: number;
	periodsPerInstance: number;
	totalPeriods: number;
}) {
	await db.insert(table.timetableActivity).values(data).returning();
}

export async function createTimetableDraftActivityWithRelations(data: {
	timetableDraftId: number;
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
		timetableDraftId,
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
			timetableDraftId,
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
			.from(table.timetableDraft)
			.innerJoin(table.timetable, eq(table.timetable.id, table.timetableDraft.timetableId))
			.where(eq(table.timetable.id, timetableDraftId));

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

export async function updateTimetableDraftActivity(
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

export async function deleteTimetableDraftActivity(activityId: number) {
	await db.delete(table.timetableActivity).where(eq(table.timetableActivity.id, activityId));
}

// ============================================================================
// ACTIVITY RELATIONS - Retrieval Operations
// ============================================================================

export async function getActivityTeachersByActivityId(activityId: number) {
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

export async function getActivityLocationsByActivityId(activityId: number) {
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

export async function getActivityStudentsByActivityId(activityId: number) {
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

export async function getActivityGroupsByActivityId(activityId: number) {
	const groups = await db
		.select({
			id: table.timetableGroup.id,
			timetableDraftId: table.timetableGroup.timetableDraftId,
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

export async function getActivityYearsByActivityId(activityId: number) {
	const years = await db
		.select({
			yearLevel: table.timetableActivityAssignedYear.yearlevel
		})
		.from(table.timetableActivityAssignedYear)
		.where(eq(table.timetableActivityAssignedYear.timetableActivityId, activityId))
		.orderBy(asc(table.timetableActivityAssignedYear.yearlevel));

	return years;
}

// ============================================================================
// TIMETABLE QUEUE - Operations
// ============================================================================

export async function createTimetableQueueEntry(
	timetableId: number,
	userId: string,
	fileName: string,
	timetableDraftId: number
) {
	const [entry] = await db
		.insert(table.timetableQueue)
		.values({
			timetableId,
			userId,
			fileName,
			timetableDraftId,
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
			timetableDraftId: table.timetableQueue.timetableDraftId,
			userId: table.timetableQueue.userId,
			fileName: table.timetableQueue.fileName,
			status: table.timetableQueue.status,
			createdAt: table.timetableQueue.createdAt,
			updatedAt: table.timetableQueue.updatedAt,
			errorMessage: table.timetableDraft.errorMessage,
			translatedErrorMessage: table.timetableDraft.translatedErrorMessage,
			fetResponse: table.timetableDraft.fetResponse
		})
		.from(table.timetableQueue)
		.innerJoin(
			table.timetableDraft,
			eq(table.timetableQueue.timetableDraftId, table.timetableDraft.id)
		)
		.where(eq(table.timetableQueue.timetableId, timetableId))
		.orderBy(asc(table.timetableQueue.createdAt));

	return entries;
}

export async function getCompletedDraftsByTimetableId(timetableId: number) {
	const entries = await db
		.select({
			id: table.timetableQueue.id,
			timetableId: table.timetableQueue.timetableId,
			timetableDraftId: table.timetableQueue.timetableDraftId,
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
			timetableDraftId: table.timetableQueue.timetableDraftId,
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

// ============================================================================
// CONSTRAINTS - Core Operations
// ============================================================================

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

// ============================================================================
// TIMETABLE DRAFT CONSTRAINTS - Operations
// ============================================================================

export async function createTimetableDraftConstraint(data: {
	timetableDraftId: number;
	constraintId: number;
	active: boolean;
	parameters: Record<string, unknown>;
}) {
	const [constraint] = await db
		.insert(table.timetableConstraint)
		.values({
			timetableDraftId: data.timetableDraftId,
			constraintId: data.constraintId,
			active: data.active,
			parameters: data.parameters
		})
		.returning();

	return constraint;
}

export async function getAllConstraintsByTimetableDraftId(timetableDraftId: number) {
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
		.where(eq(table.timetableConstraint.timetableDraftId, timetableDraftId))
		.orderBy(asc(table.constraint.FETName));
}

export async function getTimeConstraintsByTimetableDraftId(timetableDraftId: number) {
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
				eq(table.timetableConstraint.timetableDraftId, timetableDraftId),
				eq(table.constraint.type, constraintTypeEnum.time)
			)
		)
		.orderBy(asc(table.constraint.FETName));
}

export async function getSpaceConstraintsByTimetableDraftId(timetableDraftId: number) {
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
				eq(table.timetableConstraint.timetableDraftId, timetableDraftId),
				eq(table.constraint.type, constraintTypeEnum.space)
			)
		)
		.orderBy(asc(table.constraint.FETName));
}

export async function getActiveTimetableDraftConstraintsByTimetableDraftId(
	timetableDraftId: number
) {
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
				eq(table.timetableConstraint.timetableDraftId, timetableDraftId),
				eq(table.timetableConstraint.active, true)
			)
		)
		.orderBy(asc(table.constraint.FETName));
}

export async function deleteTimetableDraftConstraint(
	timetableDraftId: number,
	constraintId: number
) {
	await db
		.delete(table.timetableConstraint)
		.where(
			and(
				eq(table.timetableConstraint.timetableDraftId, timetableDraftId),
				eq(table.timetableConstraint.constraintId, constraintId)
			)
		);
}

export async function updateTimetableDraftConstraintActiveStatus(
	timetableDraftId: number,
	constraintId: number,
	active: boolean
) {
	const result = await db
		.update(table.timetableConstraint)
		.set({ active })
		.where(
			and(
				eq(table.timetableConstraint.timetableDraftId, timetableDraftId),
				eq(table.timetableConstraint.constraintId, constraintId)
			)
		)
		.returning();

	return result[0];
}

// ============================================================================
// FET ACTIVITIES - Operations
// ============================================================================

export async function createTimetableDraftFETActivitiesFromFETExport(
	timetableDraftId: number,
	fetActivities: FETActivity[]
) {
	const activities = fetActivities.map((activity) => ({
		timetableDraftId,
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

export async function getUserFETActivitiesByTimetableDraftId(
	userId: string,
	timetableDraftId: number
) {
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
			and(
				eq(table.userFetActivity.userId, userId),
				eq(table.fetActivity.timetableDraftId, timetableDraftId)
			)
		)
		.orderBy(asc(table.fetActivity.day), asc(table.fetActivity.period));

	return activities;
}

export async function getSpaceFETActivitiesByTimetableDraftId(
	spaceId: number,
	timetableDraftId: number
) {
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
		.where(
			and(
				eq(table.fetActivity.spaceId, spaceId),
				eq(table.fetActivity.timetableDraftId, timetableDraftId)
			)
		)
		.orderBy(asc(table.fetActivity.day), asc(table.fetActivity.period));

	return activities;
}

// ============================================================================
// UTILITY FUNCTIONS - Search & Lookup
// ============================================================================

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
