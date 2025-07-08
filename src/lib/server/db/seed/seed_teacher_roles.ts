import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../schema';
import { eq, and } from 'drizzle-orm';
import postgres from 'postgres';
import seedrandom from 'seedrandom';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

// Create a seeded random number generator
const rng = seedrandom('myconsistentseed');

export async function assign_teachers_to_subject_classes(
	teachers: schema.User[],
	subjectClasses: schema.SubjectClass[]
) {
	console.log(`🔗 Assigning teachers to ${subjectClasses.length} subject classes...`);
	const userSubjectClassesToInsert = [];

	for (const cls of subjectClasses) {
		console.log(`Assigning teacher to class ${cls.id}...`);
		
		// Get all teachers for this subject offering
		const possibleTeacherIds = await db
			.select({
				userId: schema.userSubjectOffering.userId
			})
			.from(schema.userSubjectOffering)
			.where(
				and(
					eq(schema.userSubjectOffering.subjectOfferingId, cls.subjectOfferingId),
					eq(schema.userSubjectOffering.role, schema.userSubjectOfferingRoleEnum.teacher)
				)
			);

		if (possibleTeacherIds.length === 0) {
			console.warn(
				`   ❌ No teachers found for subject offering ${cls.subjectOfferingId} for class ${cls.id}`
			);
			continue; // Skip this class if no teachers are available
		}

		// Randomly select one teacher from the available teachers
		const selectedTeacherId = possibleTeacherIds[Math.floor(rng() * possibleTeacherIds.length)].userId;

		// Debug: Get teacher details for logging
		const teacherDetails = await db
			.select({
				id: schema.user.id,
				firstName: schema.user.firstName,
				lastName: schema.user.lastName,
				email: schema.user.email
			})
			.from(schema.user)
			.where(eq(schema.user.id, selectedTeacherId))
			.limit(1);

		if (teacherDetails.length > 0) {
			const teacher = teacherDetails[0];
			console.log(
				`   👨‍🏫 Selected teacher: ${teacher.firstName} ${teacher.lastName} (${teacher.id}) - ${teacher.email} for class ${cls.id}`
			);
		} else {
			console.warn(`   ⚠️  Teacher with ID ${selectedTeacherId} not found in user table`);
		}

		// Add the teacher-class assignment to the batch
		userSubjectClassesToInsert.push({
			userId: selectedTeacherId,
			subjectClassId: cls.id,
			role: schema.userSubjectClassRoleEnum.teacher,
			isArchived: false
		});
	}

	// Insert all teacher-class assignments
	if (userSubjectClassesToInsert.length > 0) {
		const createdUserSubjectClasses = await db
			.insert(schema.userSubjectClass)
			.values(userSubjectClassesToInsert)
			.returning();

		console.log(`✅ Assigned ${createdUserSubjectClasses.length} teachers to subject classes`);
		return createdUserSubjectClasses;
	} else {
		console.log(`❌ No teacher assignments were created`);
		return [];
	}
}
