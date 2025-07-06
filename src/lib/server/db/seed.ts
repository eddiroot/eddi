import { drizzle } from 'drizzle-orm/postgres-js';
import { reset } from 'drizzle-seed';
import * as schema from './schema';
import postgres from 'postgres';
import { seed_school } from './seed/seed_school';
import { seed_students } from './seed/seed_students';
import { seed_teachers } from './seed/seed_teachers';
import { seed_admins } from './seed/seed_admins';
import { seed_subjects } from './seed/seed_subjects';
import { assignUsersToSubjectOfferings } from './seed/seed_user_subject_offerings';
import { seedSubjectClasses } from './seed/seed_classes';
import { seedSubjectThreads } from './seed/seed_threads';
import { seedLessons } from './seed/seed_lessons';
import { assignUserToSubjectClasses } from './seed/seed_student_classes';
import { seed_student_timetable } from './seed/seed_timetable';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function main() {
	await reset(db, schema);

	// Seed the school and its locations
	const { school, campuses, schoolLocations } = await seed_school();

	// Seed all the users in the school
	const { students } = await seed_students();
	const { teachers } = await seed_teachers();
	const { admins } = await seed_admins();

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

	await seedSubjectThreads(subjectOfferings, [...students, ...teachers]);
	await seedLessons(subjectClasses);

	const EmmaThompson = students[0];
	await assignUserToSubjectClasses(EmmaThompson);
	await seed_student_timetable(EmmaThompson, schoolLocations);

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
	console.log(`   - ${admins.length} admins`);
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
