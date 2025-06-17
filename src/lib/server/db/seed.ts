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
				email: 'admin@eddi.com.au',
				passwordHash: await hash('systemAdmin'),
				type: 'systemAdmin',
				firstName: 'SystemAdmin',
				lastName: 'One'
			},
			{
				id: generateUserId(),
				email: 'admin@school.edu.au',
				passwordHash: await hash('schoolAdmin'),
				type: 'schoolAdmin',
				firstName: 'SchoolAdmin',
				lastName: 'One'
			},
			{
				id: generateUserId(),
				email: 'teacher@school.edu.au',
				passwordHash: await hash('teacher'),
				type: 'teacher',
				firstName: 'Teacher',
				lastName: 'One'
			},
			{
				id: generateUserId(),
				email: 'student001@school.edu.au',
				passwordHash: await hash('student'),
				type: 'student',
				firstName: 'Student',
				lastName: 'One'
			},
			{
				id: generateUserId(),
				email: 'student002@school.edu.au',
				passwordHash: await hash('student'),
				type: 'student',
				firstName: 'Student',
				lastName: 'Two'
			},
			{
				id: generateUserId(),
				email: 'student003@school.edu.au',
				passwordHash: await hash('student'),
				type: 'student',
				firstName: 'Student',
				lastName: 'Three'
			}
		])
		.returning();

	const [school] = await db
		.insert(schema.school)
		.values([
			{
				name: 'School of Eddi'
			}
		])
		.returning();

	const subjects = await db
		.insert(schema.subject)
		.values([
			{
				schoolId: school.id,
				name: 'Maths',
				description: 'Learn about numbers, shapes, and patterns.'
			},
			{
				schoolId: school.id,
				name: 'Science',
				description: 'Learn about the natural world through observation and experimentation.'
			},
			{
				schoolId: school.id,
				name: 'History',
				description: 'Explore the past and understand how it shapes our present.'
			},
			{
				schoolId: school.id,
				name: 'English',
				description: 'Develop your reading, writing, and communication skills.'
			},
			{
				schoolId: school.id,
				name: 'Geography',
				description: 'Study the Earth, its environments, and how humans interact with them.'
			}
		])
		.returning();

	await db.insert(schema.userSubject).values([
		{
			userId: users[2].id, // teacher
			subjectId: subjects[0].id, // Mathematics
			year: 2025,
			role: 'teacher',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[2].id, // teacher
			subjectId: subjects[1].id, // Science
			year: 2025,
			role: 'teacher',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[2].id, // teacher
			subjectId: subjects[2].id, // History
			year: 2025,
			role: 'teacher',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[2].id, // teacher
			subjectId: subjects[3].id, // English
			year: 2025,
			role: 'teacher',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[2].id, // teacher
			subjectId: subjects[4].id, // Geography
			year: 2025,
			role: 'teacher',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[3].id, // student001
			subjectId: subjects[0].id, // Mathematics
			year: 2025,
			role: 'student',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[3].id, // student001
			subjectId: subjects[1].id, // Science
			year: 2025,
			role: 'student',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[4].id, // student002
			subjectId: subjects[0].id, // Mathematics
			year: 2025,
			role: 'student',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[4].id, // student002
			subjectId: subjects[1].id, // Science
			year: 2025,
			role: 'student',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[5].id, // student003
			subjectId: subjects[2].id, // History
			year: 2025,
			role: 'student',
			isComplete: 0,
			isArchived: 0
		}
	]);

	await db.insert(schema.subjectThread).values([
		{
			type: 'announcement',
			userId: users[2].id, // teacher
			subjectId: subjects[1].id,
			title: 'Welcome to Science',
			content: 'This is the first thread in Science.'
		},
		{
			type: 'question',
			userId: users[3].id, // student001
			subjectId: subjects[1].id,
			title: 'Scientific method',
			content: 'Can someone explain the scientific method to me?'
		},
		{
			type: 'question',
			userId: users[4].id, // student002
			subjectId: subjects[1].id,
			title: 'Experiments',
			content: 'What are some good experiments for beginners?'
		},
		{
			type: 'announcement',
			userId: users[2].id, // teacher
			subjectId: subjects[0].id,
			title: 'Welcome to Mathematics',
			content: 'This is the first thread in Mathematics.'
		},
		{
			type: 'question',
			userId: users[4].id, // student002
			subjectId: subjects[0].id,
			title: 'Help with long division',
			content: 'I am struggling with long division. Can anyone help?'
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
