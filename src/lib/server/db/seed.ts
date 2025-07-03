import { drizzle } from 'drizzle-orm/postgres-js';
import { reset } from 'drizzle-seed';
import * as schema from './schema';
import { generateUserId } from '../../../routes/auth/utils';
import { hash } from '@node-rs/argon2';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function main() {
	console.log('Seeding database...');
	await reset(db, schema);

	const users = await db
		.insert(schema.user)
		.values([
			{
				id: generateUserId(),
				email: 'admin@eddi.com.au',
				passwordHash: await hash('systemAdmin'),
				type: schema.userTypeEnum.systemAdmin,
				firstName: 'SystemAdmin',
				lastName: 'One'
			},
			{
				id: generateUserId(),
				email: 'admin@school.edu.au',
				passwordHash: await hash('schoolAdmin'),
				type: schema.userTypeEnum.schoolAdmin,
				firstName: 'SchoolAdmin',
				lastName: 'One'
			},
			{
				id: generateUserId(),
				email: 'teacher001@school.edu.au',
				passwordHash: await hash('teacher'),
				type: schema.userTypeEnum.teacher,
				firstName: 'Teacher',
				lastName: '001'
			},
			{
				id: generateUserId(),
				email: 'teacher002@school.edu.au',
				passwordHash: await hash('teacher'),
				type: schema.userTypeEnum.teacher,
				firstName: 'Teacher',
				lastName: '002'
			},
			{
				id: generateUserId(),
				email: 'teacher003@school.edu.au',
				passwordHash: await hash('teacher'),
				type: schema.userTypeEnum.teacher,
				firstName: 'Teacher',
				lastName: '003'
			},
			{
				id: generateUserId(),
				email: 'teacher004@school.edu.au',
				passwordHash: await hash('teacher'),
				type: schema.userTypeEnum.teacher,
				firstName: 'Teacher',
				lastName: '004'
			},
			{
				id: generateUserId(),
				email: 'teacher005@school.edu.au',
				passwordHash: await hash('teacher'),
				type: schema.userTypeEnum.teacher,
				firstName: 'Teacher',
				lastName: '005'
			},
			{
				id: generateUserId(),
				email: 'student001@school.edu.au',
				passwordHash: await hash('student'),
				type: schema.userTypeEnum.student,
				firstName: 'Student',
				lastName: 'One'
			},
			{
				id: generateUserId(),
				email: 'student002@school.edu.au',
				passwordHash: await hash('student'),
				type: schema.userTypeEnum.student,
				firstName: 'Student',
				lastName: 'Two'
			},
			{
				id: generateUserId(),
				email: 'student003@school.edu.au',
				passwordHash: await hash('student'),
				type: schema.userTypeEnum.student,
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

	// Create a campus for the school
	const [campus] = await db
		.insert(schema.campus)
		.values([
			{
				schoolId: school.id,
				name: 'Main Campus',
				address: '123 Eddi Street, Eddi Town, ED 1234',
				description: 'The main campus of School of Eddi',
				isActive: true
			}
		])
		.returning();

	// Add schoolLocations for the campus
	const schoolLocations = await db
		.insert(schema.schoolLocation)
		.values([
			// Classrooms
			{
				campusId: campus.id,
				name: 'Room 101',
				type: schema.schoolLocationTypeEnum.classroom,
				capacity: 30,
				description: 'Main building, ground floor - equipped with smart board',
				isActive: true
			},
			{
				campusId: campus.id,
				name: 'Room 102',
				type: schema.schoolLocationTypeEnum.classroom,
				capacity: 28,
				description: 'Main building, ground floor - traditional classroom setup',
				isActive: true
			},
			{
				campusId: campus.id,
				name: 'Room 201',
				type: schema.schoolLocationTypeEnum.classroom,
				capacity: 32,
				description: 'Main building, second floor - large windows, natural lighting',
				isActive: true
			},
			{
				campusId: campus.id,
				name: 'Room 202',
				type: schema.schoolLocationTypeEnum.classroom,
				capacity: 25,
				description: 'Main building, second floor - compact classroom for small groups',
				isActive: true
			},
			// Laboratories
			{
				campusId: campus.id,
				name: 'Chemistry Lab A',
				type: schema.schoolLocationTypeEnum.laboratory,
				capacity: 24,
				description: 'Fully equipped chemistry lab with fume hoods and safety equipment',
				isActive: true
			},
			{
				campusId: campus.id,
				name: 'Physics Lab',
				type: schema.schoolLocationTypeEnum.laboratory,
				capacity: 20,
				description: 'Physics laboratory with experiment stations and demonstration area',
				isActive: true
			},
			{
				campusId: campus.id,
				name: 'Computer Lab',
				type: schema.schoolLocationTypeEnum.laboratory,
				capacity: 30,
				description: 'Modern computer lab with 30 workstations and high-speed internet',
				isActive: true
			},
			// Special purpose rooms
			{
				campusId: campus.id,
				name: 'Main Auditorium',
				type: schema.schoolLocationTypeEnum.auditorium,
				capacity: 200,
				description: 'Large auditorium for assemblies, presentations, and performances',
				isActive: true
			},
			{
				campusId: campus.id,
				name: 'Gymnasium',
				type: schema.schoolLocationTypeEnum.gymnasium,
				capacity: 100,
				description: 'Full-size gymnasium for sports and physical education',
				isActive: true
			},
			{
				campusId: campus.id,
				name: 'Library Study Room',
				type: schema.schoolLocationTypeEnum.classroom,
				capacity: 15,
				description: 'Quiet study room in the library for small group work',
				isActive: true
			},
			{
				campusId: campus.id,
				name: 'Art Studio',
				type: schema.schoolLocationTypeEnum.laboratory,
				capacity: 22,
				description: 'Creative arts studio with easels, pottery wheels, and art supplies',
				isActive: true
			},
			// Online/Virtual
			{
				campusId: campus.id,
				name: 'Virtual Classroom A',
				type: schema.schoolLocationTypeEnum.online,
				capacity: null,
				description: 'Zoom meeting room for remote learning sessions',
				isActive: true
			},
			{
				campusId: campus.id,
				name: 'Virtual Classroom B',
				type: schema.schoolLocationTypeEnum.online,
				capacity: null,
				description: 'Microsoft Teams room for hybrid learning',
				isActive: true
			},
			// Inactive location for testing
			{
				campusId: campus.id,
				name: 'Old Room 103',
				type: schema.schoolLocationTypeEnum.classroom,
				capacity: 20,
				description: 'Previously used classroom, now under renovation',
				isActive: false
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
				year: 2025,
				semester: 2,
				campusId: campus.id
			},
			{
				subjectId: subjects[1].id, // Science
				year: 2025,
				semester: 2,
				campusId: campus.id
			},
			{
				subjectId: subjects[2].id, // History
				year: 2025,
				semester: 2,
				campusId: campus.id
			},
			{
				subjectId: subjects[3].id, // English
				year: 2025,
				semester: 2,
				campusId: campus.id
			},
			{
				subjectId: subjects[4].id, // Geography
				year: 2025,
				semester: 2,
				campusId: campus.id
			}
		])
		.returning();

	await db.insert(schema.userSubjectOffering).values([
		{
			userId: users[2].id, // teacher001
			subjectOfferingId: subjectOfferings[0].id, // Mathematics
			role: schema.userSubjectOfferingRoleEnum.teacher,
			isComplete: 0,
			isArchived: 0,
			color: 100
		},
		{
			userId: users[4].id, // teacher003
			subjectOfferingId: subjectOfferings[0].id, // Mathematics
			role: schema.userSubjectOfferingRoleEnum.teacher,
			isComplete: 0,
			isArchived: 0,
			color: 120
		},
		{
			userId: users[3].id, // teacher002
			subjectOfferingId: subjectOfferings[1].id, // Science
			role: schema.userSubjectOfferingRoleEnum.teacher,
			isComplete: 0,
			isArchived: 0,
			color: 140
		},
		{
			userId: users[4].id, // teacher003
			subjectOfferingId: subjectOfferings[2].id, // History
			role: schema.userSubjectOfferingRoleEnum.teacher,
			isComplete: 0,
			isArchived: 0,
			color: 180
		},
		{
			userId: users[5].id, // teacher004
			subjectOfferingId: subjectOfferings[3].id, // English
			role: schema.userSubjectOfferingRoleEnum.teacher,
			isComplete: 0,
			isArchived: 0,
			color: 220
		},
		{
			userId: users[6].id, // teacher005
			subjectOfferingId: subjectOfferings[4].id, // Geography
			role: schema.userSubjectOfferingRoleEnum.teacher,
			isComplete: 0,
			isArchived: 0,
			color: 100
		},
		{
			userId: users[7].id, // student001
			subjectOfferingId: subjectOfferings[0].id, // Mathematics
			role: schema.userSubjectOfferingRoleEnum.student,
			isComplete: 0,
			isArchived: 0,
			color: 0
		},
		{
			userId: users[7].id, // student001
			subjectOfferingId: subjectOfferings[1].id, // Science
			role: schema.userSubjectOfferingRoleEnum.student,
			isComplete: 0,
			isArchived: 0,
			color: 100
		},
		{
			userId: users[7].id, // student001
			subjectOfferingId: subjectOfferings[2].id, // History
			role: schema.userSubjectOfferingRoleEnum.student,
			isComplete: 0,
			isArchived: 0,
			color: 30
		},
		{
			userId: users[7].id, // student001
			subjectOfferingId: subjectOfferings[3].id, // English
			role: schema.userSubjectOfferingRoleEnum.student,
			isComplete: 0,
			isArchived: 0,
			color: 240
		},
		{
			userId: users[7].id, // student001
			subjectOfferingId: subjectOfferings[4].id, // Geography
			role: schema.userSubjectOfferingRoleEnum.student,
			isComplete: 0,
			isArchived: 0,
			color: 300
		},
		{
			userId: users[8].id, // student002
			subjectOfferingId: subjectOfferings[0].id, // Mathematics
			role: schema.userSubjectOfferingRoleEnum.student,
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[8].id, // student002
			subjectOfferingId: subjectOfferings[1].id, // Science
			role: schema.userSubjectOfferingRoleEnum.student,
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[8].id, // student002
			subjectOfferingId: subjectOfferings[2].id, // History
			role: schema.userSubjectOfferingRoleEnum.student,
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[8].id, // student002
			subjectOfferingId: subjectOfferings[3].id, // English
			role: schema.userSubjectOfferingRoleEnum.student,
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[8].id, // student002
			subjectOfferingId: subjectOfferings[4].id, // Geography
			role: schema.userSubjectOfferingRoleEnum.student,
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[9].id, // student003
			subjectOfferingId: subjectOfferings[0].id, // Mathematics
			role: schema.userSubjectOfferingRoleEnum.student,
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[9].id, // student003
			subjectOfferingId: subjectOfferings[1].id, // Science
			role: schema.userSubjectOfferingRoleEnum.student,
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[9].id, // student003
			subjectOfferingId: subjectOfferings[2].id, // History
			role: schema.userSubjectOfferingRoleEnum.student,
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[9].id, // student003
			subjectOfferingId: subjectOfferings[3].id, // English
			role: schema.userSubjectOfferingRoleEnum.student,
			isComplete: 0,
			isArchived: 0
		},
		{
			userId: users[9].id, // student003
			subjectOfferingId: subjectOfferings[4].id, // Geography
			role: schema.userSubjectOfferingRoleEnum.student,
			isComplete: 0,
			isArchived: 0
		}
	]);

	await db.insert(schema.subjectThread).values([
		{
			type: schema.subjectThreadTypeEnum.announcement,
			userId: users[2].id, // teacher
			subjectOfferingId: subjectOfferings[0].id, // Mathematics
			title: 'Welcome to Mathematics',
			content: 'This is the first thread in Mathematics.'
		},
		{
			type: schema.subjectThreadTypeEnum.announcement,
			userId: users[2].id, // teacher
			subjectOfferingId: subjectOfferings[0].id, // Mathematics
			title: 'Quiz Next Week',
			content:
				'We will have a quiz on algebra basics next Monday. Please review chapters 1-3 in your textbook.'
		},
		{
			type: schema.subjectThreadTypeEnum.question,
			userId: users[8].id, // student002
			subjectOfferingId: subjectOfferings[0].id, // Mathematics
			title: 'Help with long division',
			content: 'I am struggling with long division. Can anyone help?'
		},
		{
			type: schema.subjectThreadTypeEnum.announcement,
			userId: users[2].id, // teacher
			subjectOfferingId: subjectOfferings[1].id, // Science
			title: 'Welcome to Science',
			content: 'This is the first thread in Science.'
		},
		{
			type: schema.subjectThreadTypeEnum.announcement,
			userId: users[2].id, // teacher
			subjectOfferingId: subjectOfferings[1].id, // Science
			title: 'Lab Safety Reminder',
			content:
				'Please remember to bring your safety goggles to tomorrows lab session. We will be working with chemicals.'
		},
		{
			type: schema.subjectThreadTypeEnum.announcement,
			userId: users[2].id, // teacher
			subjectOfferingId: subjectOfferings[2].id, // History
			title: 'Field Trip Permission Slips',
			content:
				'Field trip permission slips for the museum visit are due by Friday. Please have your parents sign and return them.'
		},
		{
			type: schema.subjectThreadTypeEnum.announcement,
			userId: users[2].id, // teacher
			subjectOfferingId: subjectOfferings[3].id, // English
			title: 'Book Report Due Date',
			content:
				'Your book reports on the assigned novels are due next Wednesday. Late submissions will receive a penalty.'
		},
		{
			type: schema.subjectThreadTypeEnum.question,
			userId: users[7].id, // student001
			subjectOfferingId: subjectOfferings[1].id, // Science
			title: 'Scientific method',
			content: 'Can someone explain the scientific method to me?'
		},
		{
			type: schema.subjectThreadTypeEnum.question,
			userId: users[8].id, // student002
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

	await db.insert(schema.subjectClassAllocation).values([
		// Schedule: 8:30-9:25, 9:25-10:20, RECESS 10:20-10:40, 10:40-11:35, 11:35-12:30, LUNCH 12:30-1:15, 1:15-2:10, 2:10-3:05

		// MONDAY SCHEDULE
		// Period 1: 8:30 - 9:25 (Maths)
		{
			subjectClassId: subjectClasses[0].id,
			schoolLocationId: schoolLocations[7].id,
			dayOfWeek: schema.dayOfWeekEnum.monday,
			startTime: '08:30:00',
			duration: '00:55:00'
		},
		// Period 2: 9:25 - 10:20 (English)
		{
			subjectClassId: subjectClasses[3].id,
			schoolLocationId: schoolLocations[1].id,
			dayOfWeek: schema.dayOfWeekEnum.monday,
			startTime: '09:25:00',
			duration: '00:55:00'
		},
		// Period 3: 10:40 - 11:35 (Science)
		{
			subjectClassId: subjectClasses[1].id,
			schoolLocationId: schoolLocations[2].id,
			dayOfWeek: schema.dayOfWeekEnum.monday,
			startTime: '10:40:00',
			duration: '00:55:00'
		},
		// Period 4: 11:35 - 12:30 (History)
		{
			subjectClassId: subjectClasses[2].id,
			schoolLocationId: schoolLocations[1].id,
			dayOfWeek: schema.dayOfWeekEnum.monday,
			startTime: '11:35:00',
			duration: '00:55:00'
		},
		// Period 5: 1:15 - 2:10 (Geography)
		{
			subjectClassId: subjectClasses[4].id,
			schoolLocationId: schoolLocations[3].id,
			dayOfWeek: schema.dayOfWeekEnum.monday,
			startTime: '13:15:00',
			duration: '00:55:00'
		},
		// Period 6: 2:10 - 3:05 (Maths)
		{
			subjectClassId: subjectClasses[0].id,
			schoolLocationId: schoolLocations[7].id,
			dayOfWeek: schema.dayOfWeekEnum.monday,
			startTime: '14:10:00',
			duration: '00:55:00'
		},

		// TUESDAY SCHEDULE
		// Period 1: 8:30 - 9:25 (Science)
		{
			subjectClassId: subjectClasses[1].id,
			schoolLocationId: schoolLocations[2].id,
			dayOfWeek: schema.dayOfWeekEnum.tuesday,
			startTime: '08:30:00',
			duration: '00:55:00'
		},
		// Period 2: 9:25 - 10:20 (Maths)
		{
			subjectClassId: subjectClasses[0].id,
			schoolLocationId: schoolLocations[0].id, // Room 101
			dayOfWeek: schema.dayOfWeekEnum.tuesday,
			startTime: '09:25:00',
			duration: '00:55:00'
		},
		// Period 3: 10:40 - 11:35 (Geography)
		{
			subjectClassId: subjectClasses[4].id,
			schoolLocationId: schoolLocations[3].id,
			dayOfWeek: schema.dayOfWeekEnum.tuesday,
			startTime: '10:40:00',
			duration: '00:55:00'
		},
		// Period 4: 11:35 - 12:30 (English)
		{
			subjectClassId: subjectClasses[3].id,
			schoolLocationId: schoolLocations[1].id,
			dayOfWeek: schema.dayOfWeekEnum.tuesday,
			startTime: '11:35:00',
			duration: '00:55:00'
		},
		// Period 5: 1:15 - 2:10 (History)
		{
			subjectClassId: subjectClasses[2].id,
			schoolLocationId: schoolLocations[4].id,
			dayOfWeek: schema.dayOfWeekEnum.tuesday,
			startTime: '13:15:00',
			duration: '00:55:00'
		},
		// Period 6: 2:10 - 3:05 (Science)
		{
			subjectClassId: subjectClasses[1].id,
			schoolLocationId: schoolLocations[2].id,
			dayOfWeek: schema.dayOfWeekEnum.tuesday,
			startTime: '14:10:00',
			duration: '00:55:00'
		},

		// WEDNESDAY SCHEDULE
		// Period 1: 8:30 - 9:25 (English)
		{
			subjectClassId: subjectClasses[3].id,
			schoolLocationId: schoolLocations[1].id,
			dayOfWeek: schema.dayOfWeekEnum.wednesday,
			startTime: '08:30:00',
			duration: '00:55:00'
		},
		// Period 2: 9:25 - 10:20 (History)
		{
			subjectClassId: subjectClasses[2].id,
			schoolLocationId: schoolLocations[4].id,
			dayOfWeek: schema.dayOfWeekEnum.wednesday,
			startTime: '09:25:00',
			duration: '00:55:00'
		},
		// Period 3: 10:40 - 11:35 (Maths)
		{
			subjectClassId: subjectClasses[0].id,
			schoolLocationId: schoolLocations[0].id,
			dayOfWeek: schema.dayOfWeekEnum.wednesday,
			startTime: '10:40:00',
			duration: '00:55:00'
		},
		// Period 4: 11:35 - 12:30 (Geography)
		{
			subjectClassId: subjectClasses[4].id,
			schoolLocationId: schoolLocations[3].id,
			dayOfWeek: schema.dayOfWeekEnum.wednesday,
			startTime: '11:35:00',
			duration: '00:55:00'
		},
		// Period 5: 1:15 - 2:10 (Science)
		{
			subjectClassId: subjectClasses[1].id,
			schoolLocationId: schoolLocations[2].id,
			dayOfWeek: schema.dayOfWeekEnum.wednesday,
			startTime: '13:15:00',
			duration: '00:55:00'
		},
		// Period 6: 2:10 - 3:05 (English)
		{
			subjectClassId: subjectClasses[3].id,
			schoolLocationId: schoolLocations[1].id,
			dayOfWeek: schema.dayOfWeekEnum.wednesday,
			startTime: '14:10:00',
			duration: '00:55:00'
		},

		// THURSDAY SCHEDULE
		// Period 1: 8:30 - 9:25 (Geography)
		{
			subjectClassId: subjectClasses[4].id,
			schoolLocationId: schoolLocations[3].id,
			dayOfWeek: schema.dayOfWeekEnum.thursday,
			startTime: '08:30:00',
			duration: '00:55:00'
		},
		// Period 2: 9:25 - 10:20 (Science)
		{
			subjectClassId: subjectClasses[1].id,
			schoolLocationId: schoolLocations[2].id,
			dayOfWeek: schema.dayOfWeekEnum.thursday,
			startTime: '09:25:00',
			duration: '00:55:00'
		},
		// Period 3: 10:40 - 11:35 (English)
		{
			subjectClassId: subjectClasses[3].id,
			schoolLocationId: schoolLocations[1].id,
			dayOfWeek: schema.dayOfWeekEnum.thursday,
			startTime: '10:40:00',
			duration: '00:55:00'
		},
		// Period 4: 11:35 - 12:30 (Maths)
		{
			subjectClassId: subjectClasses[0].id,
			schoolLocationId: schoolLocations[0].id,
			dayOfWeek: schema.dayOfWeekEnum.thursday,
			startTime: '11:35:00',
			duration: '00:55:00'
		},
		// Period 5: 1:15 - 2:10 (English)
		{
			subjectClassId: subjectClasses[3].id,
			schoolLocationId: schoolLocations[1].id, // Room 102
			dayOfWeek: schema.dayOfWeekEnum.thursday,
			startTime: '13:15:00',
			duration: '00:55:00'
		},
		// Period 6: 2:10 - 3:05 (History)
		{
			subjectClassId: subjectClasses[2].id,
			schoolLocationId: schoolLocations[4].id, // Physics Lab
			dayOfWeek: schema.dayOfWeekEnum.thursday,
			startTime: '14:10:00',
			duration: '00:55:00'
		},

		// FRIDAY SCHEDULE
		// Period 1: 8:30 - 9:25 (History)
		{
			subjectClassId: subjectClasses[2].id,
			schoolLocationId: schoolLocations[4].id, // Physics Lab
			dayOfWeek: schema.dayOfWeekEnum.friday,
			startTime: '08:30:00',
			duration: '00:55:00'
		},
		// Period 2: 9:25 - 10:20 (Geography)
		{
			subjectClassId: subjectClasses[4].id,
			schoolLocationId: schoolLocations[3].id, // Computer Lab
			dayOfWeek: schema.dayOfWeekEnum.friday,
			startTime: '09:25:00',
			duration: '00:55:00'
		},
		// Period 3: 10:40 - 11:35 (History)
		{
			subjectClassId: subjectClasses[2].id,
			schoolLocationId: schoolLocations[4].id, // Physics Lab
			dayOfWeek: schema.dayOfWeekEnum.friday,
			startTime: '10:40:00',
			duration: '00:55:00'
		},
		// Period 4: 11:35 - 12:30 (Science)
		{
			subjectClassId: subjectClasses[1].id,
			schoolLocationId: schoolLocations[2].id, // Chemistry Lab A
			dayOfWeek: schema.dayOfWeekEnum.friday,
			startTime: '11:35:00',
			duration: '00:55:00'
		},
		// Period 5: 1:15 - 2:10 (Maths)
		{
			subjectClassId: subjectClasses[0].id,
			schoolLocationId: schoolLocations[0].id, // Room 101
			dayOfWeek: schema.dayOfWeekEnum.friday,
			startTime: '13:15:00',
			duration: '00:55:00'
		},
		// Period 6: 2:10 - 3:05 (Geography)
		{
			subjectClassId: subjectClasses[4].id,
			schoolLocationId: schoolLocations[3].id, // Computer Lab
			dayOfWeek: schema.dayOfWeekEnum.friday,
			startTime: '14:10:00',
			duration: '00:55:00'
		}
	]);

	await db.insert(schema.userSubjectClass).values([
		{
			userId: users[2].id, // teacher001
			subjectClassId: subjectClasses[0].id, // Maths
			role: schema.userSubjectClassRoleEnum.teacher
		},
		{
			userId: users[3].id, // teacher002
			subjectClassId: subjectClasses[1].id, // Science
			role: schema.userSubjectClassRoleEnum.teacher
		},
		{
			userId: users[4].id, // teacher003
			subjectClassId: subjectClasses[2].id, // History
			role: schema.userSubjectClassRoleEnum.teacher
		},
		{
			userId: users[5].id, // teacher004
			subjectClassId: subjectClasses[3].id, // English
			role: schema.userSubjectClassRoleEnum.teacher
		},
		{
			userId: users[6].id, // teacher005
			subjectClassId: subjectClasses[4].id, // Geography
			role: schema.userSubjectClassRoleEnum.teacher
		},
		{
			userId: users[7].id, // student001
			subjectClassId: subjectClasses[0].id, // Maths
			role: schema.userSubjectClassRoleEnum.student
		},
		{
			userId: users[7].id, // student001
			subjectClassId: subjectClasses[1].id, // Science
			role: schema.userSubjectClassRoleEnum.student
		},
		{
			userId: users[7].id, // student001
			subjectClassId: subjectClasses[2].id, // History
			role: schema.userSubjectClassRoleEnum.student
		},
		{
			userId: users[7].id, // student001
			subjectClassId: subjectClasses[3].id, // English
			role: schema.userSubjectClassRoleEnum.student
		},
		{
			userId: users[7].id, // student001
			subjectClassId: subjectClasses[4].id, // Geography
			role: schema.userSubjectClassRoleEnum.student
		},
		{
			userId: users[8].id, // student002
			subjectClassId: subjectClasses[0].id, // Maths
			role: schema.userSubjectClassRoleEnum.student
		},
		{
			userId: users[8].id, // student002
			subjectClassId: subjectClasses[1].id, // Science
			role: schema.userSubjectClassRoleEnum.student
		},
		{
			userId: users[8].id, // student002
			subjectClassId: subjectClasses[2].id, // History
			role: schema.userSubjectClassRoleEnum.student
		},
		{
			userId: users[8].id, // student002
			subjectClassId: subjectClasses[3].id, // English
			role: schema.userSubjectClassRoleEnum.student
		},
		{
			userId: users[8].id, // student002
			subjectClassId: subjectClasses[4].id, // Geography
			role: schema.userSubjectClassRoleEnum.student
		},
		{
			userId: users[9].id, // student003
			subjectClassId: subjectClasses[0].id, // Maths
			role: schema.userSubjectClassRoleEnum.student
		},
		{
			userId: users[9].id, // student003
			subjectClassId: subjectClasses[1].id, // Science
			role: schema.userSubjectClassRoleEnum.student
		},
		{
			userId: users[9].id, // student003
			subjectClassId: subjectClasses[2].id, // History
			role: schema.userSubjectClassRoleEnum.student
		},
		{
			userId: users[9].id, // student003
			subjectClassId: subjectClasses[3].id, // English
			role: schema.userSubjectClassRoleEnum.student
		},
		{
			userId: users[9].id, // student003
			subjectClassId: subjectClasses[4].id, // Geography
			role: schema.userSubjectClassRoleEnum.student
		}
	]);

	// Add after the existing subject class time insertions

	// Insert lesson topics for Math
	const mathLessonTopics = await db
		.insert(schema.lessonTopic)
		.values([
			{
				subjectClassId: subjectClasses[0].id,
				name: 'Algebra Basics',
				index: 0
			},
			{
				subjectClassId: subjectClasses[0].id,
				name: 'Linear Equations',
				index: 1
			},
			{
				subjectClassId: subjectClasses[0].id,
				name: 'Quadratic Functions',
				index: 2
			},
			{
				subjectClassId: subjectClasses[0].id,
				name: 'Geometry Fundamentals',
				index: 3
			},
			{
				subjectClassId: subjectClasses[0].id,
				name: 'Trigonometry',
				index: 4
			}
		])
		.returning();

	const lessons = await db
		.insert(schema.lesson)
		.values([
			// Algebra Basics lessons
			{
				lessonTopicId: mathLessonTopics[0].id,
				index: 0,
				title: 'Introduction to Variables',
				description: 'Learn about variables and their role in algebra',
				type: schema.lessonTypeEnum.lesson,
				lessonStatus: schema.lessonStatusEnum.draft
			},
			{
				lessonTopicId: mathLessonTopics[0].id,
				index: 1,
				title: 'Basic Operations with Variables',
				description: 'Addition, subtraction, multiplication and division with variables',
				type: schema.lessonTypeEnum.lesson,
				lessonStatus: schema.lessonStatusEnum.draft
			},
			{
				lessonTopicId: mathLessonTopics[0].id,
				index: 2,
				title: 'Simplifying Expressions',
				description: 'Learn to combine like terms and simplify algebraic expressions',
				type: schema.lessonTypeEnum.lesson,
				lessonStatus: schema.lessonStatusEnum.draft
			},

			// Linear Equations lessons
			{
				lessonTopicId: mathLessonTopics[1].id,
				index: 0,
				title: 'Solving One-Step Equations',
				description: 'Basic techniques for solving simple linear equations',
				type: schema.lessonTypeEnum.lesson,
				lessonStatus: schema.lessonStatusEnum.draft
			},
			{
				lessonTopicId: mathLessonTopics[1].id,
				index: 1,
				title: 'Solving Multi-Step Equations',
				description: 'Advanced techniques for complex linear equations',
				type: schema.lessonTypeEnum.lesson,
				lessonStatus: schema.lessonStatusEnum.draft
			},
			{
				lessonTopicId: mathLessonTopics[1].id,
				index: 2,
				title: 'Graphing Linear Equations',
				description: 'Visual representation of linear equations on coordinate plane',
				type: schema.lessonTypeEnum.lesson,
				lessonStatus: schema.lessonStatusEnum.draft
			},

			// Quadratic Functions lessons
			{
				lessonTopicId: mathLessonTopics[2].id,
				index: 0,
				title: 'Introduction to Quadratics',
				description: 'Understanding quadratic functions and their properties',
				type: schema.lessonTypeEnum.lesson,
				lessonStatus: schema.lessonStatusEnum.draft
			},
			{
				lessonTopicId: mathLessonTopics[2].id,
				index: 1,
				title: 'Factoring Quadratics',
				description: 'Methods for factoring quadratic expressions',
				type: schema.lessonTypeEnum.lesson,
				lessonStatus: schema.lessonStatusEnum.draft
			},
			{
				lessonTopicId: mathLessonTopics[2].id,
				index: 2,
				title: 'Quadratic Formula',
				description: 'Using the quadratic formula to solve equations',
				type: schema.lessonTypeEnum.lesson,
				lessonStatus: schema.lessonStatusEnum.draft
			},

			// Geometry Fundamentals lessons
			{
				lessonTopicId: mathLessonTopics[3].id,
				index: 0,
				title: 'Points, Lines, and Planes',
				description: 'Basic geometric concepts and definitions',
				type: schema.lessonTypeEnum.lesson,
				lessonStatus: schema.lessonStatusEnum.draft
			},
			{
				lessonTopicId: mathLessonTopics[3].id,
				index: 1,
				title: 'Angles and Their Measures',
				description: 'Understanding different types of angles',
				type: schema.lessonTypeEnum.lesson,
				lessonStatus: schema.lessonStatusEnum.draft
			},
			{
				lessonTopicId: mathLessonTopics[3].id,
				index: 2,
				title: 'Triangles and Their Properties',
				description: 'Exploring triangle classifications and properties',
				type: schema.lessonTypeEnum.lesson,
				lessonStatus: schema.lessonStatusEnum.draft
			},

			// Trigonometry lessons
			{
				lessonTopicId: mathLessonTopics[4].id,
				index: 0,
				title: 'Introduction to Trigonometry',
				description: 'Basic trigonometric concepts and ratios',
				type: schema.lessonTypeEnum.lesson,
				lessonStatus: schema.lessonStatusEnum.draft
			},
			{
				lessonTopicId: mathLessonTopics[4].id,
				index: 1,
				title: 'Sine, Cosine, and Tangent',
				description: 'Understanding the primary trigonometric functions',
				type: schema.lessonTypeEnum.lesson,
				lessonStatus: schema.lessonStatusEnum.draft
			},
			{
				lessonTopicId: mathLessonTopics[4].id,
				index: 2,
				title: 'Solving Right Triangles',
				description: 'Using trigonometry to find missing sides and angles',
				type: schema.lessonTypeEnum.lesson,
				lessonStatus: schema.lessonStatusEnum.draft
			}
		])
		.returning();

	// Create default whiteboard for the first lesson
	await db
		.insert(schema.whiteboard)
		.values({
			lessonId: lessons[0].id,
			title: 'Default Whiteboard'
		})
		.returning();
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
