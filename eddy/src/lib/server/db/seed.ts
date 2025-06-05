import { drizzle } from 'drizzle-orm/postgres-js';
import { reset } from 'drizzle-seed';
import * as schema from './schema';
import { generateUserId } from '../../../routes/auth/utils';
import { hash } from '@node-rs/argon2';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function main() {
	await reset(db, schema);

	const users = await db
		.insert(schema.user)
		.values([
			{
				id: generateUserId(),
				email: 'admin@eddy.io',
				passwordHash: await hash('systemAdmin'),
				type: 'systemAdmin',
				firstName: 'SystemAdmin',
				lastName: 'User'
			},
			{
				id: generateUserId(),
				email: 'admin@school.edu.au',
				passwordHash: await hash('schoolAdmin'),
				type: 'schoolAdmin',
				firstName: 'SchoolAdmin',
				lastName: 'User'
			},
			{
				id: generateUserId(),
				email: 'teacher@school.edu.au',
				passwordHash: await hash('teacher'),
				type: 'teacher',
				firstName: 'Teacher',
				lastName: 'User'
			},
			{
				id: generateUserId(),
				email: 'student@school.edu.au',
				passwordHash: await hash('student'),
				type: 'student',
				firstName: 'Student',
				lastName: 'User'
			}
		])
		.returning();

	const school = await db
		.insert(schema.school)
		.values([
			{
				name: 'School of Eddy'
			}
		])
		.returning();

	const subjects = await db
		.insert(schema.subject)
		.values([
			{
				schoolId: school[0].id,
				name: 'Mathematics',
				description: 'Introduction to Mathematics'
			},
			{
				schoolId: school[0].id,
				name: 'Science',
				description: 'Introduction to Science'
			}
		])
		.returning();

	await db.insert(schema.userSubject).values([
		{
			userId: users[0].id, // systemAdmin
			subjectId: subjects[0].id, // Mathematics
			year: 2025,
			role: 'teacher',
			isComplete: 1,
			isArchived: 0
		},
		{
			userId: users[1].id, // schoolAdmin
			subjectId: subjects[1].id, // Science
			year: 2025,
			role: 'teacher',
			isComplete: 1,
			isArchived: 0
		},
		{
			userId: users[2].id, // teacher
			subjectId: subjects[0].id, // Mathematics
			year: 2025,
			role: 'teacher',
			isComplete: 1,
			isArchived: 0
		},
		{
			userId: users[3].id, // student
			subjectId: subjects[1].id, // Science
			year: 2025,
			role: 'student',
			isComplete: 0,
			isArchived: 0
		}
	]);
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
