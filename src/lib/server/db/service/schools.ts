import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq, and, asc, count } from 'drizzle-orm';

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

/* Location related functions
 * These functions manage school locations, which can be classrooms, labs, etc.
 * Locations are associated with a campus and can be archived.
 */

export async function createLocation(
	campusId: number,
	name: string,
	type: table.schoolLocationTypeEnum,
	capacity?: number | null,
	description?: string | null,
	isArchived: boolean = false
) {
	const [location] = await db
		.insert(table.schoolLocation)
		.values({
			campusId,
			name,
			type,
			capacity: capacity || null,
			description: description || null,
			isArchived
		})
		.returning();

	return location;
}

export async function getLocationsByCampusId(campusId: number, includeArchived: boolean = false) {
	const locations = await db
		.select()
		.from(table.schoolLocation)
		.where(
			includeArchived
				? eq(table.schoolLocation.campusId, campusId)
				: and(
						eq(table.schoolLocation.campusId, campusId),
						eq(table.schoolLocation.isArchived, false)
					)
		)
		.orderBy(table.schoolLocation.name);

	return locations;
}

export async function getLocationById(locationId: number, includeArchived: boolean = false) {
	const locations = await db
		.select()
		.from(table.schoolLocation)
		.where(
			includeArchived
				? eq(table.schoolLocation.id, locationId)
				: and(eq(table.schoolLocation.id, locationId), eq(table.schoolLocation.isArchived, false))
		)
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
		isArchived?: boolean;
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
	// Soft delete by setting isArchived to true
	const [location] = await db
		.update(table.schoolLocation)
		.set({ isArchived: true })
		.where(eq(table.schoolLocation.id, locationId))
		.returning();

	return location;
}

export async function getLocationsBySchoolId(schoolId: number) {
	const locations = await db
		.select({
			id: table.schoolLocation.id,
			name: table.schoolLocation.name,
			type: table.schoolLocation.type,
			capacity: table.schoolLocation.capacity,
			description: table.schoolLocation.description,
			isArchived: table.schoolLocation.isArchived,
			campusName: table.campus.name,
			campusId: table.campus.id
		})
		.from(table.schoolLocation)
		.innerJoin(table.campus, eq(table.schoolLocation.campusId, table.campus.id))
		.where(eq(table.campus.schoolId, schoolId))
		.orderBy(asc(table.campus.name), asc(table.schoolLocation.name));

	return locations;
}
