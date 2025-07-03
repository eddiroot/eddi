import { db } from '../index.js';
import {
	userSubjectOffering,
	userSubjectOfferingRoleEnum,
	type User,
	type SubjectOffering
} from '../schema.js';

/**
 * Assigns each student to 5 random subject offerings
 * @param students - Array of student users
 * @param subjectOfferings - Array of available subject offerings
 * @returns Array of created userSubjectOffering records
 */
export async function assignStudentsToSubjectOfferings(
	students: User[],
	subjectOfferings: SubjectOffering[]
) {
	console.log(`Assigning ${students.length} students to subject offerings...`);

	const userSubjectOfferingsToCreate = [];

	for (const student of students) {
		// Randomly select 5 subject offerings for this student
		const shuffledOfferings = [...subjectOfferings].sort(() => Math.random() - 0.5);
		const selectedOfferings = shuffledOfferings.slice(0, 5);

		for (const offering of selectedOfferings) {
			userSubjectOfferingsToCreate.push({
				userId: student.id,
				subjectOfferingId: offering.id,
				role: userSubjectOfferingRoleEnum.student,
				isComplete: 0,
				isArchived: 0,
				color: Math.floor(Math.random() * 360) // Random color value 0-359
			});
		}
	}

	const createdUserSubjectOfferings = await db
		.insert(userSubjectOffering)
		.values(userSubjectOfferingsToCreate)
		.returning();

	console.log(`Created ${createdUserSubjectOfferings.length} student-subject assignments`);
	return createdUserSubjectOfferings.filter(
		(uso) => uso.role === userSubjectOfferingRoleEnum.student
	);
}

/**
 * Assigns each teacher to 2 random subject offerings
 * @param teachers - Array of teacher users
 * @param subjectOfferings - Array of available subject offerings
 * @returns Array of created userSubjectOffering records
 */
export async function assignTeachersToSubjectOfferings(
	teachers: User[],
	subjectOfferings: SubjectOffering[]
) {
	console.log(`Assigning ${teachers.length} teachers to subject offerings...`);

	const userSubjectOfferingsToCreate = [];

	for (const teacher of teachers) {
		// Randomly select 2 subject offerings for this teacher
		const shuffledOfferings = [...subjectOfferings].sort(() => Math.random() - 0.5);
		const selectedOfferings = shuffledOfferings.slice(0, 2);

		for (const offering of selectedOfferings) {
			userSubjectOfferingsToCreate.push({
				userId: teacher.id,
				subjectOfferingId: offering.id,
				role: userSubjectOfferingRoleEnum.teacher,
				isComplete: 0,
				isArchived: 0,
				color: Math.floor(Math.random() * 360) // Random color value 0-359
			});
		}
	}

	const createdUserSubjectOfferings = await db
		.insert(userSubjectOffering)
		.values(userSubjectOfferingsToCreate)
		.returning();

	console.log(`Created ${createdUserSubjectOfferings.length} teacher-subject assignments`);
	return createdUserSubjectOfferings.filter(
		(uso) => uso.role === userSubjectOfferingRoleEnum.teacher
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
	students: User[],
	teachers: User[],
	subjectOfferings: SubjectOffering[]
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
