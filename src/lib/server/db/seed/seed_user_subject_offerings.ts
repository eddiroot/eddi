import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../schema';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import seedrandom from 'seedrandom';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

// Verify schema imports
console.log('Schema userCampus:', schema.userCampus);
console.log('Schema userSubjectOffering:', schema.userSubjectOffering);

// Create a seeded random number generator
const rng = seedrandom('myconsistentseed');

/**
 * Gets the campus ID for a user
 * @param userId - The user's ID
 * @returns The user's campus ID or null if not found
 */
async function getUserCampusId(userId: string): Promise<number | null> {
	try {
		// Use a more explicit query structure
		const result = await db.query.userCampus.findFirst({
			where: eq(schema.userCampus.userId, userId),
			columns: {
				campusId: true
			}
		});

		return result?.campusId ?? null;
	} catch (error) {
		console.error(`Error getting campus for user ${userId}:`, error);
		// Fallback to direct SQL query if needed
		try {
			const fallbackResult = await client`
				SELECT campus_id FROM user_campus WHERE user_id = ${userId} LIMIT 1
			`;
			return fallbackResult.length > 0 ? fallbackResult[0].campus_id : null;
		} catch (fallbackError) {
			console.error(`Fallback query also failed:`, fallbackError);
			return null;
		}
	}
}

/**
 * Assigns each student to 5 deterministic subject offerings from their campus
 * @param students - Array of student users
 * @param subjectOfferings - Array of available subject offerings
 * @returns Array of created userSubjectOffering records
 */
export async function assignStudentsToSubjectOfferings(
	students: schema.User[],
	subjectOfferings: schema.SubjectOffering[]
) {
	console.log(`Assigning ${students.length} students to subject offerings...`);

	const userSubjectOfferingsToCreate = [];

	for (let i = 0; i < students.length; i++) {
		console.log('seeding for student', students[i].id);
		const student = students[i];

		// Get the student's campus ID
		const userCampusId = await getUserCampusId(student.id);
		if (!userCampusId) {
			console.warn(`No campus found for student ${student.id}, skipping...`);
			continue;
		}

		// Filter subject offerings to only those on the student's campus
		const campusSubjectOfferings = subjectOfferings.filter(
			(offering) => offering.campusId === userCampusId
		);

		if (campusSubjectOfferings.length === 0) {
			console.warn(
				`No subject offerings found for campus ${userCampusId} for student ${student.id}, skipping...`
			);
			continue;
		}

		const sbjtOffs = [...campusSubjectOfferings];
		const selectedOfferings = [];

		// Select up to 5 offerings, or all available if fewer than 5
		const numberOfOfferings = Math.min(5, sbjtOffs.length);

		for (let j = 0; j < numberOfOfferings; j++) {
			const randOfferingIndex = Math.floor(rng() * sbjtOffs.length);
			const offering = sbjtOffs[randOfferingIndex];

			sbjtOffs.splice(randOfferingIndex, 1);

			selectedOfferings.push(offering);
			console.log(offering);
		}

		for (let k = 0; k < selectedOfferings.length; k++) {
			const offering = selectedOfferings[k];
			userSubjectOfferingsToCreate.push({
				userId: student.id,
				subjectOfferingId: offering.id,
				role: schema.userSubjectOfferingRoleEnum.student,
				isComplete: 0,
				isArchived: 0,
				color: (i * 50 + k * 30) % 360 // Deterministic color based on student and offering index
			});
		}
	}

	const createdUserSubjectOfferings = await db
		.insert(schema.userSubjectOffering)
		.values(userSubjectOfferingsToCreate)
		.returning();

	console.log(`Created ${createdUserSubjectOfferings.length} student-subject assignments`);
	return createdUserSubjectOfferings.filter(
		(uso) => uso.role === schema.userSubjectOfferingRoleEnum.student
	);
}

/**
 * Assigns each teacher to up to 5 deterministic subject offerings from their campus
 * @param teachers - Array of teacher users
 * @param subjectOfferings - Array of available subject offerings
 * @returns Array of created userSubjectOffering records
 */
export async function assignTeachersToSubjectOfferings(
	teachers: schema.User[],
	subjectOfferings: schema.SubjectOffering[]
) {
	console.log(`Assigning ${teachers.length} teachers to subject offerings...`);

	const userSubjectOfferingsToCreate = [];

	for (let i = 0; i < teachers.length; i++) {
		const teacher = teachers[i];

		// Get the teacher's campus ID
		const userCampusId = await getUserCampusId(teacher.id);
		if (!userCampusId) {
			console.warn(`No campus found for teacher ${teacher.id}, skipping...`);
			continue;
		}

		// Filter subject offerings to only those on the teacher's campus
		const campusSubjectOfferings = subjectOfferings.filter(
			(offering) => offering.campusId === userCampusId
		);

		if (campusSubjectOfferings.length === 0) {
			console.warn(
				`No subject offerings found for campus ${userCampusId} for teacher ${teacher.id}, skipping...`
			);
			continue;
		}

		const sbjtOffs = [...campusSubjectOfferings];
		const selectedOfferings = [];

		// Select up to 5 offerings, or all available if fewer than 5
		const numberOfOfferings = Math.min(5, sbjtOffs.length);

		for (let j = 0; j < numberOfOfferings; j++) {
			const randOfferingIndex = Math.floor(rng() * sbjtOffs.length);
			const offering = sbjtOffs[randOfferingIndex];

			sbjtOffs.splice(randOfferingIndex, 1);

			selectedOfferings.push(offering);
		}

		for (let k = 0; k < selectedOfferings.length; k++) {
			const offering = selectedOfferings[k];
			userSubjectOfferingsToCreate.push({
				userId: teacher.id,
				subjectOfferingId: offering.id,
				role: schema.userSubjectOfferingRoleEnum.teacher,
				isComplete: 0,
				isArchived: 0,
				color: (i * 80 + k * 120) % 360 // Deterministic color based on teacher and offering index
			});
		}
	}

	const createdUserSubjectOfferings = await db
		.insert(schema.userSubjectOffering)
		.values(userSubjectOfferingsToCreate)
		.returning();

	console.log(`Created ${createdUserSubjectOfferings.length} teacher-subject assignments`);
	return createdUserSubjectOfferings.filter(
		(uso) => uso.role === schema.userSubjectOfferingRoleEnum.teacher
	);
}

/**
 * Combined function to assign both students and teachers to subject offerings
 * @param students - Array of student users
 * @param teachers - Array of teacher users
 * @param subjectOfferings - Array of available subject offerings
 * @returns Object containing arrays of created student and teacher assignments
 */
export async function assignUsersToSubjectOfferings(
	students: schema.User[],
	teachers: schema.User[],
	subjectOfferings: schema.SubjectOffering[]
) {
	console.log('Starting user-subject offering assignments...');

	const studentAssignments = await assignStudentsToSubjectOfferings(students, subjectOfferings);
	const teacherAssignments = await assignTeachersToSubjectOfferings(teachers, subjectOfferings);

	console.log(
		`Total assignments created: ${studentAssignments.length + teacherAssignments.length}`
	);

	return {
		studentAssignments,
		teacherAssignments
	};
}
