import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../schema';
import postgres from 'postgres';
import seedrandom from 'seedrandom';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

// Create a seeded random number generator
const rng = seedrandom('myconsistentseed');

export async function assign_users_to_campuses(
	users: schema.User[],
	campuses: schema.SchoolCampus[]
) {
	console.log(`🔗 Assigning ${users.length} users to campuses...`);
	const userCampusesToInsert = [];

	for (const user of users) {
		console.log(`Assigning user ${user.id} to a campus...`);

		// Filter campuses that belong to the user's school
		const userCampuses = campuses.filter((campus) => campus.schoolId === user.schoolId);

		if (userCampuses.length === 0) {
			console.warn(`No campuses found for school ${user.schoolId} for user ${user.id}`);
			continue; // Skip this user if no campuses are available for their school
		}

		// Randomly select a campus from the user's school
		const selectedCampus = userCampuses[Math.floor(rng() * userCampuses.length)];

		userCampusesToInsert.push({
			userId: user.id,
			campusId: selectedCampus.id
		});
	}

	const createdUserCampuses = await db
		.insert(schema.userCampus)
		.values(userCampusesToInsert)
		.returning();

	console.log(`✅ Assigned ${createdUserCampuses.length} users to campuses`);
	return createdUserCampuses;
}
