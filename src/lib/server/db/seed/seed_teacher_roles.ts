import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../schema';
import { eq } from 'drizzle-orm';
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
	console.log(`🔗 Assigning ${teachers.length} teachers to subject classes...`);
	const userSubjectClassesToInsert = [];

	for (const cls of subjectClasses) {
		console.log(`Assigning teachers to class ${cls.id}...`);
		// Get all teachers for this subject offering
		const possibleTeacherIds = await db
			.select({
				userId: schema.userSubjectOffering.userId
			})
			.from(schema.userSubjectOffering)
			.where(eq(schema.userSubjectOffering.subjectOfferingId, cls.subjectOfferingId));

		if (possibleTeacherIds.length === 0) {
			console.warn(
				`No teachers found for subject offering ${cls.subjectOfferingId} for class ${cls.id}`
			);
			continue; // Skip this class if no teachers are available
		}

		userSubjectClassesToInsert.push({
			userId: possibleTeacherIds[Math.floor(rng() * possibleTeacherIds.length)].userId, // Randomly select a teacher
			subjectClassId: cls.id,
			role: schema.userSubjectClassRoleEnum.teacher // Assign the teacher role
		});
	}

	const createdUserSubjectClasses = await db
		.insert(schema.userSubjectClass)
		.values(userSubjectClassesToInsert)
		.returning();

	console.log(`✅ Assigned ${createdUserSubjectClasses.length} teachers to subject classes`);
	return createdUserSubjectClasses;
}
