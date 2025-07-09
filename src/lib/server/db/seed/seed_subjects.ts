import { db } from '../index';
import * as schema from '../schema';
import { eq, inArray, and } from 'drizzle-orm';
import type { Campus } from '../schema';

const CURRENT_YEAR = 2025;
const CURRENT_SEMESTER = 1;

// Core subjects that will be used across all year levels
const CORE_SUBJECTS_DATA = [
	{
		name: 'English',
		description: 'Language, literature, and communication skills'
	},
	{
		name: 'Mathematics',
		description: 'Number, algebra, measurement, geometry, statistics and probability'
	},
	{
		name: 'Science',
		description:
			'Physical sciences, biological sciences, chemical sciences, earth and space sciences'
	},
	{
		name: 'Humanities',
		description: 'History, geography, civics and citizenship'
	},
	{
		name: 'The Arts',
		description: 'Visual arts, music, drama, dance, media arts'
	},
	{
		name: 'Health and Physical Education',
		description: 'Personal, social and community health, movement and physical activity'
	},
	{
		name: 'Technologies',
		description: 'Design and technologies, digital technologies'
	},
	{
		name: 'Languages',
		description: 'Learning languages other than English'
	}
];

// Year levels for Foundation to Year 10
const YEAR_LEVELS = ['F', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

// Senior subjects (VCE/IB) - these are more specific
const SENIOR_SUBJECTS_DATA = [
	{ name: 'English', coreSubject: 'English', yearLevel: '11' },
	{ name: 'English', coreSubject: 'English', yearLevel: '12' },
	{ name: 'Literature', coreSubject: 'English', yearLevel: '11' },
	{ name: 'Literature', coreSubject: 'English', yearLevel: '12' },
	{ name: 'Mathematical Methods', coreSubject: 'Mathematics', yearLevel: '11' },
	{ name: 'Mathematical Methods', coreSubject: 'Mathematics', yearLevel: '12' },
	{ name: 'Specialist Mathematics', coreSubject: 'Mathematics', yearLevel: '11' },
	{ name: 'Specialist Mathematics', coreSubject: 'Mathematics', yearLevel: '12' },
	{ name: 'General Mathematics', coreSubject: 'Mathematics', yearLevel: '11' },
	{ name: 'General Mathematics', coreSubject: 'Mathematics', yearLevel: '12' },
	{ name: 'Biology', coreSubject: 'Science', yearLevel: '11' },
	{ name: 'Biology', coreSubject: 'Science', yearLevel: '12' },
	{ name: 'Chemistry', coreSubject: 'Science', yearLevel: '11' },
	{ name: 'Chemistry', coreSubject: 'Science', yearLevel: '12' },
	{ name: 'Physics', coreSubject: 'Science', yearLevel: '11' },
	{ name: 'Physics', coreSubject: 'Science', yearLevel: '12' },
	{ name: 'Psychology', coreSubject: 'Science', yearLevel: '11' },
	{ name: 'Psychology', coreSubject: 'Science', yearLevel: '12' },
	{ name: 'History', coreSubject: 'Humanities', yearLevel: '11' },
	{ name: 'History', coreSubject: 'Humanities', yearLevel: '12' },
	{ name: 'Geography', coreSubject: 'Humanities', yearLevel: '11' },
	{ name: 'Geography', coreSubject: 'Humanities', yearLevel: '12' },
	{ name: 'Business Management', coreSubject: 'Humanities', yearLevel: '11' },
	{ name: 'Business Management', coreSubject: 'Humanities', yearLevel: '12' }
];

export async function seed_subjects(schoolId: number, campuses: Campus[]) {
	console.log(`📚 Creating core subjects...`);

	// Create core subjects
	const coreSubjects = await db
		.insert(schema.coreSubject)
		.values(
			CORE_SUBJECTS_DATA.map((coreSubjectData) => ({
				...coreSubjectData,
				schoolId
			}))
		)
		.returning();

	console.log(`✅ Created ${coreSubjects.length} core subjects`);

	// Create a map for easy lookup
	const coreSubjectMap = new Map(coreSubjects.map((cs) => [cs.name, cs]));

	console.log(`📖 Creating F-10 subjects...`);

	// Create F-10 subjects (one for each year level and core subject)
	const f10SubjectsData = [];
	for (const coreSubject of coreSubjects) {
		for (const yearLevel of YEAR_LEVELS) {
			f10SubjectsData.push({
				name: `${coreSubject.name} - Year ${yearLevel}`,
				coreSubjectId: coreSubject.id,
				description: `${coreSubject.description} for Year ${yearLevel}`,
				yearLevel
			});
		}
	}

	const f10Subjects = await db.insert(schema.subject).values(f10SubjectsData).returning();

	console.log(`✅ Created ${f10Subjects.length} F-10 subjects`);

	console.log(`🎓 Creating senior subjects...`);

	// Create senior subjects (VCE/IB specific subjects)
	const seniorSubjectsData = SENIOR_SUBJECTS_DATA.map((seniorSubject) => {
		const coreSubject = coreSubjectMap.get(seniorSubject.coreSubject);
		if (!coreSubject) {
			throw new Error(`Core subject ${seniorSubject.coreSubject} not found`);
		}

		return {
			name: `${seniorSubject.name} - Year ${seniorSubject.yearLevel}`,
			coreSubjectId: coreSubject.id,
			description: `Year ${seniorSubject.yearLevel} ${seniorSubject.name}`,
			yearLevel: seniorSubject.yearLevel
		};
	});

	const seniorSubjects = await db.insert(schema.subject).values(seniorSubjectsData).returning();

	console.log(`✅ Created ${seniorSubjects.length} senior subjects`);

	// Combine all subjects
	const allSubjects = [...f10Subjects, ...seniorSubjects];

	console.log(`🏫 Creating subject offerings...`);

	// Create subject offerings for all subjects across all campuses
	const subjectOfferingsData = [];
	for (const subject of allSubjects) {
		for (const campus of campuses) {
			subjectOfferingsData.push({
				subjectId: subject.id,
				year: CURRENT_YEAR,
				semester: CURRENT_SEMESTER,
				campusId: campus.id
			});
		}
	}

	const subjectOfferings = await db
		.insert(schema.subjectOffering)
		.values(subjectOfferingsData)
		.returning();

	console.log(`✅ Created ${subjectOfferings.length} subject offerings`);

	return {
		coreSubjects,
		subjects: allSubjects,
		subjectOfferings
	};
}

// Function to assign curriculum data to English subjects
export async function assignCurriculumToEnglishSubjects(schoolId: number) {
	console.log(`🔗 Linking English curriculum to subject offerings...`);

	try {
		// Find the English core subject
		const [englishCoreSubject] = await db
			.select()
			.from(schema.coreSubject)
			.where(and(eq(schema.coreSubject.schoolId, schoolId), eq(schema.coreSubject.name, 'English')))
			.limit(1);

		if (!englishCoreSubject) {
			console.log(`⚠️  No English core subject found for school ${schoolId}`);
			return null;
		}

		// Find all English subjects
		const englishSubjects = await db
			.select()
			.from(schema.subject)
			.where(eq(schema.subject.coreSubjectId, englishCoreSubject.id));

		if (englishSubjects.length === 0) {
			console.log(`⚠️  No English subjects found`);
			return null;
		}

		// Find English curriculum subject
		const [englishCurriculumSubject] = await db
			.select()
			.from(schema.curriculumSubject)
			.where(eq(schema.curriculumSubject.name, 'English'))
			.limit(1);

		if (!englishCurriculumSubject) {
			console.log(`⚠️  No English curriculum subject found in curriculum data`);
			return null;
		}

		// Find all subject offerings for English subjects
		const englishSubjectIds = englishSubjects.map((s) => s.id);
		const englishOfferings = await db
			.select()
			.from(schema.subjectOffering)
			.where(inArray(schema.subjectOffering.subjectId, englishSubjectIds));

		// Update subject offerings to link to curriculum
		const updatePromises = englishOfferings.map((offering) =>
			db
				.update(schema.subjectOffering)
				.set({ curriculumSubjectId: englishCurriculumSubject.id })
				.where(eq(schema.subjectOffering.id, offering.id))
		);

		await Promise.all(updatePromises);

		console.log(`✅ Linked ${englishOfferings.length} English subject offerings to curriculum`);

		return {
			linkedOfferings: englishOfferings.length,
			englishCoreSubject,
			englishCurriculumSubject
		};
	} catch (error) {
		console.error(`❌ Error linking curriculum:`, error);
		throw error;
	}
}
