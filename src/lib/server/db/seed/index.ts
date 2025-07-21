import * as schema from '../schema';
import {
	userTypeEnum,
	userGenderEnum,
	userHonorificEnum,
	schoolSpaceTypeEnum,
	userSubjectOfferingRoleEnum,
	userSubjectOfferingClassRoleEnum,
	yearLevelEnum
} from '../schema';
import { hash } from '@node-rs/argon2';
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
				name: 'School of eddi'
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

		const [buildingRecord] = await db
			.insert(schema.schoolBuilding)
			.values({
				campusId: campusRecord.id,
				name: 'Main Building',
				description: 'Main building of the campus',
				isArchived: false
			})
			.returning();

		const spaces = await db
			.insert(schema.schoolSpace)
			.values([
				{
					buildingId: buildingRecord.id,
					name: 'Science Lab A',
					type: schoolSpaceTypeEnum.laboratory,
					capacity: 30,
					isArchived: false
				},
				{
					buildingId: buildingRecord.id,
					name: 'Classroom 101',
					type: schoolSpaceTypeEnum.classroom,
					capacity: 25,
					isArchived: false
				},
				{
					buildingId: buildingRecord.id,
					name: 'Mathematics Room',
					type: schoolSpaceTypeEnum.classroom,
					capacity: 30,
					isArchived: false
				},
				{
					buildingId: buildingRecord.id,
					name: 'English Room',
					type: schoolSpaceTypeEnum.classroom,
					capacity: 28,
					isArchived: false
				},
				{
					buildingId: buildingRecord.id,
					name: 'Gymnasium',
					type: schoolSpaceTypeEnum.gymnasium,
					capacity: 200,
					isArchived: false
				},
				{
					buildingId: buildingRecord.id,
					name: 'History Room',
					type: schoolSpaceTypeEnum.classroom,
					capacity: 30,
					isArchived: false
				},
				{
					buildingId: buildingRecord.id,
					name: 'Geography Room',
					type: schoolSpaceTypeEnum.classroom,
					capacity: 30,
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
				},
				{
					name: 'History',
					curriculumId: curriculumRecord.id
				},
				{
					name: 'Geography',
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
				},
				{
					name: 'History',
					description: 'Core History',
					curriculumSubjectId: curriculumSubjects[4].id,
					schoolId: schoolRecord.id
				},
				{
					name: 'Geography',
					description: 'Core Geography',
					curriculumSubjectId: curriculumSubjects[5].id,
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

		// Create subject offerings for all F-10 subjects (year-long offerings with semester = null)
		const subjectOfferings: (typeof schema.subjectOffering.$inferSelect)[] = [];
		for (const subject of subjects) {
			// Create year-long offering (semester = null for full year)
			const yearOfferingValues = {
				subjectId: subject.id,
				year: 2025,
				semester: 0, // 0 indicates full year
				campusId: campusRecord.id
			};
			const [yearOffering] = await db
				.insert(schema.subjectOffering)
				.values(yearOfferingValues)
				.returning();
			subjectOfferings.push(yearOffering);
		}

		// Filter to get only Year 9 offerings for student/teacher assignments
		const year9Offerings = subjectOfferings.filter((offering) => {
			const subject = subjects.find((s) => s.id === offering.subjectId);
			return subject && subject.yearLevel === yearLevelEnum.year9;
		});

		// Initialize VCAA scraper and scrape core subjects
		console.log('🎯 Initialising VCAA F-10 curriculum scraper...');
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
		const learningAreaStandardMap = new Map<string, number>();

		for (const item of contentItems) {
			const learningAreaId = learningAreaMap.get(item.learningArea);
			if (!learningAreaId) continue;

			// Check if this content already exists to avoid duplicates
			const existingContent = await db
				.select()
				.from(schema.learningAreaStandard)
				.where(eq(schema.learningAreaStandard.name, item.vcaaCode))
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

				const [learningAreaStandard] = await db
					.insert(schema.learningAreaStandard)
					.values({
						learningAreaId: learningAreaId,
						name: item.vcaaCode,
						description: `${item.strand}: ${item.description}`,
						yearLevel: yearLevelValue
					})
					.returning();

				learningAreaStandardMap.set(item.vcaaCode, learningAreaStandard.id);

				// Create elaborations for this content item
				for (const elaboration of item.elaborations) {
					await db.insert(schema.standardElaboration).values({
						learningAreaStandardId: learningAreaStandard.id,
						name: `Elaboration for ${item.vcaaCode}`,
						standardElaboration: elaboration
					});
				}
			}
		}

		console.log(`📝 Created ${learningAreaStandardMap.size} learning area content items`);

		// Create 36-week coursemap items for each subject offering (18 weeks per semester)
		const courseMapItems = [];
		const weeksPerSemester = 18;
		const totalWeeks = 36; // Full year

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

			// Distribute topics across 36 weeks (full year)
			for (let week = 1; week <= totalWeeks; week += duration) {
				const topicIndex = Math.floor(((week - 1) / totalWeeks) * baseTopics.length);
				const topic = baseTopics[topicIndex] || `${subjectName} Review`;

				// Determine which semester this week belongs to
				const semester = week <= weeksPerSemester ? 1 : 2;

				// Calculate the week within the semester (1-18 for each semester)
				const startWeekInSemester = semester === 1 ? week : week - weeksPerSemester;

				const [courseMapItem] = await db
					.insert(schema.courseMapItem)
					.values({
						subjectOfferingId: offering.id,
						topic: `${topic}`,
						description: `${topic} activities and learning for ${subjectName}`,
						startWeek: startWeekInSemester,
						duration: duration,
						semester: semester,
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
				],
				History: [
					'Ancient Civilizations',
					'Medieval Times',
					'Industrial Revolution',
					'World Wars',
					'Modern History',
					'Australian History',
					'Social Movements',
					'Historical Analysis'
				],
				Geography: [
					'Physical Geography',
					'Human Geography',
					'Climate and Weather',
					'Environmental Systems',
					'Urban Geography',
					'Global Issues',
					'Mapping and GIS',
					'Sustainability'
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

		// Helper function to get subject color (hex values)
		function getSubjectColor(subjectName: string): string {
			const colorMap: { [key: string]: string } = {
				Mathematics: '#3B82F6', // Blue
				English: '#8B5CF6', // Purple
				Science: '#10B981', // Green
				'Physical Education': '#EF4444', // Red
				History: '#F59E0B', // Amber/Orange
				Geography: '#06B6D4' // Cyan
			};

			return colorMap[subjectName] || '#6B7280'; // Default gray
		}

		// Helper function to map subject to learning area
		function getSubjectLearningArea(subjectName: string): string {
			const areaMap: { [key: string]: string } = {
				Mathematics: 'Mathematics',
				English: 'English',
				Science: 'Science',
				'Physical Education': 'Health and Physical Education',
				History: 'Humanities and Social Sciences',
				Geography: 'Humanities and Social Sciences'
			};

			return areaMap[subjectName] || subjectName;
		}

		const subjectOfferingClasses = await db
			.insert(schema.subjectOfferingClass)
			.values([
				{
					name: 'A',
					subOfferingId: year9Offerings[0].id // Math
				},
				{
					name: 'A',
					subOfferingId: year9Offerings[1].id // English
				},
				{
					name: 'A',
					subOfferingId: year9Offerings[2].id // Science
				},
				{
					name: 'A',
					subOfferingId: year9Offerings[3].id // PE
				},
				{
					name: 'A',
					subOfferingId: year9Offerings[4].id // History
				},
				{
					name: 'A',
					subOfferingId: year9Offerings[5].id // Geography
				}
			])
			.returning();

		// Create users
		const passwordHash = await hash('password123');

		const [systemAdmin] = await db
			.insert(schema.user)
			.values({
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

		// Create parent users
		const [mother1] = await db
			.insert(schema.user)
			.values({
				email: 'mother001@eddi.edu',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.guardian,
				gender: userGenderEnum.female,
				honorific: userHonorificEnum.mrs,
				firstName: 'Mother',
				lastName: 'One',
				dateOfBirth: new Date('1985-05-12')
			})
			.returning();

		const [father1] = await db
			.insert(schema.user)
			.values({
				email: 'father001@eddi.edu',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.guardian,
				gender: userGenderEnum.male,
				honorific: userHonorificEnum.mr,
				firstName: 'Father',
				lastName: 'One',
				dateOfBirth: new Date('1983-09-08')
			})
			.returning();

		const [mother2] = await db
			.insert(schema.user)
			.values({
				email: 'mother002@eddi.edu',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.guardian,
				gender: userGenderEnum.female,
				honorific: userHonorificEnum.ms,
				firstName: 'Mother',
				lastName: 'Two',
				dateOfBirth: new Date('1987-02-20')
			})
			.returning();

		const [father2] = await db
			.insert(schema.user)
			.values({
				email: 'father002@eddi.edu',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.guardian,
				gender: userGenderEnum.male,
				honorific: userHonorificEnum.mr,
				firstName: 'Father',
				lastName: 'Two',
				dateOfBirth: new Date('1984-11-15')
			})
			.returning();

		const [mother3] = await db
			.insert(schema.user)
			.values({
				email: 'mother003@eddi.edu',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.guardian,
				gender: userGenderEnum.female,
				honorific: userHonorificEnum.mrs,
				firstName: 'Mother',
				lastName: 'Three',
				dateOfBirth: new Date('1986-08-03')
			})
			.returning();

		const [father3] = await db
			.insert(schema.user)
			.values({
				email: 'father003@eddi.edu',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.guardian,
				gender: userGenderEnum.male,
				honorific: userHonorificEnum.mr,
				firstName: 'Father',
				lastName: 'Three',
				dateOfBirth: new Date('1985-12-18')
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
			},
			{
				firstName: 'History',
				lastName: 'Teacher',
				email: 'h.teacher@eddi.edu'
			},
			{
				firstName: 'Geography',
				lastName: 'Teacher',
				email: 'g.teacher@eddi.edu'
			}
		];

		for (const teacher of teachers) {
			const [newTeacher] = await db
				.insert(schema.user)
				.values({
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
			mother1.id,
			father1.id,
			mother2.id,
			father2.id,
			mother3.id,
			father3.id,
			...teacherIds
		];
		await db.insert(schema.userCampus).values(
			allUserIds.map((userId) => ({
				userId,
				campusId: campusRecord.id
			}))
		);

		// Create user relationships (parent-child relationships)
		await db.insert(schema.userRelationship).values([
			// Student 1's parents
			{
				userId: student1.id,
				relatedUserId: mother1.id,
				relationshipType: schema.relationshipTypeEnum.mother
			},
			{
				userId: student1.id,
				relatedUserId: father1.id,
				relationshipType: schema.relationshipTypeEnum.father
			},
			// Student 2's parents
			{
				userId: student2.id,
				relatedUserId: mother2.id,
				relationshipType: schema.relationshipTypeEnum.mother
			},
			{
				userId: student2.id,
				relatedUserId: father2.id,
				relationshipType: schema.relationshipTypeEnum.father
			},
			// Student 3's parents
			{
				userId: student3.id,
				relatedUserId: mother3.id,
				relationshipType: schema.relationshipTypeEnum.mother
			},
			{
				userId: student3.id,
				relatedUserId: father3.id,
				relationshipType: schema.relationshipTypeEnum.father
			}
		]);

		const studentIds = [student1.id, student2.id, student3.id];
		for (const studentId of studentIds) {
			for (let i = 0; i < year9Offerings.length; i++) {
				const subjectOffering = year9Offerings[i];

				const subjectColorHues = [
					210, // Mathematics - Blue (210 degrees)
					350, // English - Red (350 degrees - vibrant red)
					120, // Science - Green (120 degrees)
					270, // Physical Education - Purple (270 degrees)
					30, // History - Orange (30 degrees)
					180 // Geography - Cyan (180 degrees)
				];

				const colorHue = subjectColorHues[i] || 200; // Default to blue if index out of range

				await db.insert(schema.userSubjectOffering).values({
					userId: studentId,
					subOfferingId: subjectOffering.id,
					role: userSubjectOfferingRoleEnum.student,
					color: colorHue
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

		const todaysIsoDate = new Date().toISOString().split('T')[0];
		const today = new Date(todaysIsoDate);

		// Helper function to create a Date object for a specific day and time
		const createDateTime = (dayOffset: number, hour: number, minute: number = 0) => {
			const date = new Date(today);
			date.setDate(today.getDate() + dayOffset);
			date.setHours(hour, minute, 0, 0);
			return date;
		};

		// Create basic timetable (class allocations) with actual timestamps
		// Each day has one of each subject: Math, English, Science, PE, History, Geography
		const timetableEntries = [
			// MONDAY - Math, English, Science, PE, History, Geography
			{
				subjectOfferingClassId: subjectOfferingClasses[0].id, // Math
				schoolSpaceId: spaces[2].id, // Mathematics Room
				startTimestamp: createDateTime(0, 8), // Monday 8:00 AM
				endTimestamp: createDateTime(0, 9) // Monday 9:00 AM
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[1].id, // English
				schoolSpaceId: spaces[3].id, // English Room
				startTimestamp: createDateTime(0, 9), // Monday 9:00 AM
				endTimestamp: createDateTime(0, 10) // Monday 10:00 AM
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[2].id, // Science
				schoolSpaceId: spaces[0].id, // Science Lab A
				startTimestamp: createDateTime(0, 10, 30), // Monday 10:30 AM (after break)
				endTimestamp: createDateTime(0, 11, 30) // Monday 11:30 AM
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[3].id, // PE
				schoolSpaceId: spaces[4].id, // Gymnasium
				startTimestamp: createDateTime(0, 11, 30), // Monday 11:30 AM
				endTimestamp: createDateTime(0, 12, 30) // Monday 12:30 PM
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[4].id, // History
				schoolSpaceId: spaces[5].id, // History Room
				startTimestamp: createDateTime(0, 13, 30), // Monday 1:30 PM (after lunch)
				endTimestamp: createDateTime(0, 14, 30) // Monday 2:30 PM
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[5].id, // Geography
				schoolSpaceId: spaces[6].id, // Geography Room
				startTimestamp: createDateTime(0, 14, 30), // Monday 2:30 PM
				endTimestamp: createDateTime(0, 15, 30) // Monday 3:30 PM
			},

			// TUESDAY - English, Science, Math, History, PE, Geography
			{
				subjectOfferingClassId: subjectOfferingClasses[1].id, // English
				schoolSpaceId: spaces[3].id, // English Room
				startTimestamp: createDateTime(1, 8), // Tuesday 8:00 AM
				endTimestamp: createDateTime(1, 9) // Tuesday 9:00 AM
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[2].id, // Science
				schoolSpaceId: spaces[0].id, // Science Lab A
				startTimestamp: createDateTime(1, 9), // Tuesday 9:00 AM
				endTimestamp: createDateTime(1, 10) // Tuesday 10:00 AM
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[0].id, // Math
				schoolSpaceId: spaces[2].id, // Mathematics Room
				startTimestamp: createDateTime(1, 10, 30), // Tuesday 10:30 AM (after break)
				endTimestamp: createDateTime(1, 11, 30) // Tuesday 11:30 AM
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[4].id, // History
				schoolSpaceId: spaces[5].id, // History Room
				startTimestamp: createDateTime(1, 11, 30), // Tuesday 11:30 AM
				endTimestamp: createDateTime(1, 12, 30) // Tuesday 12:30 PM
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[3].id, // PE
				schoolSpaceId: spaces[4].id, // Gymnasium
				startTimestamp: createDateTime(1, 13, 30), // Tuesday 1:30 PM (after lunch)
				endTimestamp: createDateTime(1, 14, 30) // Tuesday 2:30 PM
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[5].id, // Geography
				schoolSpaceId: spaces[6].id, // Geography Room
				startTimestamp: createDateTime(1, 14, 30), // Tuesday 2:30 PM
				endTimestamp: createDateTime(1, 15, 30) // Tuesday 3:30 PM
			},

			// WEDNESDAY - Science, Math, English, Geography, History, PE
			{
				subjectOfferingClassId: subjectOfferingClasses[2].id, // Science
				schoolSpaceId: spaces[0].id, // Science Lab A
				startTimestamp: createDateTime(2, 8), // Wednesday 8:00 AM
				endTimestamp: createDateTime(2, 9) // Wednesday 9:00 AM
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[0].id, // Math
				schoolSpaceId: spaces[2].id, // Mathematics Room
				startTimestamp: createDateTime(2, 9), // Wednesday 9:00 AM
				endTimestamp: createDateTime(2, 10) // Wednesday 10:00 AM
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[1].id, // English
				schoolSpaceId: spaces[3].id, // English Room
				startTimestamp: createDateTime(2, 10, 30), // Wednesday 10:30 AM (after break)
				endTimestamp: createDateTime(2, 11, 30) // Wednesday 11:30 AM
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[5].id, // Geography
				schoolSpaceId: spaces[6].id, // Geography Room
				startTimestamp: createDateTime(2, 11, 30), // Wednesday 11:30 AM
				endTimestamp: createDateTime(2, 12, 30) // Wednesday 12:30 PM
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[4].id, // History
				schoolSpaceId: spaces[5].id, // History Room
				startTimestamp: createDateTime(2, 13, 30), // Wednesday 1:30 PM (after lunch)
				endTimestamp: createDateTime(2, 14, 30) // Wednesday 2:30 PM
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[3].id, // PE
				schoolSpaceId: spaces[4].id, // Gymnasium
				startTimestamp: createDateTime(2, 14, 30), // Wednesday 2:30 PM
				endTimestamp: createDateTime(2, 15, 30) // Wednesday 3:30 PM
			},

			// THURSDAY - PE, History, Geography, English, Science, Math
			{
				subjectOfferingClassId: subjectOfferingClasses[3].id, // PE
				schoolSpaceId: spaces[4].id, // Gymnasium
				startTimestamp: createDateTime(3, 8), // Thursday 8:00 AM
				endTimestamp: createDateTime(3, 9) // Thursday 9:00 AM
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[4].id, // History
				schoolSpaceId: spaces[5].id, // History Room
				startTimestamp: createDateTime(3, 9), // Thursday 9:00 AM
				endTimestamp: createDateTime(3, 10) // Thursday 10:00 AM
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[5].id, // Geography
				schoolSpaceId: spaces[6].id, // Geography Room
				startTimestamp: createDateTime(3, 10, 30), // Thursday 10:30 AM (after break)
				endTimestamp: createDateTime(3, 11, 30) // Thursday 11:30 AM
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[1].id, // English
				schoolSpaceId: spaces[3].id, // English Room
				startTimestamp: createDateTime(3, 11, 30), // Thursday 11:30 AM
				endTimestamp: createDateTime(3, 12, 30) // Thursday 12:30 PM
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[2].id, // Science
				schoolSpaceId: spaces[0].id, // Science Lab A
				startTimestamp: createDateTime(3, 13, 30), // Thursday 1:30 PM (after lunch)
				endTimestamp: createDateTime(3, 14, 30) // Thursday 2:30 PM
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[0].id, // Math
				schoolSpaceId: spaces[2].id, // Mathematics Room
				startTimestamp: createDateTime(3, 14, 30), // Thursday 2:30 PM
				endTimestamp: createDateTime(3, 15, 30) // Thursday 3:30 PM
			},

			// FRIDAY - Geography, PE, History, Math, English, Science
			{
				subjectOfferingClassId: subjectOfferingClasses[5].id, // Geography
				schoolSpaceId: spaces[6].id, // Geography Room
				startTimestamp: createDateTime(4, 8), // Friday 8:00 AM
				endTimestamp: createDateTime(4, 9) // Friday 9:00 AM
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[3].id, // PE
				schoolSpaceId: spaces[4].id, // Gymnasium
				startTimestamp: createDateTime(4, 9), // Friday 9:00 AM
				endTimestamp: createDateTime(4, 10) // Friday 10:00 AM
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[4].id, // History
				schoolSpaceId: spaces[5].id, // History Room
				startTimestamp: createDateTime(4, 10, 30), // Friday 10:30 AM (after break)
				endTimestamp: createDateTime(4, 11, 30) // Friday 11:30 AM
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[0].id, // Math
				schoolSpaceId: spaces[2].id, // Mathematics Room
				startTimestamp: createDateTime(4, 11, 30), // Friday 11:30 AM
				endTimestamp: createDateTime(4, 12, 30) // Friday 12:30 PM
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[1].id, // English
				schoolSpaceId: spaces[3].id, // English Room
				startTimestamp: createDateTime(4, 13, 30), // Friday 1:30 PM (after lunch)
				endTimestamp: createDateTime(4, 14, 30) // Friday 2:30 PM
			},
			{
				subjectOfferingClassId: subjectOfferingClasses[2].id, // Science
				schoolSpaceId: spaces[0].id, // Science Lab A
				startTimestamp: createDateTime(4, 14, 30), // Friday 2:30 PM
				endTimestamp: createDateTime(4, 15, 30) // Friday 3:30 PM
			}
		];

		await db.insert(schema.subjectClassAllocation).values(timetableEntries);

		console.log('✅ Database seeded successfully!');
		console.log(`
📊 Summary:
-- School: ${schoolRecord.name}
-- Campus: ${campusRecord.name}
-- Building: ${buildingRecord.name}
-- Spaces: ${spaces.length}
-- Users: ${allUserIds.length} total
  - System Admin: 1
  - School Admin: 1  
  - Students: 3 (enrolled in Year 9 only)
  - Teachers: 6 (assigned to Year 9 only)
  - Parents/Guardians: 6 (3 mothers, 3 fathers)
-- User Relationships: 6 (parent-child relationships)
-- Core Subjects: ${coreSubjects.length}
-- Subjects: ${subjects.length} (Foundation to Year 10 for each core subject)
-- Subject Offerings: ${subjectOfferings.length} (F-10 year-long offerings, semester = null)
-- Year 9 Offerings: ${year9Offerings.length} (used for student/teacher assignments)
-- Subject Classes: ${subjectOfferingClasses.length} (Year 9 only)
-- Timetable Entries: ${timetableEntries.length}
-- VCAA Content Items: ${contentItems.length}
-- Learning Areas: ${learningAreaMap.size}
-- Coursemap Items: ${courseMapItems.length} (36 weeks total, spanning both semesters)

🔐 Default password for all users: password123

📧 User emails:
-- System Admin: root@eddi.com.au
-- School Admin: admin@eddi.edu
-- Students: student001@eddi.edu, student002@eddi.edu, student003@eddi.edu
-- Teachers: m.teacher@eddi.edu, e.teacher@eddi.edu, s.teacher@eddi.edu, pe.teacher@eddi.edu, h.teacher@eddi.edu, g.teacher@eddi.edu
-- Parents: mother001@eddi.edu, father001@eddi.edu, mother002@eddi.edu, father002@eddi.edu, mother003@eddi.edu, father003@eddi.edu

📚 Structure Created:
-- Foundation to Year 10 subjects for Mathematics, English, Science, Physical Education, History, Geography
-- Full F-10 curriculum with year-long subject offerings for 2025 (semester = null)
-- Students and teachers are only assigned to Year 9 offerings
-- Coursemap covers all F-10 subject offerings with 36-week structure (18 weeks per semester)
-- Course map items properly assigned to semester 1 (weeks 1-18) and semester 2 (weeks 19-36)
-- Timetable: Each day has exactly one class of each subject (6 subjects × 5 days = 30 total classes per week)
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
