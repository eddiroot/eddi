import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../schema';
import postgres from 'postgres';
import seedrandom from 'seedrandom';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

// Create a seeded random number generator
const rng = seedrandom('myconsistentseed');

export async function assignUsersToSubjectOfferings(
	students: schema.User[],
	teachers: schema.User[],
	subjectOfferings: schema.SubjectOffering[]
) {
	console.log(`🔗 Assigning users to subject offerings...`);
	console.log(`   - ${students.length} students`);
	console.log(`   - ${teachers.length} teachers`);
	console.log(`   - ${subjectOfferings.length} subject offerings`);

	const userSubjectOfferingsToCreate = [];

	// Step 1: Assign each student to 5 random subject offerings
	console.log(`📚 Assigning students to subject offerings...`);
	for (let i = 0; i < students.length; i++) {
		const student = students[i];
		console.log(`   Assigning student ${student.firstName} ${student.lastName} (${student.id})...`);

		// Create a copy of subject offerings to avoid modifying the original
		const availableOfferings = [...subjectOfferings];
		const selectedOfferings = [];

		// Select up to 5 offerings, or all available if fewer than 5
		const numberOfOfferings = Math.min(5, availableOfferings.length);

		for (let j = 0; j < numberOfOfferings; j++) {
			const randomIndex = Math.floor(rng() * availableOfferings.length);
			const selectedOffering = availableOfferings[randomIndex];

			// Remove the selected offering to avoid duplicates
			availableOfferings.splice(randomIndex, 1);
			selectedOfferings.push(selectedOffering);
		}

		// Create userSubjectOffering records for this student
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

	// Step 2: Assign 2 teachers to each subject offering
	console.log(`👨‍🏫 Assigning teachers to subject offerings...`);
	for (let i = 0; i < subjectOfferings.length; i++) {
		const offering = subjectOfferings[i];
		console.log(`   Assigning teachers to offering ${offering.id}...`);

		// Create a copy of teachers to avoid modifying the original
		const availableTeachers = [...teachers];
		const selectedTeachers = [];

		// Select up to 2 teachers, or all available if fewer than 2
		const numberOfTeachers = Math.min(2, availableTeachers.length);

		for (let j = 0; j < numberOfTeachers; j++) {
			const randomIndex = Math.floor(rng() * availableTeachers.length);
			const selectedTeacher = availableTeachers[randomIndex];

			// Remove the selected teacher to avoid duplicates for this offering
			availableTeachers.splice(randomIndex, 1);
			selectedTeachers.push(selectedTeacher);

			console.log(
				`     - Selected teacher ${selectedTeacher.firstName} ${selectedTeacher.lastName} (${selectedTeacher.id})`
			);
		}

		// Create userSubjectOffering records for the teachers
		for (let k = 0; k < selectedTeachers.length; k++) {
			const teacher = selectedTeachers[k];
			userSubjectOfferingsToCreate.push({
				userId: teacher.id,
				subjectOfferingId: offering.id,
				role: schema.userSubjectOfferingRoleEnum.teacher,
				isComplete: 0,
				isArchived: 0,
				color: (i * 80 + k * 120) % 360 // Deterministic color based on offering and teacher index
			});
		}
	}

	// Insert all userSubjectOffering records
	console.log(
		`💾 Creating ${userSubjectOfferingsToCreate.length} user-subject offering assignments...`
	);
	const createdUserSubjectOfferings = await db
		.insert(schema.userSubjectOffering)
		.values(userSubjectOfferingsToCreate)
		.returning();

	console.log(`✅ Created ${createdUserSubjectOfferings.length} user-subject offering assignments`);

	// Separate student and teacher assignments for return
	const studentAssignments = createdUserSubjectOfferings.filter(
		(uso) => uso.role === schema.userSubjectOfferingRoleEnum.student
	);
	const teacherAssignments = createdUserSubjectOfferings.filter(
		(uso) => uso.role === schema.userSubjectOfferingRoleEnum.teacher
	);

	console.log(`📊 Summary:`);
	console.log(`   - ${studentAssignments.length} student assignments`);
	console.log(`   - ${teacherAssignments.length} teacher assignments`);

	return {
		studentAssignments,
		teacherAssignments
	};
}
