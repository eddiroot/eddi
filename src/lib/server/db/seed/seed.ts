import { drizzle } from 'drizzle-orm/postgres-js';
import { reset } from 'drizzle-seed';
import * as schema from '../schema';
import postgres from 'postgres';
import { seed_school } from './seed_school';
import { seed_students } from './seed_students';
import { seed_teachers } from './seed_teachers';
import { seed_subjects } from './seed_subjects';
import { assignUsersToSubjectOfferings } from './seed_user_subject_offerings';
import { seedSubjectClasses } from './seed_classes';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function main() {
	await reset(db, schema);

	// Seed the school and its locations
	const { school, campuses, schoolLocations } = await seed_school();

	// Seed all the users in the school
	const { students } = await seed_students();
	const { teachers } = await seed_teachers();

	// Seed subjects and subject offerings
	const { subjects, subjectOfferings } = await seed_subjects(school.id, campuses);

	// Assign students and teachers to subject offerings
	const { studentAssignments, teacherAssignments } = await assignUsersToSubjectOfferings(
		students,
		teachers,
		subjectOfferings
	);

	// Create subject classes (2 per offering)
	const subjectClasses = await seedSubjectClasses(subjectOfferings);

	// for each class, assign it a time and location

	console.log(`✅ Database seeded successfully!`);
	console.log(`📊 Summary:`);
	console.log(`   - 1 school with ${campuses.length} campuses`);
	console.log(`   - ${schoolLocations.length} locations`);
	console.log(`   - ${subjects.length} subjects with ${subjectOfferings.length} offerings`);
	console.log(`   - ${subjectClasses.length} subject classes (2 per offering)`);
	console.log(
		`   - ${students.length} students with ${studentAssignments.length} subject assignments`
	);
	console.log(
		`   - ${teachers.length} teachers with ${teacherAssignments.length} subject assignments`
	);
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
