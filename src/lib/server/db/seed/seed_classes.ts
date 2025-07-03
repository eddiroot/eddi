import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../schema';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

/**
 * Creates 2 subject classes for each subject offering
 * @param subjectOfferings - Array of subject offerings to create classes for
 * @returns Array of created subject class records
 */
export async function seedSubjectClasses(subjectOfferings: schema.SubjectOffering[]) {
	console.log(`Creating 2 classes for each of ${subjectOfferings.length} subject offerings...`);

	const subjectClassesToCreate = [];

	for (const offering of subjectOfferings) {
		// Create 2 classes per offering (e.g., Class A and Class B)
		for (let classNumber = 1; classNumber <= 2; classNumber++) {
			subjectClassesToCreate.push({
				subjectOfferingId: offering.id
			});
		}
	}

	const createdSubjectClasses = await db
		.insert(schema.subjectClass)
		.values(subjectClassesToCreate)
		.returning();

	console.log(`Created ${createdSubjectClasses.length} subject classes (2 per offering)`);
	return createdSubjectClasses;
}
