import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../schema';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

/**
 * Seeds lesson topics, lessons, and lesson blocks for each subject class.
 * @param subjectClasses Array of subject class objects (must have id)
 * @returns { topics, lessons, blocks }
 */
export async function seedLessons(subjectClasses: { id: number }[]) {
	const topicTemplates = [
		'Introduction',
		'Core Concepts',
		'Applications',
		'Assessment',
		'Extension'
	];

	const lessonTemplates = [
		{
			type: schema.lessonTypeEnum.lesson,
			title: 'Lesson',
			description: 'A standard lesson covering the main topic.'
		},
		{
			type: schema.lessonTypeEnum.assessment,
			title: 'Assessment',
			description: 'An assessment to test your understanding.'
		},
		{
			type: schema.lessonTypeEnum.homework,
			title: 'Homework',
			description: 'Homework to reinforce learning.'
		}
	];

	const blockTemplates = [
		{
			type: schema.lessonBlockTypeEnum.h2,
			content: (title: string) => ({ text: title })
		},
		{
			type: schema.lessonBlockTypeEnum.markdown,
			content: (title: string) => ({ markdown: `This section covers **${title}** in detail.` })
		},
		{
			type: schema.lessonBlockTypeEnum.h3,
			content: () => ({ text: 'Key Points' })
		},
		{
			type: schema.lessonBlockTypeEnum.markdown,
			content: () => ({ markdown: '- Point 1\n- Point 2\n- Point 3' })
		}
	];

	const topicsToInsert: Omit<schema.LessonTopic, 'id' | 'createdAt' | 'updatedAt'>[] = [];
	const lessonsToInsert: Omit<schema.Lesson, 'id' | 'createdAt' | 'updatedAt'>[] = [];
	const blocksToInsert: Omit<schema.LessonBlock, 'id' | 'createdAt' | 'updatedAt'>[] = [];

	for (const subjectClass of subjectClasses) {
		const numTopics = Math.floor(Math.random() * 2) + 3; // 3-4 topics
		const shuffledTopics = topicTemplates.sort(() => 0.5 - Math.random());
		const selectedTopics = shuffledTopics.slice(0, numTopics);

		selectedTopics.forEach((topicName, topicIdx) => {
			topicsToInsert.push({
				name: topicName,
				index: topicIdx,
				subjectClassId: subjectClass.id,
				isArchived: false
			});
		});
	}

	// Insert topics and get their IDs
	const insertedTopics = await db.insert(schema.lessonTopic).values(topicsToInsert).returning();

	for (const topic of insertedTopics) {
		const numLessons = Math.floor(Math.random() * 2) + 2; // 2-3 lessons per topic
		const shuffledLessons = lessonTemplates.sort(() => 0.5 - Math.random());
		const selectedLessons = shuffledLessons.slice(0, numLessons);

		selectedLessons.forEach((template, lessonIdx) => {
			const lessonTitle = `${template.title}: ${topic.name}`;
			lessonsToInsert.push({
				title: lessonTitle,
				type: template.type,
				description: `${template.description} Topic: ${topic.name}.`,
				lessonStatus: schema.lessonStatusEnum.published,
				index: lessonIdx,
				lessonTopicId: topic.id,
				dueDate:
					template.type === schema.lessonTypeEnum.homework ||
					template.type === schema.lessonTypeEnum.assessment
						? new Date(Date.now() + (lessonIdx + 1) * 7 * 24 * 60 * 60 * 1000) // 1 week per lesson
						: null,
				isArchived: false
			});
		});
	}

	const insertedLessons = await db.insert(schema.lesson).values(lessonsToInsert).returning();

	for (const lesson of insertedLessons) {
		blockTemplates.forEach((block, blockIdx) => {
			blocksToInsert.push({
				lessonId: lesson.id,
				type: block.type,
				content: block.content(lesson.title),
				index: blockIdx
			});
		});
	}

	const insertedBlocks = await db.insert(schema.lessonBlock).values(blocksToInsert).returning();

	console.log(
		`📚 Seeded ${insertedTopics.length} lesson topics, ${insertedLessons.length} lessons, and ${insertedBlocks.length} lesson blocks.`
	);

	return { topics: insertedTopics, lessons: insertedLessons, blocks: insertedBlocks };
}
