import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../schema';
import postgres from 'postgres';
import { hash } from '@node-rs/argon2';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

export async function seed_students(schoolId: number) {
	const passwordHash = await hash('student');

	// Seed student users
	const students = await db
		.insert(schema.user)
		.values([
			{
				id: 'student_001',
				email: 'emma.thompson@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('2007-03-15'),
				firstName: 'Emma',
				lastName: 'Thompson'
			},
			{
				id: 'student_002',
				email: 'liam.chen@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('2007-08-22'),
				firstName: 'Liam',
				lastName: 'Chen'
			},
			{
				id: 'student_003',
				email: 'sophia.rodriguez@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('2006-12-03'),
				firstName: 'Sophia',
				lastName: 'Rodriguez'
			},
			{
				id: 'student_004',
				email: 'mason.williams@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('2007-05-18'),
				firstName: 'Mason',
				lastName: 'Williams'
			},
			{
				id: 'student_005',
				email: 'olivia.patel@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('2007-01-30'),
				firstName: 'Olivia',
				lastName: 'Patel'
			},
			{
				id: 'student_006',
				email: 'ethan.johnson@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('2006-11-12'),
				firstName: 'Ethan',
				lastName: 'Johnson'
			},
			{
				id: 'student_007',
				email: 'ava.singh@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('2007-09-07'),
				firstName: 'Ava',
				lastName: 'Singh'
			},
			{
				id: 'student_008',
				email: 'noah.martinez@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('2006-04-25'),
				firstName: 'Noah',
				lastName: 'Martinez'
			},
			{
				id: 'student_009',
				email: 'isabella.brown@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('2007-07-14'),
				firstName: 'Isabella',
				lastName: 'Brown'
			},
			{
				id: 'student_010',
				email: 'lucas.kim@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('2006-10-09'),
				firstName: 'Lucas',
				lastName: 'Kim'
			},
			{
				id: 'student_011',
				email: 'mia.davis@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('2007-02-28'),
				firstName: 'Mia',
				lastName: 'Davis'
			},
			{
				id: 'student_012',
				email: 'alexander.lee@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('2006-06-16'),
				firstName: 'Alexander',
				lastName: 'Lee'
			},
			{
				id: 'student_013',
				email: 'charlotte.wilson@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('2007-04-11'),
				firstName: 'Charlotte',
				lastName: 'Wilson'
			},
			{
				id: 'student_014',
				email: 'benjamin.taylor@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('2006-12-20'),
				firstName: 'Benjamin',
				lastName: 'Taylor'
			},
			{
				id: 'student_015',
				email: 'amelia.garcia@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('2007-08-05'),
				firstName: 'Amelia',
				lastName: 'Garcia'
			},
			{
				id: 'student_016',
				email: 'james.anderson@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('2006-03-23'),
				firstName: 'James',
				lastName: 'Anderson'
			},
			{
				id: 'student_017',
				email: 'harper.miller@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('2007-11-08'),
				firstName: 'Harper',
				lastName: 'Miller'
			},
			{
				id: 'student_018',
				email: 'samuel.jackson@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('2006-07-17'),
				firstName: 'Samuel',
				lastName: 'Jackson'
			},
			{
				id: 'student_019',
				email: 'evelyn.white@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('2007-01-12'),
				firstName: 'Evelyn',
				lastName: 'White'
			},
			{
				id: 'student_020',
				email: 'daniel.moore@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('2006-09-29'),
				firstName: 'Daniel',
				lastName: 'Moore'
			},
			{
				id: 'student_021',
				email: 'abigail.thomas@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('2007-06-04'),
				firstName: 'Abigail',
				lastName: 'Thomas'
			},
			{
				id: 'student_022',
				email: 'michael.zhang@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('2006-02-14'),
				firstName: 'Michael',
				lastName: 'Zhang'
			},
			{
				id: 'student_023',
				email: 'emily.clark@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('2007-10-19'),
				firstName: 'Emily',
				lastName: 'Clark'
			},
			{
				id: 'student_024',
				email: 'david.kumar@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('2006-05-31'),
				firstName: 'David',
				lastName: 'Kumar'
			},
			{
				id: 'student_025',
				email: 'grace.robinson@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('2007-12-26'),
				firstName: 'Grace',
				lastName: 'Robinson'
			},
			{
				id: 'student_026',
				email: 'ryan.oconnor@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('2006-08-13'),
				firstName: 'Ryan',
				lastName: "O'Connor"
			},
			{
				id: 'student_027',
				email: 'chloe.lewis@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('2007-03-21'),
				firstName: 'Chloe',
				lastName: 'Lewis'
			},
			{
				id: 'student_028',
				email: 'jack.murphy@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('2006-11-06'),
				firstName: 'Jack',
				lastName: 'Murphy'
			},
			{
				id: 'student_029',
				email: 'zoe.walker@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('2007-07-09'),
				firstName: 'Zoe',
				lastName: 'Walker'
			},
			{
				id: 'student_030',
				email: 'tyler.nguyen@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('2006-04-02'),
				firstName: 'Tyler',
				lastName: 'Nguyen'
			},
			{
				id: 'student_031',
				email: 'lily.hall@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('2007-09-15'),
				firstName: 'Lily',
				lastName: 'Hall'
			},
			{
				id: 'student_032',
				email: 'jordan.green@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.nonBinary,
				dateOfBirth: new Date('2006-01-28'),
				firstName: 'Jordan',
				lastName: 'Green'
			},
			{
				id: 'student_033',
				email: 'maya.brooks@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('2007-05-07'),
				firstName: 'Maya',
				lastName: 'Brooks'
			},
			{
				id: 'student_034',
				email: 'cameron.smith@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('2006-10-24'),
				firstName: 'Cameron',
				lastName: 'Smith'
			},
			{
				id: 'student_035',
				email: 'natalie.adams@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('2007-02-11'),
				firstName: 'Natalie',
				lastName: 'Adams'
			},
			{
				id: 'student_036',
				email: 'connor.walsh@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('2006-12-01'),
				firstName: 'Connor',
				lastName: 'Walsh'
			},
			{
				id: 'student_037',
				email: 'brooke.campbell@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('2007-08-18'),
				firstName: 'Brooke',
				lastName: 'Campbell'
			},
			{
				id: 'student_038',
				email: 'dylan.foster@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('2006-06-25'),
				firstName: 'Dylan',
				lastName: 'Foster'
			},
			{
				id: 'student_039',
				email: 'paige.cooper@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('2007-04-03'),
				firstName: 'Paige',
				lastName: 'Cooper'
			},
			{
				id: 'student_040',
				email: 'austin.reid@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('2006-11-20'),
				firstName: 'Austin',
				lastName: 'Reid'
			},
			{
				id: 'student_041',
				email: 'madeline.king@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('2007-01-06'),
				firstName: 'Madeline',
				lastName: 'King'
			},
			{
				id: 'student_042',
				email: 'logan.stewart@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('2006-07-23'),
				firstName: 'Logan',
				lastName: 'Stewart'
			},
			{
				id: 'student_043',
				email: 'haley.torres@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('2007-03-10'),
				firstName: 'Haley',
				lastName: 'Torres'
			},
			{
				id: 'student_044',
				email: 'blake.hughes@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('2006-09-14'),
				firstName: 'Blake',
				lastName: 'Hughes'
			},
			{
				id: 'student_045',
				email: 'rachel.peterson@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('2007-05-27'),
				firstName: 'Rachel',
				lastName: 'Peterson'
			},
			{
				id: 'student_046',
				email: 'trevor.collins@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('2006-02-08'),
				firstName: 'Trevor',
				lastName: 'Collins'
			},
			{
				id: 'student_047',
				email: 'samantha.bell@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: schoolId,
				type: schema.userTypeEnum.student,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('2007-10-12'),
				firstName: 'Samantha',
				lastName: 'Bell'
			}
		])
		.returning();

	console.log('Seeded students:', students.length, 'student users');

	// Log summary by gender
	const genderCounts = students.reduce(
		(acc, student) => {
			acc[student.gender || 'unspecified'] = (acc[student.gender || 'unspecified'] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>
	);

	console.log('Gender distribution:', genderCounts);

	return { students };
}
