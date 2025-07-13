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
import { VCAAF10Scraper } from './scraper/index';
import { eq } from 'drizzle-orm';
import { reset } from 'drizzle-seed';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error('DATABASE_URL is not set in environment variables');
}

const client = postgres(databaseUrl);

export const db = drizzle(client, { schema });

async function seed() {
	await reset(db, schema);
	try {
		console.log('🌱 Starting database seeding...');

		const [schoolRecord] = await db
			.insert(schema.school)
			.values({
				name: 'School of eddi',
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
					name: 'Mathematics',
					description: 'Core mathematics',
					curriculumSubjectId: curriculumSubjects[0].id,
					schoolId: schoolRecord.id
				},
				{
					name: 'English',
					description: 'Core English',
					curriculumSubjectId: curriculumSubjects[1].id,
					schoolId: schoolRecord.id
				},
				{
					name: 'Science',
					description: 'Core Science',
					curriculumSubjectId: curriculumSubjects[2].id,
					schoolId: schoolRecord.id
				},
				{
					name: 'Physical Education',
					description: 'Core PE',
					curriculumSubjectId: curriculumSubjects[3].id,
					schoolId: schoolRecord.id
				}
			])
			.returning();

		// Create subjects for Foundation to Year 10 (F-10) for each core subject
		const subjects: (typeof schema.subject.$inferSelect)[] = [];
		const yearLevels = [
			{ level: yearLevelEnum.foundation, name: 'Foundation' },
			{ level: yearLevelEnum.year1, name: 'Year 1' },
			{ level: yearLevelEnum.year2, name: 'Year 2' },
			{ level: yearLevelEnum.year3, name: 'Year 3' },
			{ level: yearLevelEnum.year4, name: 'Year 4' },
			{ level: yearLevelEnum.year5, name: 'Year 5' },
			{ level: yearLevelEnum.year6, name: 'Year 6' },
			{ level: yearLevelEnum.year7, name: 'Year 7' },
			{ level: yearLevelEnum.year8, name: 'Year 8' },
			{ level: yearLevelEnum.year9, name: 'Year 9' },
			{ level: yearLevelEnum.year10, name: 'Year 10' }
		];

		for (const coreSubject of coreSubjects) {
			for (const yearLevel of yearLevels) {
				const subjectValues = {
					name: `${yearLevel.name} ${coreSubject.name}`,
					schoolId: schoolRecord.id,
					coreSubjectId: coreSubject.id,
					yearLevel: yearLevel.level
				};

				const [subject] = await db.insert(schema.subject).values(subjectValues).returning();
				subjects.push(subject);
			}
		}

		// Create subject offerings for all F-10 subjects (both semester 1 and 2)
		const subjectOfferings: (typeof schema.subjectOffering.$inferSelect)[] = [];
		for (const subject of subjects) {
			// Create semester 1 offering
			const sem1OfferingValues = {
				subjectId: subject.id,
				year: 2025,
				semester: 1,
				campusId: campusRecord.id
			};
			const [sem1Offering] = await db
				.insert(schema.subjectOffering)
				.values(sem1OfferingValues)
				.returning();
			subjectOfferings.push(sem1Offering);

			// Create semester 2 offering
			const sem2OfferingValues = {
				subjectId: subject.id,
				year: 2025,
				semester: 2,
				campusId: campusRecord.id
			};
			const [sem2Offering] = await db
				.insert(schema.subjectOffering)
				.values(sem2OfferingValues)
				.returning();
			subjectOfferings.push(sem2Offering);
		}

		// Filter to get only Year 9 offerings for student/teacher assignments
		const year9Offerings = subjectOfferings.filter((offering) => {
			const subject = subjects.find((s) => s.id === offering.subjectId);
			return subject && subject.yearLevel === yearLevelEnum.year9;
		});

		// Initialize VCAA scraper and scrape core subjects
		console.log('🎯 Initializing VCAA F-10 curriculum scraper...');
		const scraper = new VCAAF10Scraper();

		// Scrape core subject content from VCAA
		const contentItems = await scraper.scrapeCoreSubjects();

		// Create learning areas for scraped content
		const learningAreaMap = new Map<string, number>();
		const uniqueLearningAreas = [...new Set(contentItems.map((item) => item.learningArea))];

		for (const learningAreaName of uniqueLearningAreas) {
			// Find a content item with this learning area to get its strand (broad subject)
			const sampleItem = contentItems.find((item) => item.learningArea === learningAreaName);
			if (!sampleItem) continue;

			// Find the corresponding curriculum subject using the strand
			const curriculumSubject = curriculumSubjects.find(
				(cs) =>
					cs.name.toLowerCase().includes(sampleItem.strand.toLowerCase()) ||
					sampleItem.strand.toLowerCase().includes(cs.name.toLowerCase())
			);

			if (curriculumSubject) {
				const [learningArea] = await db
					.insert(schema.learningArea)
					.values({
						curriculumSubjectId: curriculumSubject.id,
						name: learningAreaName,
						description: `${learningAreaName} learning area from VCAA F-10 curriculum`
					})
					.returning();

				learningAreaMap.set(learningAreaName, learningArea.id);
			}
		}

		// Create learning area content for each scraped item
		const learningAreaContentMap = new Map<string, number>();

		for (const item of contentItems) {
			const learningAreaId = learningAreaMap.get(item.learningArea);
			if (!learningAreaId) continue;

			// Check if this content already exists to avoid duplicates
			const existingContent = await db
				.select()
				.from(schema.learningAreaContent)
				.where(eq(schema.learningAreaContent.name, item.vcaaCode))
				.limit(1);

			if (existingContent.length === 0) {
				// Convert yearLevel string to enum value
				const normalizedYearLevel = item.yearLevel
					.toLowerCase()
					.replace(/\s+/g, '')
					.replace('year', '');
				let yearLevelValue: (typeof yearLevelEnum)[keyof typeof yearLevelEnum];

				if (normalizedYearLevel === 'foundation') {
					yearLevelValue = yearLevelEnum.foundation;
				} else if (normalizedYearLevel === '1') {
					yearLevelValue = yearLevelEnum.year1;
				} else if (normalizedYearLevel === '2') {
					yearLevelValue = yearLevelEnum.year2;
				} else if (normalizedYearLevel === '3') {
					yearLevelValue = yearLevelEnum.year3;
				} else if (normalizedYearLevel === '4') {
					yearLevelValue = yearLevelEnum.year4;
				} else if (normalizedYearLevel === '5') {
					yearLevelValue = yearLevelEnum.year5;
				} else if (normalizedYearLevel === '6') {
					yearLevelValue = yearLevelEnum.year6;
				} else if (normalizedYearLevel === '7') {
					yearLevelValue = yearLevelEnum.year7;
				} else if (normalizedYearLevel === '8') {
					yearLevelValue = yearLevelEnum.year8;
				} else if (normalizedYearLevel === '9') {
					yearLevelValue = yearLevelEnum.year9;
				} else if (normalizedYearLevel === '10') {
					yearLevelValue = yearLevelEnum.year10;
				} else {
					yearLevelValue = yearLevelEnum.foundation; // Default fallback
				}

				const [learningAreaContent] = await db
					.insert(schema.learningAreaContent)
					.values({
						learningAreaId: learningAreaId,
						name: item.vcaaCode,
						description: `${item.strand}: ${item.description}`,
						yearLevel: yearLevelValue
					})
					.returning();

				learningAreaContentMap.set(item.vcaaCode, learningAreaContent.id);

				// Create elaborations for this content item
				for (const elaboration of item.elaborations) {
					await db.insert(schema.contentElaboration).values({
						learningAreaContentId: learningAreaContent.id,
						name: `Elaboration for ${item.vcaaCode}`,
						contentElaboration: elaboration
					});
				}
			}
		}

		console.log(`📝 Created ${learningAreaContentMap.size} learning area content items`);

		// Create 18-week coursemap items for each subject offering
		const courseMapItems = [];
		const weeksPerSemester = 18;

		for (const offering of subjectOfferings) {
			// Find the corresponding subject and core subject info
			const subject = subjects.find((s) => s.id === offering.subjectId);
			if (!subject) continue;

			const coreSubject = coreSubjects.find((cs) => cs.id === subject.coreSubjectId);
			if (!coreSubject) continue;

			// Use the core subject name (which is clean without "Year 9")
			const subjectName = coreSubject.name;
			const baseTopics = getBaseTopicsForSubject(subjectName);
			const duration = 6;

			// Distribute topics across 18 weeks
			for (let week = 1; week <= weeksPerSemester; week += duration) {
				const topicIndex = Math.floor(((week - 1) / weeksPerSemester) * baseTopics.length);
				const topic = baseTopics[topicIndex] || `${subjectName} Review`;

				const [courseMapItem] = await db
					.insert(schema.courseMapItem)
					.values({
						subjectOfferingId: offering.id,
						topic: `Week ${week}: ${topic}`,
						description: `${topic} activities and learning for ${subjectName}`,
						startWeek: week,
						duration: duration,
						semester: offering.semester,
						color: getSubjectColor(subjectName)
					})
					.returning();

				courseMapItems.push(courseMapItem);

				// Link to relevant learning areas if available
				const relevantLearningAreaId = learningAreaMap.get(getSubjectLearningArea(subjectName));
				if (relevantLearningAreaId) {
					await db.insert(schema.courseMapItemLearningArea).values({
						courseMapItemId: courseMapItem.id,
						learningAreaId: relevantLearningAreaId
					});
				}
			}
		}

		// Helper function to get base topics for each subject
		function getBaseTopicsForSubject(subjectName: string): string[] {
			const topicMap: { [key: string]: string[] } = {
				Mathematics: [
					'Number and Algebra',
					'Measurement and Geometry',
					'Statistics and Probability',
					'Linear Equations',
					'Quadratic Functions',
					'Trigonometry',
					'Data Analysis'
				],
				English: [
					'Reading Comprehension',
					'Creative Writing',
					'Poetry Analysis',
					'Essay Writing',
					'Literature Study',
					'Media Literacy',
					'Oral Presentations',
					'Grammar and Language'
				],
				Science: [
					'Biology Fundamentals',
					'Chemistry Basics',
					'Physics Principles',
					'Scientific Method',
					'Environmental Science',
					'Human Body Systems',
					'Chemical Reactions',
					'Energy and Motion'
				],
				'Physical Education': [
					'Fitness and Health',
					'Team Sports',
					'Individual Sports',
					'Motor Skills',
					'Sports Psychology',
					'Nutrition',
					'Injury Prevention',
					'Game Strategy'
				]
			};

			return (
				topicMap[subjectName] || [
					`${subjectName} Fundamentals`,
					`${subjectName} Practice`,
					`${subjectName} Assessment`
				]
			);
		}

		// Helper function to get subject color
		function getSubjectColor(subjectName: string): string {
			const colorMap: { [key: string]: string } = {
				Mathematics: '500', // Blue
				English: '600', // Purple
				Science: '700', // Green
				'Physical Education': '800' // Red
			};

			return colorMap[subjectName] || '100';
		}

		// Helper function to map subject to learning area
		function getSubjectLearningArea(subjectName: string): string {
			const areaMap: { [key: string]: string } = {
				Mathematics: 'Mathematics',
				English: 'English',
				Science: 'Science',
				'Physical Education': 'Health and Physical Education'
			};

			return areaMap[subjectName] || subjectName;
		}

		const subjectOfferingClasses = await db
			.insert(schema.subjectOfferingClass)
			.values([
				{
					name: 'Class A',
					subOfferingId: year9Offerings[0].id // Math
				},
				{
					name: 'Class A',
					subOfferingId: year9Offerings[1].id // English
				},
				{
					name: 'Class A',
					subOfferingId: year9Offerings[2].id // Science
				},
				{
					name: 'Class A',
					subOfferingId: year9Offerings[3].id // PE
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
			for (const subjectOffering of year9Offerings) {
				await db.insert(schema.userSubjectOffering).values({
					userId: studentId,
					subOfferingId: subjectOffering.id,
					role: userSubjectOfferingRoleEnum.student
				});
			}
		}

		// Assign teachers to Year 9 subject offerings only
		for (let i = 0; i < teacherIds.length && i < year9Offerings.length; i++) {
			await db.insert(schema.userSubjectOffering).values({
				userId: teacherIds[i],
				subOfferingId: year9Offerings[i].id,
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

		console.log('✅ Database seeded successfully!');
		console.log(`
📊 Summary:
-- School: ${schoolRecord.name}
-- Campus: ${campusRecord.name}
-- Locations: ${locations.length}
-- Users: ${allUserIds.length} total
  - System Admin: 1
  - School Admin: 1  
  - Students: 3 (enrolled in Year 9 only)
  - Teachers: 4 (assigned to Year 9 only)
-- Core Subjects: ${coreSubjects.length}
-- Subjects: ${subjects.length} (Foundation to Year 10 for each core subject)
-- Subject Offerings: ${subjectOfferings.length} (F-10 offerings for all subjects)
-- Year 9 Offerings: ${year9Offerings.length} (used for student/teacher assignments)
-- Subject Classes: ${subjectOfferingClasses.length} (Year 9 only)
-- Timetable Entries: ${timetableEntries.length}
-- VCAA Content Items: ${contentItems.length}
-- Learning Areas: ${learningAreaMap.size}
-- Coursemap Items: ${courseMapItems.length} (${weeksPerSemester} weeks)

🔐 Default password for all users: password123

📧 User emails:
-- System Admin: root@eddi.com.au
-- School Admin: admin@eddi.edu
-- Students: student001@eddi.edu, student002@eddi.edu, student003@eddi.edu
-- Teachers: m.teacher@eddi.edu, e.teacher@eddi.edu, s.teacher@eddi.edu, pe.teacher@eddi.edu

📚 Structure Created:
-- Foundation to Year 10 subjects for Mathematics, English, Science, Physical Education
-- Full F-10 curriculum with subject offerings for 2025 Semester 1
-- Students and teachers are only assigned to Year 9 offerings
-- Coursemap covers all F-10 subject offerings with 18-week structure
		`);
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
