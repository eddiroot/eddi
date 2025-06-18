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

	const subjectOfferings = await db
		.insert(schema.subjectOffering)
		.values([
			{
				subjectId: subjects[0].id, // Mathematics
				year: 2025
			},
			{
				subjectId: subjects[1].id, // Science
				year: 2025
			},
			{
				subjectId: subjects[2].id, // History
				year: 2025
			},
			{
				subjectId: subjects[3].id, // English
				year: 2025
			},
			{
				subjectId: subjects[4].id, // Geography
				year: 2025
			}
		])
		.returning();

	await db.insert(schema.userSubjectOffering).values([
		{
			userId: users[2].id, // teacher
			subjectOfferingId: subjectOfferings[0].id, // Mathematics
			role: 'teacher',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[2].id, // teacher
			subjectOfferingId: subjectOfferings[1].id, // Science
			role: 'teacher',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[2].id, // teacher
			subjectOfferingId: subjectOfferings[2].id, // History
			role: 'teacher',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[2].id, // teacher
			subjectOfferingId: subjectOfferings[3].id, // English
			role: 'teacher',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[2].id, // teacher
			subjectOfferingId: subjectOfferings[4].id, // Geography
			role: 'teacher',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[3].id, // student001
			subjectOfferingId: subjectOfferings[0].id, // Mathematics
			role: 'student',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[3].id, // student001
			subjectOfferingId: subjectOfferings[1].id, // Science
			role: 'student',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[3].id, // student001
			subjectOfferingId: subjectOfferings[2].id, // History
			role: 'student',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[3].id, // student001
			subjectOfferingId: subjectOfferings[3].id, // English
			role: 'student',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[3].id, // student001
			subjectOfferingId: subjectOfferings[4].id, // Geography
			role: 'student',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[4].id, // student002
			subjectOfferingId: subjectOfferings[0].id, // Mathematics
			role: 'student',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[4].id, // student002
			subjectOfferingId: subjectOfferings[1].id, // Science
			role: 'student',
		 isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[4].id, // student002
			subjectOfferingId: subjectOfferings[2].id, // History
			role: 'student',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[4].id, // student002
			subjectOfferingId: subjectOfferings[3].id, // English
			role: 'student',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[4].id, // student002
			subjectOfferingId: subjectOfferings[4].id, // Geography
			role: 'student',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[5].id, // student003
			subjectOfferingId: subjectOfferings[0].id, // Mathematics
			role: 'student',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[5].id, // student003
			subjectOfferingId: subjectOfferings[1].id, // Science
			role: 'student',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[5].id, // student003
			subjectOfferingId: subjectOfferings[2].id, // History
			role: 'student',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[5].id, // student003
			subjectOfferingId: subjectOfferings[3].id, // English
			role: 'student',
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[5].id, // student003
			subjectOfferingId: subjectOfferings[4].id, // Geography
			role: 'student',
			isComplete: 0,
			isArchived: 0
		}
	]);

	await db.insert(schema.subjectThread).values([
		{
			type: 'announcement',
			userId: users[2].id, // teacher
			subjectOfferingId: subjectOfferings[0].id, // Mathematics
			title: 'Welcome to Mathematics',
			content: 'This is the first thread in Mathematics.'
		},
		{
			type: 'question',
			userId: users[4].id, // student002
			subjectOfferingId: subjectOfferings[0].id, // Mathematics
			title: 'Help with long division',
			content: 'I am struggling with long division. Can anyone help?'
		},
		{
			type: 'announcement',
			userId: users[2].id, // teacher
			subjectOfferingId: subjectOfferings[1].id, // Science
			title: 'Welcome to Science',
			content: 'This is the first thread in Science.'
		},
		{
			type: 'question',
			userId: users[3].id, // student001
			subjectOfferingId: subjectOfferings[1].id, // Science
			title: 'Scientific method',
			content: 'Can someone explain the scientific method to me?'
		},
		{
			type: 'question',
			userId: users[4].id, // student002
			subjectOfferingId: subjectOfferings[1].id, // Science
			title: 'Experiments',
			content: 'What are some good experiments for beginners?'
		}
	]);

	const subjectClasses = await db
		.insert(schema.subjectClass)
		.values([
			{
				subjectOfferingId: subjectOfferings[0].id // Maths
			},
			{
				subjectOfferingId: subjectOfferings[1].id // Science
			},
			{
				subjectOfferingId: subjectOfferings[2].id // History
			},
			{
				subjectOfferingId: subjectOfferings[3].id // English
			},
			{
				subjectOfferingId: subjectOfferings[4].id // Geography
			}
		])
		.returning();

	await db.insert(schema.subjectClassTime).values([
		// Maths
		{
			subjectClassId: subjectClasses[0].id,
			dayOfWeek: 'monday',
			startTime: '09:00:00',
			duration: '01:00:00'
		},
		{
			subjectClassId: subjectClasses[0].id,
			dayOfWeek: 'wednesday',
			startTime: '09:00:00',
			duration: '01:00:00'
		},

		// Science
		{
			subjectClassId: subjectClasses[1].id,
			dayOfWeek: 'tuesday',
			startTime: '10:00:00',
			duration: '01:30:00'
		},
		{
			subjectClassId: subjectClasses[1].id,
			dayOfWeek: 'thursday',
			startTime: '10:00:00',
			duration: '01:30:00'
		},

		// History
		{
			subjectClassId: subjectClasses[2].id,
			dayOfWeek: 'monday',
			startTime: '11:00:00',
			duration: '01:00:00'
		},
		{
			subjectClassId: subjectClasses[2].id,
			dayOfWeek: 'wednesday',
			startTime: '11:00:00',
			duration: '01:00:00'
		},

		// English
		{
			subjectClassId: subjectClasses[3].id,
			dayOfWeek: 'tuesday',
			startTime: '09:00:00',
			duration: '01:00:00'
		},
		{
			subjectClassId: subjectClasses[3].id,
			dayOfWeek: 'thursday',
			startTime: '09:00:00',
			duration: '01:00:00'
		},

		// Geography
		{
			subjectClassId: subjectClasses[4].id,
			dayOfWeek: 'friday',
			startTime: '08:30:00',
			duration: '01:30:00'
		},
		{
			subjectClassId: subjectClasses[4].id,
			dayOfWeek: 'friday',
			startTime: '13:30:00',
			duration: '01:00:00'
		}
	]);

	await db.insert(schema.userSubjectClass).values([
		{
			userId: users[2].id, // teacher
			subjectClassId: subjectClasses[0].id, // Maths
			role: 'teacher'
		},
		{
			userId: users[2].id, // teacher
			subjectClassId: subjectClasses[1].id, // Science
			role: 'teacher'
		},
		{
			userId: users[2].id, // teacher
			subjectClassId: subjectClasses[2].id, // History
			role: 'teacher'
		},
		{
			userId: users[2].id, // teacher
			subjectClassId: subjectClasses[3].id, // English
			role: 'teacher'
		},
		{
			userId: users[2].id, // teacher
			subjectClassId: subjectClasses[4].id, // Geography
			role: 'teacher'
		},
		{
			userId: users[3].id, // student001
			subjectClassId: subjectClasses[0].id, // Maths
			role: 'student'
		},
		{
			userId: users[3].id, // student001
			subjectClassId: subjectClasses[1].id, // Science
			role: 'student'
		},
		{
			userId: users[3].id, // student001
			subjectClassId: subjectClasses[2].id, // History
			role: 'student'
		},
		{
			userId: users[3].id, // student001
			subjectClassId: subjectClasses[3].id, // English
			role: 'student'
		},
		{
			userId: users[3].id, // student001
			subjectClassId: subjectClasses[4].id, // Geography
			role: 'student'
		},
		{
			userId: users[4].id, // student002
			subjectClassId: subjectClasses[0].id, // Maths
			role: 'student'
		},
		{
			userId: users[4].id, // student002
			subjectClassId: subjectClasses[1].id, // Science
			role: 'student'
		},
		{
			userId: users[4].id, // student002
			subjectClassId: subjectClasses[2].id, // History
			role: 'student'
		},
		{
			userId: users[4].id, // student002
			subjectClassId: subjectClasses[3].id, // English
			role: 'student'
		},
		{
			userId: users[4].id, // student002
			subjectClassId: subjectClasses[4].id, // Geography
			role: 'student'
		},
		{
			userId: users[5].id, // student003
			subjectClassId: subjectClasses[0].id, // Maths
			role: 'student'
		},
		{
			userId: users[5].id, // student003
			subjectClassId: subjectClasses[1].id, // Science
			role: 'student'
		},
		{
			userId: users[5].id, // student003
			subjectClassId: subjectClasses[2].id, // History
			role: 'student'
		},
		{
			userId: users[5].id, // student003
			subjectClassId: subjectClasses[3].id, // English
			role: 'student'
		},
		{
			userId: users[5].id, // student003
			subjectClassId: subjectClasses[4].id, // Geography
			role: 'student'
		}
	]);

	// Add after the existing subject class time insertions

	// Insert lesson topics for Math
	const mathLessonTopics = await db
		.insert(schema.lessonTopic)
		.values([
			{
				subjectClassId: subjectClasses[0].id,
				name: 'Algebra Basics'
			},
			{
				subjectClassId: subjectClasses[0].id,
				name: 'Linear Equations'
			},
			{
				subjectClassId: subjectClasses[0].id,
				name: 'Quadratic Functions'
			},
			{
				subjectClassId: subjectClasses[0].id,
				name: 'Geometry Fundamentals'
			},
			{
				subjectClassId: subjectClasses[0].id,
				name: 'Trigonometry'
			}
		])
		.returning();

	console.log('✅ Inserted lesson topics');

	// Insert lessons for each topic
	const lessons = await db
		.insert(schema.lesson)
		.values([
			// Algebra Basics lessons
			{
				lessonTopicId: mathLessonTopics[0].id,
				subjectWeek: 1,
				name: 'Introduction to Variables',
				description: 'Learn about variables and their role in algebra'
			},
			{
				lessonTopicId: mathLessonTopics[0].id,
				subjectWeek: 1,
				name: 'Basic Operations with Variables',
				description: 'Addition, subtraction, multiplication and division with variables'
			},
			{
				lessonTopicId: mathLessonTopics[0].id,
				subjectWeek: 2,
				name: 'Simplifying Expressions',
				description: 'Learn to combine like terms and simplify algebraic expressions'
			},

			// Linear Equations lessons
			{
				lessonTopicId: mathLessonTopics[1].id,
				subjectWeek: 3,
				name: 'Solving One-Step Equations',
				description: 'Basic techniques for solving simple linear equations'
			},
			{
				lessonTopicId: mathLessonTopics[1].id,
				subjectWeek: 3,
				name: 'Solving Multi-Step Equations',
				description: 'Advanced techniques for complex linear equations'
			},
			{
				lessonTopicId: mathLessonTopics[1].id,
				subjectWeek: 4,
				name: 'Graphing Linear Equations',
				description: 'Visual representation of linear equations on coordinate plane'
			},

			// Quadratic Functions lessons
			{
				lessonTopicId: mathLessonTopics[2].id,
				subjectWeek: 5,
				name: 'Introduction to Quadratics',
				description: 'Understanding quadratic functions and their properties'
			},
			{
				lessonTopicId: mathLessonTopics[2].id,
				subjectWeek: 5,
				name: 'Factoring Quadratics',
				description: 'Methods for factoring quadratic expressions'
			},
			{
				lessonTopicId: mathLessonTopics[2].id,
				subjectWeek: 6,
				name: 'Quadratic Formula',
				description: 'Using the quadratic formula to solve equations'
			},

			// Geometry Fundamentals lessons
			{
				lessonTopicId: mathLessonTopics[3].id,
				subjectWeek: 7,
				name: 'Points, Lines, and Planes',
				description: 'Basic geometric concepts and definitions'
			},
			{
				lessonTopicId: mathLessonTopics[3].id,
				subjectWeek: 7,
				name: 'Angles and Their Measures',
				description: 'Understanding different types of angles'
			},
			{
				lessonTopicId: mathLessonTopics[3].id,
				subjectWeek: 8,
				name: 'Triangles and Their Properties',
				description: 'Exploring triangle classifications and properties'
			},

			// Trigonometry lessons
			{
				lessonTopicId: mathLessonTopics[4].id,
				subjectWeek: 9,
				name: 'Introduction to Trigonometry',
				description: 'Basic trigonometric concepts and ratios'
			},
			{
				lessonTopicId: mathLessonTopics[4].id,
				subjectWeek: 9,
				name: 'Sine, Cosine, and Tangent',
				description: 'Understanding the primary trigonometric functions'
			},
			{
				lessonTopicId: mathLessonTopics[4].id,
				subjectWeek: 10,
				name: 'Solving Right Triangles',
				description: 'Using trigonometry to find missing sides and angles'
			}
		])
		.returning();

	console.log('✅ Inserted lessons');
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
