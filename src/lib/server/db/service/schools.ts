import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq, and, asc, count, inArray } from 'drizzle-orm';
import { days } from '$lib/utils';
import { schoolSpaceTypeEnum, userTypeEnum, yearLevelEnum } from '$lib/enums.js';

export async function getUsersBySchoolId(schoolId: number, includeArchived: boolean = false) {
	const users = await db
		// Selecting specific user fields to avoid returning sensitive data
		.select({
			id: table.user.id,
			email: table.user.email,
			type: table.user.type,
			firstName: table.user.firstName,
			middleName: table.user.middleName,
			lastName: table.user.lastName,
			yearLevel: table.user.yearLevel,
			avatarUrl: table.user.avatarUrl
		})
		.from(table.user)
		.where(
			includeArchived
				? eq(table.user.schoolId, schoolId)
				: and(eq(table.user.schoolId, schoolId), eq(table.user.isArchived, false))
		)
		.orderBy(asc(table.user.type), asc(table.user.lastName), asc(table.user.firstName));

	return users;
}

export async function getUsersBySchoolIdAndType(
	schoolId: number,
	type: userTypeEnum,
	includeArchived: boolean = false
) {
	const users = await db
		.select({
			id: table.user.id,
			email: table.user.email,
			firstName: table.user.firstName,
			middleName: table.user.middleName,
			lastName: table.user.lastName,
			yearLevel: table.user.yearLevel,
			avatarUrl: table.user.avatarUrl
		})
		.from(table.user)
		.where(
			includeArchived
				? and(eq(table.user.schoolId, schoolId), eq(table.user.type, type))
				: and(
						eq(table.user.schoolId, schoolId),
						eq(table.user.type, type),
						eq(table.user.isArchived, false)
					)
		)
		.orderBy(asc(table.user.lastName), asc(table.user.firstName));

	return users;
}

export async function checkSchoolExistence(name: string): Promise<boolean> {
	const schools = await db.select().from(table.school).where(eq(table.school.name, name)).limit(1);
	return schools.length > 0;
}

export async function getSchoolById(schoolId: number) {
	const schools = await db
		.select()
		.from(table.school)
		.where(eq(table.school.id, schoolId))
		.limit(1);

	return schools.length > 0 ? schools[0] : null;
}

export async function getCampusesByUserId(userId: string) {
	const campuses = await db
		.select({
			campus: table.campus
		})
		.from(table.userCampus)
		.innerJoin(table.campus, eq(table.userCampus.campusId, table.campus.id))
		.where(eq(table.userCampus.userId, userId));

	return campuses.map((row) => row.campus);
}

export async function getSchoolStatsById(schoolId: number) {
	const totalStudents = await db
		.select({ count: count() })
		.from(table.user)
		.where(and(eq(table.user.schoolId, schoolId), eq(table.user.type, userTypeEnum.student)))
		.limit(1);

	const totalTeachers = await db
		.select({ count: count() })
		.from(table.user)
		.where(and(eq(table.user.schoolId, schoolId), eq(table.user.type, userTypeEnum.teacher)))
		.limit(1);

	const totalAdmins = await db
		.select({ count: count() })
		.from(table.user)
		.where(and(eq(table.user.schoolId, schoolId), eq(table.user.type, userTypeEnum.schoolAdmin)))
		.limit(1);

	const totalSubjects = await db
		.select({ count: count() })
		.from(table.subject)
		.where(eq(table.subject.schoolId, schoolId))
		.groupBy(table.subject.schoolId)
		.limit(1);

	return {
		totalStudents: totalStudents[0]?.count || 0,
		totalTeachers: totalTeachers[0]?.count || 0,
		totalAdmins: totalAdmins[0]?.count || 0,
		totalSubjects: totalSubjects[0]?.count || 0
	};
}

export async function createSchool(name: string) {
	const [newSchool] = await db
		.insert(table.school)
		.values({
			name
		})
		.returning();

	return newSchool;
}

export async function updateSchool(schoolId: number, name: string, logoUrl?: string) {
	const [updatedSchool] = await db
		.update(table.school)
		.set({
			name,
			// drizzle ignores undefined values
			logoUrl: logoUrl || undefined
		})
		.where(eq(table.school.id, schoolId))
		.returning();

	return updatedSchool;
}

export async function getCampusesBySchoolId(schoolId: number, includeArchived: boolean = false) {
	const campuses = await db
		.select()
		.from(table.campus)
		.where(
			includeArchived
				? eq(table.campus.schoolId, schoolId)
				: and(eq(table.campus.schoolId, schoolId), eq(table.campus.isArchived, false))
		)
		.orderBy(asc(table.campus.isArchived), asc(table.campus.name));

	return campuses;
}

export async function createCampus(
	schoolId: number,
	name: string,
	address: string,
	description?: string
) {
	const [newCampus] = await db
		.insert(table.campus)
		.values({
			schoolId,
			name,
			address,
			description: description || undefined
		})
		.returning();

	return newCampus;
}

export async function updateCampus(
	campusId: number,
	name: string,
	address: string,
	description?: string
) {
	const [updatedCampus] = await db
		.update(table.campus)
		.set({
			name,
			address,
			description: description || undefined
		})
		.where(eq(table.campus.id, campusId))
		.returning();

	return updatedCampus;
}

export async function archiveCampus(campusId: number) {
	const [archivedCampus] = await db
		.update(table.campus)
		.set({ isArchived: true })
		.where(eq(table.campus.id, campusId))
		.returning();

	return archivedCampus;
}

export async function unarchiveCampus(campusId: number) {
	const [unarchivedCampus] = await db
		.update(table.campus)
		.set({ isArchived: false })
		.where(eq(table.campus.id, campusId))
		.returning();

	return unarchivedCampus;
}

