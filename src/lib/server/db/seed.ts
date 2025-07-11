import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from './schema';
import { reset } from 'drizzle-seed';
import { VCAAF10Scraper } from '../../scraper/vcaaF10-scraper';
import { seedSubjectThreads, seedSubjectThreadResponses } from './seed/seed_threads';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

// Types for easier handling
type User = typeof schema.user.$inferSelect;
type School = typeof schema.school.$inferSelect;
type Campus = typeof schema.campus.$inferSelect;
type CoreSubject = typeof schema.coreSubject.$inferSelect;
type Subject = typeof schema.subject.$inferSelect;
type SubjectOffering = typeof schema.subjectOffering.$inferSelect;
type SubjectOfferingClass = typeof schema.subjectOfferingClass.$inferSelect;

async function main() {
	console.log('🚀 Starting comprehensive database seeding...');
	console.log('============================================');

	// Reset the database
	await reset(db, schema);
	console.log('✅ Database reset complete');

	// Step 1: Create school and campus
	console.log('\n📚 Step 1: Creating school and campus...');
	const { school, campus } = await createSchoolAndCampus();

	// Step 2: Scrape VCAA curriculum data
	console.log('\n🌐 Step 2: Scraping VCAA curriculum data...');
	await scrapeVCAAData();

	// Step 3: Create core subjects based on curriculum
	console.log('\n📖 Step 3: Creating core subjects...');
	const coreSubjects = await createCoreSubjects(school);

	// Step 4: Create subjects for year levels F-10
	console.log('\n📚 Step 4: Creating subjects for year levels F-10...');
	const subjects = await createSubjectsForYearLevels(school, coreSubjects);

	// Step 5: Create subject offerings
	console.log('\n📅 Step 5: Creating subject offerings...');
	const subjectOfferings = await createSubjectOfferings(subjects, campus);

	// Step 6: Create classes for each offering
	console.log('\n🏫 Step 6: Creating classes...');
	const subjectClasses = await createClasses(subjectOfferings);

	// Step 7: Create sample course map for mathematics
	console.log('\n🗺️ Step 7: Creating mathematics course map...');
	const mathOffering = subjectOfferings.find((offering) =>
		subjects
			.find((s) => s.id === offering.subjectId)
			?.name.toLowerCase()
			.includes('mathematics')
	);
	if (mathOffering) {
		await createMathematicsCourseMap(mathOffering);
	}

	// Step 8: Create users (teachers and students)
	console.log('\n👥 Step 8: Creating users...');
	const users = await createUsers(school);

	// Step 9: Assign users to classes (max 5 classes per user)
	console.log('\n🔗 Step 9: Assigning users to classes...');
	await assignUsersToClasses(users, subjectClasses);

	// Step 10: Create discussion threads for assigned classes
	console.log('\n💭 Step 10: Creating discussion threads...');
	await createDiscussionThreads(users, subjectOfferings);

	console.log('\n✅ Comprehensive seeding completed successfully!');
	console.log('📊 Summary:');
	console.log(`   - 1 school with 1 campus`);
	console.log(`   - ${coreSubjects.length} core subjects`);
	console.log(`   - ${subjects.length} subjects across year levels F-10`);
	console.log(`   - ${subjectOfferings.length} subject offerings`);
	console.log(`   - ${subjectClasses.length} classes`);
	console.log(`   - ${users.length} users`);
}

async function createSchoolAndCampus(): Promise<{ school: School; campus: Campus }> {
	const [school] = await db
		.insert(schema.school)
		.values({
			name: 'Victoria Public School',
			emailSuffix: 'victoria.edu.au'
		})
		.returning();

	const [campus] = await db
		.insert(schema.campus)
		.values({
			schoolId: school.id,
			name: 'Main Campus',
			address: '123 Education Street, Melbourne VIC 3000',
			description: 'Main campus with modern facilities'
		})
		.returning();

	// Create some school locations with proper schema
	const locations = [
		{
			name: 'Main Building - Room 101',
			type: schema.schoolLocationTypeEnum.classroom,
			capacity: 30
		},
		{
			name: 'Main Building - Room 102',
			type: schema.schoolLocationTypeEnum.classroom,
			capacity: 25
		},
		{ name: 'Science Block - Lab A', type: schema.schoolLocationTypeEnum.laboratory, capacity: 20 },
		{ name: 'Science Block - Lab B', type: schema.schoolLocationTypeEnum.laboratory, capacity: 20 },
		{ name: 'Library - Study Room 1', type: schema.schoolLocationTypeEnum.library, capacity: 15 },
		{ name: 'Library - Study Room 2', type: schema.schoolLocationTypeEnum.library, capacity: 15 },
		{
			name: 'Arts Building - Studio 1',
			type: schema.schoolLocationTypeEnum.classroom,
			capacity: 25
		},
		{ name: 'Gymnasium', type: schema.schoolLocationTypeEnum.gymnasium, capacity: 40 },
		{ name: 'Computer Lab', type: schema.schoolLocationTypeEnum.classroom, capacity: 30 },
		{ name: 'Music Room', type: schema.schoolLocationTypeEnum.classroom, capacity: 20 }
	];

	for (const location of locations) {
		await db.insert(schema.schoolLocation).values({
			campusId: campus.id,
			name: location.name,
			type: location.type,
			capacity: location.capacity,
			description: `${location.name} with capacity for ${location.capacity} students`
		});
	}

	console.log(`✅ Created school: ${school.name}`);
	console.log(`✅ Created campus: ${campus.name}`);
	console.log(`✅ Created ${locations.length} school locations`);

	return { school, campus };
}

