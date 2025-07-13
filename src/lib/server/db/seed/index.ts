import * as schema from '../schema';
import {
	userTypeEnum,
	userGenderEnum,
	userHonorificEnum,
	schoolLocationTypeEnum,
	dayOfWeekEnum,
	userSubjectOfferingRoleEnum,
	userSubjectOfferingClassRoleEnum,
	yearLevelEnum
} from '../schema';
import { hash } from '@node-rs/argon2';
import { randomUUID } from 'crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error('DATABASE_URL is not set in environment variables');
}

const client = postgres(databaseUrl);

export const db = drizzle(client, { schema });

async function seed() {
	try {
		const [schoolRecord] = await db
			.insert(schema.school)
			.values({
				name: 'School of eddi',
				emailSuffix: 'eddi.edu'
			})
			.returning();

		const [campusRecord] = await db
			.insert(schema.campus)
			.values({
				schoolId: schoolRecord.id,
				name: 'Main Campus',
				address: '123 Education Street, Melbourne VIC 3000',
				description: 'Primary campus of School of eddi'
			})
			.returning();

		const locations = await db
			.insert(schema.schoolLocation)
			.values([
				{
					campusId: campusRecord.id,
					name: 'Science Lab A',
					type: schoolLocationTypeEnum.laboratory,
					capacity: 30,
					isArchived: false
				},
				{
					campusId: campusRecord.id,
					name: 'Classroom 101',
					type: schoolLocationTypeEnum.classroom,
					capacity: 25,
					isArchived: false
				},
				{
					campusId: campusRecord.id,
					name: 'Mathematics Room',
					type: schoolLocationTypeEnum.classroom,
					capacity: 30,
					isArchived: false
				},
				{
					campusId: campusRecord.id,
					name: 'English Room',
					type: schoolLocationTypeEnum.classroom,
					capacity: 28,
					isArchived: false
				},
				{
					campusId: campusRecord.id,
					name: 'Gymnasium',
					type: schoolLocationTypeEnum.gymnasium,
					capacity: 200,
					isArchived: false
				}
			])
			.returning();

		const [curriculumRecord] = await db
			.insert(schema.curriculum)
			.values({
				name: 'Victorian Curriculum',
				version: '2.0'
			})
			.returning();

		const curriculumSubjects = await db
			.insert(schema.curriculumSubject)
			.values([
				{
					name: 'Mathematics',
					curriculumId: curriculumRecord.id
				},
				{
					name: 'English',
					curriculumId: curriculumRecord.id
				},
				{
					name: 'Science',
					curriculumId: curriculumRecord.id
				},
				{
					name: 'Physical Education',
					curriculumId: curriculumRecord.id
				}
			])
			.returning();

		const coreSubjects = await db
			.insert(schema.coreSubject)
			.values([
				{
					name: 'Year 9 Mathematics',
					description: 'Core mathematics for Year 9 students',
					curriculumSubjectId: curriculumSubjects[0].id,
					schoolId: schoolRecord.id
				},
				{
					name: 'Year 9 English',
					description: 'Core English for Year 9 students',
					curriculumSubjectId: curriculumSubjects[1].id,
					schoolId: schoolRecord.id
				},
				{
					name: 'Year 9 Science',
					description: 'Core Science for Year 9 students',
					curriculumSubjectId: curriculumSubjects[2].id,
					schoolId: schoolRecord.id
				},
				{
					name: 'Year 9 Physical Education',
					description: 'Core PE for Year 9 students',
					curriculumSubjectId: curriculumSubjects[3].id,
					schoolId: schoolRecord.id
				}
			])
			.returning();

		const subjects = await db
			.insert(schema.subject)
			.values([
				{
					name: 'Year 9 Mathematics',
					schoolId: schoolRecord.id,
					coreSubjectId: coreSubjects[0].id,
					yearLevel: yearLevelEnum.year9
				},
				{
					name: 'Year 9 English',
					schoolId: schoolRecord.id,
					coreSubjectId: coreSubjects[1].id,
					yearLevel: yearLevelEnum.year9
				},
				{
					name: 'Year 9 Science',
					schoolId: schoolRecord.id,
					coreSubjectId: coreSubjects[2].id,
					yearLevel: yearLevelEnum.year9
				},
				{
					name: 'Year 9 Physical Education',
					schoolId: schoolRecord.id,
					coreSubjectId: coreSubjects[3].id,
					yearLevel: yearLevelEnum.year9
				}
			])
			.returning();

		const subjectOfferings = await db
			.insert(schema.subjectOffering)
			.values([
				{
					subjectId: subjects[0].id,
					year: 2025,
					semester: 1,
					campusId: campusRecord.id
				},
				{
					subjectId: subjects[1].id,
					year: 2025,
					semester: 1,
					campusId: campusRecord.id
				},
				{
					subjectId: subjects[2].id,
					year: 2025,
					semester: 1,
					campusId: campusRecord.id
				},
				{
					subjectId: subjects[3].id,
					year: 2025,
					semester: 1,
					campusId: campusRecord.id
				}
			])
			.returning();

		const subjectOfferingClasses = await db
			.insert(schema.subjectOfferingClass)
			.values([
				{
					name: 'Class A',
					subOfferingId: subjectOfferings[0].id // Math
				},
				{
					name: 'Class A',
					subOfferingId: subjectOfferings[1].id // English
				},
				{
					name: 'Class A',
					subOfferingId: subjectOfferings[2].id // Science
				},
				{
					name: 'Class A',
					subOfferingId: subjectOfferings[3].id // PE
				}
			])
			.returning();

		// Create users
		const passwordHash = await hash('password123');

		const [systemAdmin] = await db
			.insert(schema.user)
			.values({
				id: randomUUID(),
				email: 'root@eddi.com.au',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.systemAdmin,
				gender: userGenderEnum.unspecified,
				honorific: userHonorificEnum.mr,
				firstName: 'System',
				lastName: 'Admin'
			})
			.returning();

		const [schoolAdmin] = await db
			.insert(schema.user)
			.values({
				id: randomUUID(),
				email: 'admin@eddi.edu',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.schoolAdmin,
				gender: userGenderEnum.female,
				honorific: userHonorificEnum.ms,
				firstName: 'School',
				lastName: 'Admin'
			})
			.returning();

		// Students
		const [student1] = await db
			.insert(schema.user)
			.values({
				id: randomUUID(),
				email: 'student001@eddi.edu',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.student,
				gender: userGenderEnum.female,
				firstName: 'Student',
				lastName: 'One',
				dateOfBirth: new Date('2009-03-15')
			})
			.returning();

		const [student2] = await db
			.insert(schema.user)
			.values({
				id: randomUUID(),
				email: 'student002@eddi.edu',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.student,
				gender: userGenderEnum.male,
				firstName: 'Student',
				lastName: 'Two',
				dateOfBirth: new Date('2009-07-22')
			})
			.returning();

		const [student3] = await db
			.insert(schema.user)
			.values({
				id: randomUUID(),
				email: 'student003@eddi.edu',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.student,
				gender: userGenderEnum.male,
				firstName: 'Student',
				lastName: 'Three',
				dateOfBirth: new Date('2009-11-08')
			})
			.returning();

		// Create one teacher for each subject
		const teacherIds: string[] = [];
		const teachers = [
			{
				firstName: 'Math',
				lastName: 'Teacher',
				email: 'm.teacher@eddi.edu'
			},
			{
				firstName: 'English',
				lastName: 'Teacher',
				email: 'e.teacher@eddi.edu'
			},
			{
				firstName: 'Science',
				lastName: 'Teacher',
				email: 's.teacher@eddi.edu'
			},
			{
				firstName: 'PE',
				lastName: 'Teacher',
				email: 'pe.teacher@eddi.edu'
			}
		];

		for (const teacher of teachers) {
			const [newTeacher] = await db
				.insert(schema.user)
				.values({
					id: randomUUID(),
					email: teacher.email,
					passwordHash,
					schoolId: schoolRecord.id,
					type: userTypeEnum.teacher,
					gender: userGenderEnum.unspecified,
					honorific: userHonorificEnum.mr,
					firstName: teacher.firstName,
					lastName: teacher.lastName
				})
				.returning();

			teacherIds.push(newTeacher.id);
		}

		// Assign users to campus
		const allUserIds = [
			systemAdmin.id,
			schoolAdmin.id,
			student1.id,
			student2.id,
			student3.id,
			...teacherIds
		];
		await db.insert(schema.userCampus).values(
			allUserIds.map((userId) => ({
				userId,
				campusId: campusRecord.id
			}))
		);

		const studentIds = [student1.id, student2.id, student3.id];
		for (const studentId of studentIds) {
			for (const subjectOffering of subjectOfferings) {
				await db.insert(schema.userSubjectOffering).values({
					userId: studentId,
					subOfferingId: subjectOffering.id,
					role: userSubjectOfferingRoleEnum.student
				});
			}
		}

		// Assign teachers to subject offerings
		for (let i = 0; i < teacherIds.length && i < subjectOfferings.length; i++) {
			await db.insert(schema.userSubjectOffering).values({
				userId: teacherIds[i],
				subOfferingId: subjectOfferings[i].id,
				role: userSubjectOfferingRoleEnum.teacher
			});
		}

		// Enroll students in subject offering classes
		for (const studentId of studentIds) {
			for (const subjectOfferingClass of subjectOfferingClasses) {
				await db.insert(schema.userSubjectOfferingClass).values({
					userId: studentId,
					subOffClassId: subjectOfferingClass.id,
					role: userSubjectOfferingClassRoleEnum.student
				});
			}
		}

		// Assign teachers to subject offering classes
		for (let i = 0; i < teacherIds.length && i < subjectOfferingClasses.length; i++) {
			await db.insert(schema.userSubjectOfferingClass).values({
				userId: teacherIds[i],
				subOffClassId: subjectOfferingClasses[i].id,
				role: userSubjectOfferingClassRoleEnum.teacher
			});
		}

		// Create basic timetable (class allocations)
		const timetableEntries = [
			{
				subjectOfferingClassId: subjectOfferingClasses[0].id, // Math
				schoolLocationId: locations[2].id, // Mathematics Room
				dayOfWeek: dayOfWeekEnum.monday,
				startTime: '09:00:00',
				duration: '01:00:00'
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[1].id, // English
				schoolLocationId: locations[3].id, // English Room
				dayOfWeek: dayOfWeekEnum.tuesday,
				startTime: '10:00:00',
				duration: '01:00:00'
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[2].id, // Science
				schoolLocationId: locations[0].id, // Science Lab A
				dayOfWeek: dayOfWeekEnum.wednesday,
				startTime: '11:00:00',
				duration: '01:00:00'
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[3].id, // PE
				schoolLocationId: locations[4].id, // Gymnasium
				dayOfWeek: dayOfWeekEnum.thursday,
				startTime: '14:00:00',
				duration: '01:00:00'
			},
			// Add some additional sessions
			{
				subjectOfferingClassId: subjectOfferingClasses[0].id, // Math (second session)
				schoolLocationId: locations[2].id, // Mathematics Room
				dayOfWeek: dayOfWeekEnum.friday,
				startTime: '09:00:00',
				duration: '01:00:00'
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[1].id, // English (second session)
				schoolLocationId: locations[3].id, // English Room
				dayOfWeek: dayOfWeekEnum.friday,
				startTime: '10:00:00',
				duration: '01:00:00'
			}
		];

		await db.insert(schema.subjectClassAllocation).values(timetableEntries);
	} catch (error) {
		console.error('❌ Error seeding database:', error);
		throw error;
	}
}

seed()
	.then(() => {
		console.log('Seeding completed');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Seeding failed:', error);
		process.exit(1);
	});
