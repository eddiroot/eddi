import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../schema';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

export async function seedSubjectThreads(
	subjectOfferings: { id: number; subjectId: number }[],
	users: { id: string; type: schema.userTypeEnum }[]
) {
	// Generic thread content templates
	const threadTemplates = [
		{
			type: schema.subjectThreadTypeEnum.discussion,
			title: 'Welcome to the class!',
			content:
				'Hi everyone! Welcome to our subject. Please introduce yourselves and share what you hope to learn this semester.'
		},
		{
			type: schema.subjectThreadTypeEnum.discussion,
			title: 'Study Tips and Resources',
			content:
				"Let's share some helpful study tips and resources that have worked for you. What are your favorite study methods?"
		},
		{
			type: schema.subjectThreadTypeEnum.question,
			title: 'Assignment clarification needed',
			content:
				"I'm having trouble understanding the requirements for the upcoming assignment. Could someone please clarify the expected format?"
		},
		{
			type: schema.subjectThreadTypeEnum.question,
			title: "Confused about today's lesson",
			content:
				"I didn't quite understand the concept we covered in today's class. Could someone explain it in simpler terms?"
		},
		{
			type: schema.subjectThreadTypeEnum.announcement,
			title: 'Important: Class schedule update',
			content:
				"Please note that next week's class has been moved to a different time. Check your timetable for the updated schedule."
		},
		{
			type: schema.subjectThreadTypeEnum.announcement,
			title: 'Exam dates announced',
			content:
				'The final exam dates have been confirmed. Please mark your calendars and start preparing early.'
		},
		{
			type: schema.subjectThreadTypeEnum.qanda,
			title: 'Q&A Session - Ask anything!',
			content:
				"This is an open Q&A thread. Feel free to ask any questions related to our subject, and I'll do my best to answer them."
		},
		{
			type: schema.subjectThreadTypeEnum.discussion,
			title: 'Group project ideas',
			content:
				"We need to form groups for the upcoming project. Let's discuss potential topics and find team members here."
		},
		{
			type: schema.subjectThreadTypeEnum.question,
			title: 'Textbook recommendations?',
			content:
				"Are there any additional textbooks or reading materials you'd recommend to supplement our learning?"
		},
		{
			type: schema.subjectThreadTypeEnum.discussion,
			title: 'Real-world applications',
			content:
				"How do you see the concepts we're learning being applied in real-world scenarios? Share your thoughts and examples."
		}
	];

	const threadsToInsert = [];

	// Create 3-5 threads per subject offering
	for (const offering of subjectOfferings) {
		const numberOfThreads = Math.floor(Math.random() * 3) + 3; // 3-5 threads

		// Get a random subset of thread templates
		const shuffledTemplates = threadTemplates.sort(() => 0.5 - Math.random());
		const selectedTemplates = shuffledTemplates.slice(0, numberOfThreads);

		for (const template of selectedTemplates) {
			// Pick a random user to be the thread author
			// For announcements, prefer teachers/principals
			let possibleAuthors = users;
			if (template.type === schema.subjectThreadTypeEnum.announcement) {
				const staffUsers = users.filter(
					(u) =>
						u.type === schema.userTypeEnum.teacher ||
						u.type === schema.userTypeEnum.principal ||
						u.type === schema.userTypeEnum.schoolAdmin
				);
				possibleAuthors = staffUsers.length > 0 ? staffUsers : users;
			}

			const randomAuthor = possibleAuthors[Math.floor(Math.random() * possibleAuthors.length)];

			threadsToInsert.push({
				type: template.type,
				subjectOfferingId: offering.id,
				userId: randomAuthor.id,
				title: template.title,
				content: template.content
			});
		}
	}

	// Insert all threads
	const insertedThreads = await db.insert(schema.subjectThread).values(threadsToInsert).returning();

	console.log(`📝 Seeded ${insertedThreads.length} subject threads`);

	return { threads: insertedThreads };
}

export async function seedSubjectThreadResponses(
	threads: { id: number; type: schema.subjectThreadTypeEnum }[],
	users: { id: string; type: schema.userTypeEnum }[]
) {
	const responseTemplates = [
		'Thanks for sharing this! Really helpful.',
		'I agree with this approach. Has anyone tried it before?',
		'This is exactly what I was looking for. Much appreciated!',
		'Could you elaborate on this point a bit more?',
		"I had a similar experience. Here's what worked for me...",
		'Great question! I was wondering the same thing.',
		'This clarifies things perfectly. Thank you!',
		'I think there might be another way to approach this...',
		'Has anyone found any good resources on this topic?',
		'This is really interesting. What do others think?'
	];

	const responsesToInsert = [];

	// Add 0-4 responses to each thread
	for (const thread of threads) {
		const numberOfResponses = Math.floor(Math.random() * 5); // 0-4 responses

		for (let i = 0; i < numberOfResponses; i++) {
			const randomUser = users[Math.floor(Math.random() * users.length)];
			const randomTemplate =
				responseTemplates[Math.floor(Math.random() * responseTemplates.length)];

			// Determine response type based on thread type
			let responseType = schema.subjectThreadResponseTypeEnum.comment;
			if (
				thread.type === schema.subjectThreadTypeEnum.question ||
				thread.type === schema.subjectThreadTypeEnum.qanda
			) {
				// 30% chance of being an answer for questions/Q&A
				responseType =
					Math.random() < 0.3
						? schema.subjectThreadResponseTypeEnum.answer
						: schema.subjectThreadResponseTypeEnum.comment;
			}

			responsesToInsert.push({
				type: responseType,
				subjectThreadId: thread.id,
				userId: randomUser.id,
				content: randomTemplate,
				parentResponseId: null // For simplicity, no nested responses
			});
		}
	}

	// Insert all responses
	const insertedResponses = await db
		.insert(schema.subjectThreadResponse)
		.values(responsesToInsert)
		.returning();

	console.log(`💬 Seeded ${insertedResponses.length} thread responses`);

	return { responses: insertedResponses };
}