async function scrapeVCAAData(): Promise<void> {
	const scraper = new VCAAF10Scraper();

	try {
		console.log('   Scraping core curriculum subjects...');
		// Scrape individual subjects and collect content
		const mathContent = await scraper.scrapeSubject('Mathematics');
		const englishContent = await scraper.scrapeSubject('English');
		const scienceContent = await scraper.scrapeSubject('Science');

		// Combine all content and insert into database
		const allContent = [...mathContent, ...englishContent, ...scienceContent];
		await scraper.insertCurriculumData(allContent);

		console.log('✅ VCAA curriculum data scraped successfully');
	} catch (error) {
		console.error('⚠️ Error scraping VCAA data:', error);
		throw error;
	}
}

async function createCoreSubjects(school: School): Promise<CoreSubject[]> {
	// Get curriculum subjects from the scraped data
	const curriculumSubjects = await db.select().from(schema.curriculumSubject);

	const coreSubjects: CoreSubject[] = [];

	for (const curriculumSubject of curriculumSubjects) {
		const [coreSubject] = await db
			.insert(schema.coreSubject)
			.values({
				name: curriculumSubject.name,
				description: `Core subject based on VCAA ${curriculumSubject.name} curriculum`,
				curriculumSubjectId: curriculumSubject.id,
				schoolId: school.id
			})
			.returning();

		coreSubjects.push(coreSubject);
	}

	console.log(`✅ Created ${coreSubjects.length} core subjects`);
	return coreSubjects;
}

async function createSubjectsForYearLevels(
	school: School,
	coreSubjects: CoreSubject[]
): Promise<Subject[]> {
	const yearLevels = [
		schema.yearLevelEnum.foundation,
		schema.yearLevelEnum.year1,
		schema.yearLevelEnum.year2,
		schema.yearLevelEnum.year3,
		schema.yearLevelEnum.year4,
		schema.yearLevelEnum.year5,
		schema.yearLevelEnum.year6,
		schema.yearLevelEnum.year7,
		schema.yearLevelEnum.year8,
		schema.yearLevelEnum.year9,
		schema.yearLevelEnum.year10
	];

	const subjects: Subject[] = [];

	for (const coreSubject of coreSubjects) {
		for (const yearLevel of yearLevels) {
			const yearDisplay =
				yearLevel === schema.yearLevelEnum.foundation ? 'F' : yearLevel.replace('year', '');

			const [subject] = await db
				.insert(schema.subject)
				.values({
					name: `${coreSubject.name} - Year ${yearDisplay}`,
					schoolId: school.id,
					coreSubjectId: coreSubject.id,
					yearLevel: yearLevel
				})
				.returning();

			subjects.push(subject);
		}
	}

	console.log(`✅ Created ${subjects.length} subjects across all year levels`);
	return subjects;
}

async function createSubjectOfferings(
	subjects: Subject[],
	campus: Campus
): Promise<SubjectOffering[]> {
	const subjectOfferings: SubjectOffering[] = [];

	for (const subject of subjects) {
		// Create offerings for current year, semester 1 and 2
		for (const semester of [1, 2]) {
			const [offering] = await db
				.insert(schema.subjectOffering)
				.values({
					subjectId: subject.id,
					year: 2024,
					semester: semester,
					campusId: campus.id
				})
				.returning();

			subjectOfferings.push(offering);
		}
	}

	console.log(`✅ Created ${subjectOfferings.length} subject offerings`);
	return subjectOfferings;
}

async function createClasses(subjectOfferings: SubjectOffering[]): Promise<SubjectOfferingClass[]> {
	const subjectClasses: SubjectOfferingClass[] = [];

	for (const offering of subjectOfferings) {
		const [subjectClass] = await db
			.insert(schema.subjectOfferingClass)
			.values({
				subOfferingId: offering.id,
				suffix: 'A'
			})
			.returning();

		subjectClasses.push(subjectClass);
	}

	console.log(`✅ Created ${subjectClasses.length} classes`);
	return subjectClasses;
}

