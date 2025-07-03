import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../schema';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

export async function assignUserToSubjectClasses(user: schema.User) {
	console.log(`🔗 Assigning ${user.firstName} ${user.lastName} to subject classes...`);

	// Get all subject offerings this user is enrolled in
	const userSubjectOfferings = await db
		.select()
		.from(schema.userSubjectOffering)
		.where(eq(schema.userSubjectOffering.userId, user.id));

	const userSubjectClassesToInsert = [];

	for (const userOffering of userSubjectOfferings) {
		// Find all classes for this subject offering
		const subjectClasses = await db
			.select()
			.from(schema.subjectClass)
			.where(eq(schema.subjectClass.subjectOfferingId, userOffering.subjectOfferingId));

		// Only assign user to one random class per subject offering
		if (subjectClasses.length > 0) {
			const randomClass = subjectClasses[Math.floor(Math.random() * subjectClasses.length)];

			userSubjectClassesToInsert.push({
				userId: user.id,
				subjectClassId: randomClass.id,
				role: schema.userSubjectClassRoleEnum.student // Add the required role field
			});
		}
	}

	const insertedUserSubjectClasses = await db
		.insert(schema.userSubjectClass)
		.values(userSubjectClassesToInsert)
		.returning();

	console.log(
		`✅ Assigned ${user.firstName} ${user.lastName} to ${insertedUserSubjectClasses.length} subject classes`
	);
	return insertedUserSubjectClasses;
}
