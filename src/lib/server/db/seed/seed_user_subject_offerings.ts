import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../schema';
import postgres from 'postgres';
import seedrandom from 'seedrandom';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

// Create a seeded random number generator
const rng = seedrandom('myconsistentseed');
/**
 * Assigns each student to 5 deterministic subject offerings
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
		const sbjtOffs = [...subjectOfferings];

		const student = students[i];

		// Deterministically select 5 subject offerings for this student
		// Use modulo to cycle through offerings, starting at different points for each student
		const selectedOfferings = [];

		for (let j = 0; j < 5; j++) {
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
 * Assigns each teacher to 2 deterministic subject offerings
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

		const sbjtOffs = [...subjectOfferings];

		const selectedOfferings = [];

		for (let j = 0; j < 5; j++) {
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
