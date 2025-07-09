import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
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
import { assign_teachers_to_subject_classes } from './seed/seed_teacher_roles';
import { assign_users_to_campuses } from './seed/seed_user_campuses';

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
	const { subjects, subjectOfferings } = await seed_subjects(school.id, [...campuses]);

	// Assign users to campuses
	console.log(`🔗 Assigning users to campuses...`);
	await assign_users_to_campuses([...students, ...teachers, ...admins], [...campuses]);

	// Assign students and teachers to subject offerings
	const { studentAssignments, teacherAssignments } = await assignUsersToSubjectOfferings(
		[...students],
		[...teachers],
		[...subjectOfferings]
	);

	// Create subject classes (2 per offering)
	const subjectClasses = await seedSubjectClasses([...subjectOfferings]);

	// Give each class a random teacher that teaches that subject offering
	await assign_teachers_to_subject_classes([...teachers], [...subjectClasses]);

	// Generate random threads for each subject offering
	await seedSubjectThreads([...subjectOfferings], [...students, ...teachers]);

	await seedLessons([...subjectClasses]);

	const EmmaThompson = students[0];
	const userEmmaClasses = await assignUserToSubjectClasses(EmmaThompson);

	await seed_student_timetable(EmmaThompson, [...schoolLocations]);

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

	// Debug: Print out the teachers for each class that Emma Thompson is allocated to
	console.log(`\n🔍 Debug: Finding teachers for Emma Thompson's classes...`);
	for (const cls of userEmmaClasses) {
		console.log(`\n📚 Class ID: ${cls.subjectClassId}`);
		const subjectOfferingId = await db
			.select({ subjectOfferingId: schema.subjectClass.subjectOfferingId })
			.from(schema.subjectClass)
			.where(eq(schema.subjectClass.id, cls.subjectClassId))
			.limit(1);

		console.log(`   Subject Offering ID: ${subjectOfferingId[0]?.subjectOfferingId}`);

		if (!subjectOfferingId || subjectOfferingId.length === 0) {
			console.log(`   ❌ No subject offering found for class ${cls.subjectClassId}`);
			continue;
		}

		const subjectName = await db
			.select({ name: schema.subject.name })
			.from(schema.subject)
			.innerJoin(schema.subjectOffering, eq(schema.subjectOffering.subjectId, schema.subject.id))
			.where(eq(schema.subjectOffering.id, subjectOfferingId[0].subjectOfferingId));

		console.log(`📚 Subject Name: ${subjectName[0]?.name}`);
		// Find teachers for this specific class
		const teachersInClass = await db
			.select({
				teacher: {
					id: schema.user.id,
					firstName: schema.user.firstName,
					lastName: schema.user.lastName,
					email: schema.user.email
				},
				role: schema.userSubjectClass.role
			})
			.from(schema.userSubjectClass)
			.innerJoin(schema.user, eq(schema.user.id, schema.userSubjectClass.userId))
			.where(
				and(
					eq(schema.userSubjectClass.subjectClassId, cls.subjectClassId),
					eq(schema.userSubjectClass.role, schema.userSubjectClassRoleEnum.teacher)
				)
			);

		if (teachersInClass.length > 0) {
			teachersInClass.forEach((teacher) => {
				console.log(
					`👨‍🏫 Teacher: ${teacher.teacher.firstName} ${teacher.teacher.lastName} (${teacher.teacher.id})`
				);
			});
		} else {
			console.log(`   ❌ No teachers found for class ${cls.subjectClassId}`);
		}
	}
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
