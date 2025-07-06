import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../schema';
import postgres from 'postgres';
import { hash } from '@node-rs/argon2';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

export async function seed_teachers() {
	const passwordHash = await hash('teacher');

	// Seed teacher users
	const teachers = await db
		.insert(schema.user)
		.values([
			{
				id: 'teacher_001',
				email: 'david.thompson@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: 1,
				type: schema.userTypeEnum.teacher,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('1985-04-12'),
				honorific: schema.userHonorificEnum.mr,
				firstName: 'David',
				lastName: 'Thompson'
			},
			{
				id: 'teacher_002',
				email: 'jennifer.walsh@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: 1,
				type: schema.userTypeEnum.teacher,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('1982-09-28'),
				honorific: schema.userHonorificEnum.mrs,
				firstName: 'Jennifer',
				lastName: 'Walsh'
			},
			{
				id: 'teacher_003',
				email: 'amanda.rodriguez@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: 1,
				type: schema.userTypeEnum.teacher,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('1988-01-15'),
				honorific: schema.userHonorificEnum.ms,
				firstName: 'Amanda',
				lastName: 'Rodriguez'
			},
			{
				id: 'teacher_004',
				email: 'robert.johnson@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: 1,
				type: schema.userTypeEnum.teacher,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('1979-11-03'),
				honorific: schema.userHonorificEnum.mr,
				firstName: 'Robert',
				lastName: 'Johnson'
			},
			{
				id: 'teacher_005',
				email: 'lisa.patel@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: 1,
				type: schema.userTypeEnum.teacher,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('1986-07-22'),
				honorific: schema.userHonorificEnum.mrs,
				firstName: 'Lisa',
				lastName: 'Patel'
			},
			{
				id: 'teacher_006',
				email: 'christopher.wilson@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: 1,
				type: schema.userTypeEnum.teacher,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('1983-12-08'),
				honorific: schema.userHonorificEnum.mr,
				firstName: 'Christopher',
				lastName: 'Wilson'
			},
			{
				id: 'teacher_007',
				email: 'rachel.anderson@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: 1,
				type: schema.userTypeEnum.teacher,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('1990-05-17'),
				honorific: schema.userHonorificEnum.ms,
				firstName: 'Rachel',
				lastName: 'Anderson'
			},
			{
				id: 'teacher_008',
				email: 'james.murphy@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: 1,
				type: schema.userTypeEnum.teacher,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('1981-03-25'),
				honorific: schema.userHonorificEnum.mr,
				firstName: 'James',
				lastName: 'Murphy'
			},
			{
				id: 'teacher_009',
				email: 'daniel.lee@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: 1,
				type: schema.userTypeEnum.teacher,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('1987-10-14'),
				honorific: schema.userHonorificEnum.mr,
				firstName: 'Daniel',
				lastName: 'Lee'
			},
			{
				id: 'teacher_010',
				email: 'emily.parker@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: 1,
				type: schema.userTypeEnum.teacher,
				gender: schema.userGenderEnum.female,
				dateOfBirth: new Date('1984-06-30'),
				honorific: schema.userHonorificEnum.ms,
				firstName: 'Emily',
				lastName: 'Parker'
			}
		])
		.returning();

	console.log('Seeded teachers:', teachers.length, 'teacher users');

	// Log summary by honorific and gender
	const honorificCounts = teachers.reduce(
		(acc, teacher) => {
			acc[teacher.honorific || 'unspecified'] = (acc[teacher.honorific || 'unspecified'] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>
	);

	const genderCounts = teachers.reduce(
		(acc, teacher) => {
			acc[teacher.gender || 'unspecified'] = (acc[teacher.gender || 'unspecified'] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>
	);

	console.log('Honorific distribution:', honorificCounts);
	console.log('Gender distribution:', genderCounts);

	return { teachers };
}
