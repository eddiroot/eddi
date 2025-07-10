import { drizzle } from 'drizzle-orm/postgres-js';
import { reset } from 'drizzle-seed';
import * as schema from './schema/index.js';
import postgres from 'postgres';
import { seed_school } from './seed/seed_school';
import { seed_students } from './seed/seed_students';
import { seed_teachers } from './seed/seed_teachers';
import { seed_admins } from './seed/seed_admins';
import { assign_users_to_campuses } from './seed/seed_user_campuses';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function main() {
	await reset(db, schema);

	// Seed the school and its locations
	const { school, campuses, schoolLocations } = await seed_school();

	console.log(
		`🏫 Seeded school: ${school.name} with ${campuses.length} campuses with a total of ${schoolLocations.length} Locations`
	);

	// Seed all the users in the school
	const { students } = await seed_students(school.id);
	const { teachers } = await seed_teachers(school.id);
	const { admins } = await seed_admins(school.id);

	console.log(
		`👥 Seeded ${students.length} students, ${teachers.length} teachers, and ${admins.length} admins`
	);

	// Assign users to campuses
	console.log(`🔗 Assigning users to campuses...`);
	await assign_users_to_campuses([...students, ...teachers, ...admins], [...campuses]);
}

main()
	.catch((error) => {
		console.error('Error seeding database:', error);
		process.exit(1);
	})
	.finally(() => {
		console.log('Database seeded successfully');
		client.end();
		process.exit(0);
	});
