import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq, and, asc, count } from 'drizzle-orm';
import { days } from '$lib/utils';

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
	type: table.userTypeEnum,
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
	type: table.schoolSpaceTypeEnum,
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
		type?: table.schoolSpaceTypeEnum;
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
		.from(table.schoolTimetable)
		.where(
			includeArchived
				? eq(table.schoolTimetable.schoolId, schoolId)
				: and(
						eq(table.schoolTimetable.schoolId, schoolId),
						eq(table.schoolTimetable.isArchived, false)
					)
		)
		.orderBy(asc(table.schoolTimetable.name));

	return timetables;
}

export async function createSchoolTimetable(data: {
	schoolId: number;
	name: string;
	schoolYear: number;
}) {
	const [timetable] = await db
		.insert(table.schoolTimetable)
		.values({
			schoolId: data.schoolId,
			name: data.name,
			schoolYear: data.schoolYear,
			isArchived: false
		})
		.returning();

	await db.insert(table.schoolTimetableDay).values(
		days.map((day) => ({
			timetableId: timetable.id,
			day: day.number
		}))
	);

	await db.insert(table.schoolTimetablePeriod).values({
		timetableId: timetable.id,
		startTime: '08:30',
		endTime: '09:30'
	});

	return timetable;
}

export async function getTimetableDays(timetableId: number) {
	const days = await db
		.select()
		.from(table.schoolTimetableDay)
		.where(eq(table.schoolTimetableDay.timetableId, timetableId))
		.orderBy(asc(table.schoolTimetableDay.day));

	return days;
}

export async function getTimetablePeriods(timetableId: number) {
	const periods = await db
		.select()
		.from(table.schoolTimetablePeriod)
		.where(eq(table.schoolTimetablePeriod.timetableId, timetableId))
		.orderBy(asc(table.schoolTimetablePeriod.startTime));

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

	await db
		.delete(table.schoolTimetableDay)
		.where(eq(table.schoolTimetableDay.timetableId, timetableId));

	// Insert new days
	if (days.length > 0) {
		await db.insert(table.schoolTimetableDay).values(
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
		.insert(table.schoolTimetablePeriod)
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

	await db.delete(table.schoolTimetablePeriod).where(eq(table.schoolTimetablePeriod.id, periodId));

	return await getTimetablePeriods(timetableId);
}