async function createMathematicsCourseMap(mathOffering: SubjectOffering): Promise<void> {
	// Get mathematics learning areas
	const mathCurriculumSubject = await db
		.select()
		.from(schema.curriculumSubject)
		.where(eq(schema.curriculumSubject.name, 'Mathematics'))
		.limit(1);

	if (mathCurriculumSubject.length === 0) return;

	const learningAreas = await db
		.select()
		.from(schema.learningArea)
		.where(eq(schema.learningArea.curriculumSubjectId, mathCurriculumSubject[0].id));

	// Create course map items for full year
	const totalWeeks = 40; // Full school year
	const weeksPerTopic = Math.floor(totalWeeks / learningAreas.length);

	for (let i = 0; i < learningAreas.length; i++) {
		const learningArea = learningAreas[i];
		const startWeek = i * weeksPerTopic + 1;
		const semester = startWeek <= 20 ? 1 : 2;

		await db.insert(schema.courseMapItem).values({
			subjectOfferingId: mathOffering.id,
			topic: learningArea.name,
			description: learningArea.description || `Study of ${learningArea.name}`,
			startWeek: startWeek,
			duration: weeksPerTopic,
			semester: semester
		});
	}

	console.log(`✅ Created mathematics course map with ${learningAreas.length} topics`);
}

async function createUsers(school: School): Promise<User[]> {
	const passwordHash = 'student'; // Simple hardcoded hash for demo

	const usersData = [
		{
			email: 'emma.thompsom@schoolofeddi.edu',
			firstName: 'Emma',
			lastName: 'Thompson',
			type: schema.userTypeEnum.teacher
		},
		{
			email: 'mike.chen@victoria.edu.au',
			firstName: 'Mike',
			lastName: 'Chen',
			type: schema.userTypeEnum.teacher
		},
		{
			email: 'emma.wilson@victoria.edu.au',
			firstName: 'Emma',
			lastName: 'Wilson',
			type: schema.userTypeEnum.student
		},
		{
			email: 'james.brown@victoria.edu.au',
			firstName: 'James',
			lastName: 'Brown',
			type: schema.userTypeEnum.student
		},
		{
			email: 'olivia.davis@victoria.edu.au',
			firstName: 'Olivia',
			lastName: 'Davis',
			type: schema.userTypeEnum.student
		}
	];

	const users: User[] = [];

	for (const userData of usersData) {
		const [user] = await db
			.insert(schema.user)
			.values({
				id: `user_${userData.firstName.toLowerCase()}_${userData.lastName.toLowerCase()}`,
				email: userData.email,
				passwordHash: passwordHash,
				schoolId: school.id,
				type: userData.type,
				firstName: userData.firstName,
				lastName: userData.lastName
			})
			.returning();

		users.push(user);
	}

	console.log(`✅ Created ${users.length} users (2 teachers, 3 students)`);
	return users;
}

async function assignUsersToClasses(
	users: User[],
	subjectClasses: SubjectOfferingClass[]
): Promise<void> {
	const maxClassesPerUser = 5;

	for (const user of users) {
		// Randomly select up to maxClassesPerUser classes for each user
		const shuffledClasses = [...subjectClasses].sort(() => Math.random() - 0.5);
		const assignedClasses = shuffledClasses.slice(0, maxClassesPerUser);

		for (const subjectClass of assignedClasses) {
			const role =
				user.type === schema.userTypeEnum.teacher
					? schema.userSubjectOfferingClassRoleEnum.teacher
					: schema.userSubjectOfferingClassRoleEnum.student;

			await db.insert(schema.userSubjectOfferingClass).values({
				userId: user.id,
				subOffClassId: subjectClass.id,
				role: role
			});
		}
	}

	console.log(`✅ Assigned users to classes (max ${maxClassesPerUser} classes per user)`);
}

async function createDiscussionThreads(
	users: User[],
	subjectOfferings: SubjectOffering[]
): Promise<void> {
	// Use the existing seeding functions for threads
	await seedSubjectThreads(
		subjectOfferings.map((so) => ({ id: so.id, subjectId: so.subjectId })),
		users
	);

	// Get created threads
	const threads = await db.select().from(schema.subjectThread);

	// Create responses for some threads
	await seedSubjectThreadResponses(
		threads.map((t) => ({ id: t.id, type: t.type })),
		users
	);

	console.log(`✅ Created discussion threads with responses`);
}

main()
	.then(() => {
		console.log('\n🎉 Seeding completed!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Seeding failed:', error);
		process.exit(1);
	});

export { main as seedComprehensive };
