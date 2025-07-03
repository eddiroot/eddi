import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../schema';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

export async function seed_subjects(schoolId: number, campuses: { id: number; name: string }[]) {
	// Seed subjects
	const subjects = await db
		.insert(schema.subject)
		.values([
			{
				name: 'English',
				schoolId: schoolId,
				description:
					'Core English language and communication skills, focusing on reading, writing, speaking, and listening.'
			},
			{
				name: 'English as an Additional Language (EAL)',
				schoolId: schoolId,
				description:
					'Specialized English program for students who speak English as an additional language, with emphasis on language acquisition and academic writing.'
			},
			{
				name: 'Literature',
				schoolId: schoolId,
				description:
					'Study of literary works including novels, poetry, drama, and short stories from various cultures and time periods.'
			},
			{
				name: 'Foundation Mathematics',
				schoolId: schoolId,
				description:
					'Fundamental mathematical concepts and skills, covering basic arithmetic, algebra, geometry, and statistics for everyday applications.'
			},
			{
				name: 'General Mathematics',
				schoolId: schoolId,
				description:
					'Practical mathematics for real-world applications including personal finance, data analysis, and problem-solving in various contexts.'
			},
			{
				name: 'Mathematical Methods',
				schoolId: schoolId,
				description:
					'Advanced mathematics covering calculus, probability, statistics, and functions, preparing students for tertiary mathematics and science.'
			},
			{
				name: 'Specialist Mathematics',
				schoolId: schoolId,
				description:
					'Highest level of secondary mathematics including complex numbers, advanced calculus, differential equations, and mathematical modeling.'
			},
			{
				name: 'Biology',
				schoolId: schoolId,
				description:
					'Study of living organisms and life processes, covering cell biology, genetics, evolution, ecology, and human biology.'
			},
			{
				name: 'Chemistry',
				schoolId: schoolId,
				description:
					'Study of matter and its properties, chemical reactions, atomic structure, and molecular interactions in various environments.'
			},
			{
				name: 'Physics',
				schoolId: schoolId,
				description:
					'Study of matter, energy, and their interactions, covering mechanics, thermodynamics, electromagnetism, and modern physics.'
			},
			{
				name: 'Psychology',
				schoolId: schoolId,
				description:
					'Scientific study of human behavior and mental processes, including cognition, development, social psychology, and research methods.'
			},
			{
				name: 'History: Revolutions',
				schoolId: schoolId,
				description:
					'In-depth study of major historical revolutions and their impact on society, politics, and culture, with focus on causes, events, and consequences.'
			}
		])
		.returning();

	console.log('Seeded subjects:', subjects.length, 'subjects');

	// Log each subject for verification
	subjects.forEach((subject) => {
		console.log(`- ${subject.name}: ${subject.description?.substring(0, 50)}...`);
	});

	// Create subject offerings for semester 2, 2025 for each subject and each campus
	const subjectOfferingsData = [];

	for (const subject of subjects) {
		for (const campus of campuses) {
			subjectOfferingsData.push({
				subjectId: subject.id,
				year: 2025,
				semester: 2,
				campusId: campus.id
			});
		}
	}

	const subjectOfferings = await db
		.insert(schema.subjectOffering)
		.values(subjectOfferingsData)
		.returning();

	console.log('Seeded subject offerings:', subjectOfferings.length, 'offerings');
	console.log(
		`Created ${subjects.length} subjects × ${campuses.length} campuses = ${subjectOfferings.length} total offerings for Semester 2, 2025`
	);

	// Log offerings by campus
	campuses.forEach((campus) => {
		const campusOfferings = subjectOfferings.filter((offering) => offering.campusId === campus.id);
		console.log(`${campus.name}: ${campusOfferings.length} subject offerings`);
	});

	return { subjects, subjectOfferings };
}