export async function createBuilding(
	campusId: number,
	name: string,
	description?: string | null,
	isArchived: boolean = false
) {
	const [building] = await db
		.insert(table.schoolBuilding)
		.values({
			campusId,
			name,
			description: description || null,
			isArchived
		})
		.returning();

	return building;
}

export async function getBuildingsByCampusId(campusId: number, includeArchived: boolean = false) {
	const buildings = await db
		.select()
		.from(table.schoolBuilding)
		.where(
			includeArchived
				? eq(table.schoolBuilding.campusId, campusId)
				: and(
						eq(table.schoolBuilding.campusId, campusId),
						eq(table.schoolBuilding.isArchived, false)
					)
		)
		.orderBy(asc(table.schoolBuilding.name));

	return buildings;
}

export async function getBuildingsBySchoolId(schoolId: number, includeArchived: boolean = false) {
	const buildings = await db
		.select({
			building: table.schoolBuilding,
			campus: {
				id: table.campus.id,
				name: table.campus.name
			}
		})
		.from(table.campus)
		.innerJoin(table.schoolBuilding, eq(table.schoolBuilding.campusId, table.campus.id))
		.where(
			includeArchived
				? eq(table.campus.schoolId, schoolId)
				: and(
						eq(table.campus.schoolId, schoolId),
						eq(table.schoolBuilding.isArchived, false),
						eq(table.campus.isArchived, false)
					)
		)
		.orderBy(asc(table.campus.name), asc(table.schoolBuilding.name));

	return buildings.map((row) => ({
		...row.building,
		campusName: row.campus.name
	}));
}

export async function createSpace(
	buildingId: number,
	name: string,
	type: schoolSpaceTypeEnum,
	capacity?: number | null,
	description?: string | null,
	isArchived: boolean = false
) {
	const [space] = await db
		.insert(table.schoolSpace)
		.values({
			buildingId,
			name,
			type,
			capacity: capacity || null,
			description: description || null,
			isArchived
		})
		.returning();

	return space;
}

export async function getSpacesBySchoolId(schoolId: number, includeArchived: boolean = false) {
	const spaces = await db
		.select({
			id: table.schoolSpace.id,
			buildingId: table.schoolSpace.buildingId,
			buildingName: table.schoolBuilding.name,
			campusId: table.schoolBuilding.campusId,
			campusName: table.campus.name,
			name: table.schoolSpace.name,
			type: table.schoolSpace.type,
			capacity: table.schoolSpace.capacity,
			description: table.schoolSpace.description,
			isArchived: table.schoolSpace.isArchived,
			createdAt: table.schoolSpace.createdAt,
			updatedAt: table.schoolSpace.updatedAt
		})
		.from(table.campus)
		.innerJoin(table.schoolBuilding, eq(table.schoolBuilding.campusId, table.campus.id))
		.innerJoin(table.schoolSpace, eq(table.schoolSpace.buildingId, table.schoolBuilding.id))
		.where(
			includeArchived
				? eq(table.campus.schoolId, schoolId)
				: and(eq(table.campus.schoolId, schoolId), eq(table.schoolSpace.isArchived, false))
		)
		.orderBy(table.schoolSpace.name);

	return spaces;
}

export async function getSpacesByCampusId(campusId: number, includeArchived: boolean = false) {
	const spaces = await db
		.select({
			space: table.schoolSpace
		})
		.from(table.schoolBuilding)
		.innerJoin(table.schoolSpace, eq(table.schoolSpace.buildingId, table.schoolBuilding.id))
		.where(
			includeArchived
				? eq(table.schoolBuilding.campusId, campusId)
				: and(eq(table.schoolBuilding.campusId, campusId), eq(table.schoolSpace.isArchived, false))
		)
		.orderBy(table.schoolSpace.name);

	return spaces.map((row) => row.space);
}

export async function getSpaceById(spaceId: number, includeArchived: boolean = false) {
	const spaces = await db
		.select()
		.from(table.schoolSpace)
		.where(
			includeArchived
				? eq(table.schoolSpace.id, spaceId)
				: and(eq(table.schoolSpace.id, spaceId), eq(table.schoolSpace.isArchived, false))
		)
		.limit(1);

	return spaces.length > 0 ? spaces[0] : null;
}

export async function updateSpace(
	spaceId: number,
	updates: {
		name?: string;
		type?: schoolSpaceTypeEnum;
		capacity?: number | null;
		description?: string | null;
		isArchived?: boolean;
	}
) {
	const [space] = await db
		.update(table.schoolSpace)
		.set(updates)
		.where(eq(table.schoolSpace.id, spaceId))
		.returning();

	return space;
}

export async function archiveSpace(spaceId: number) {
	const [space] = await db
		.update(table.schoolSpace)
		.set({ isArchived: true })
		.where(eq(table.schoolSpace.id, spaceId))
		.returning();

	return space;
}

export async function getSchoolTimetablesBySchoolId(
	schoolId: number,
	includeArchived: boolean = false
) {
	const timetables = await db
		.select()
		.from(table.timetable)
		.where(
			includeArchived
				? eq(table.timetable.schoolId, schoolId)
				: and(eq(table.timetable.schoolId, schoolId), eq(table.timetable.isArchived, false))
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
	const [activity] = await db.insert(table.timetableActivity).values(data).returning();

	return activity;
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

export async function getSubjectsBySchoolIdAndYearLevel(
	schoolId: number,
	yearLevel: yearLevelEnum
) {
	const subjects = await db
		.select()
		.from(table.subject)
		.where(
			and(
				eq(table.subject.schoolId, schoolId),
				eq(table.subject.yearLevel, yearLevel),
				eq(table.subject.isArchived, false)
			)
		)
		.orderBy(asc(table.subject.name));

	return subjects;
}
