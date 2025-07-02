import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema';
import { geminiCompletion } from '$lib/server/ai';
import { lessonComponentSchema, lessonCreationPrompts } from './constants';
import {
	createLesson,
	createLessonTopic,
	getLessonTopicsBySubjectOfferingId,
	createLessonBlock
} from '$lib/server/db/service';
import { promises as fsPromises } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { lessonBlockTypeEnum, lessonStatusEnum } from '$lib/server/db/schema';

export const load = async ({ locals: { security }, params: { subjectOfferingId } }) => {
	security.isAuthenticated();

	let subjectOfferingIdInt;
	try {
		subjectOfferingIdInt = parseInt(subjectOfferingId, 10);
	} catch {
		throw new Error('Invalid subject offering ID');
	}

	const [form, lessonTopics] = await Promise.all([
		superValidate(zod(formSchema)),
		getLessonTopicsBySubjectOfferingId(subjectOfferingIdInt)
	]);

	return { form, lessonTopics };
};

// Helper function to validate and create blocks from lesson schema
async function createBlocksFromSchema(lessonSchema: string, lessonId: number) {
	try {
		// Parse the JSON schema
		const parsedSchema = JSON.parse(lessonSchema);
		// Extract lesson components from schema
		const lessonComponents = parsedSchema?.lesson || [];

		if (!Array.isArray(lessonComponents)) {
			console.error('Lesson schema does not contain a valid lesson array');
			return;
		}

		console.log(`Processing ${lessonComponents.length} lesson components`);

		// Process each component and create blocks
		for (const component of lessonComponents) {
			try {
				await createBlockFromComponent(component, lessonId);
			} catch (error) {
				console.error('Error creating block from component:', component, error);
				// Continue processing other components even if one fails
			}
		}

		console.log('Successfully processed all lesson components');
	} catch (error) {
		console.error('Error parsing or processing lesson schema:', error);
	}
}

// Helper function to create individual blocks from components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createBlockFromComponent(component: any, lessonId: number) {
	if (!component || !component.type) {
		console.warn('Invalid component structure:', component);
		return;
	}

	const { type, content } = component;

	switch (type) {
		case 'h1':
		case 'h2':
		case 'h3':
		case 'h4':
		case 'h5': {
			// Extract text content properly
			const headingText = content?.text || content || 'Heading';
			await createLessonBlock(lessonId, type, headingText);
			console.log(`Created ${type} block with content: "${headingText}"`);
			break;
		}

		case 'markdown':
		case 'paragraph':
		case 'text': {
			// Extract markdown content properly
			const markdownContent = content?.markdown || content?.text || content || '';
			await createLessonBlock(lessonId, lessonBlockTypeEnum.markdown, markdownContent);
			console.log(`Created markdown block with content length: ${markdownContent.length}`);
			break;
		}

		case 'multiple_choice':
			// Validate and transform multiple choice content structure
			if (content && content.question && content.options && content.answer !== undefined) {
				const multipleChoiceContent = {
					question: content.question,
					options: content.options,
					answer: content.answer,
					multiple: content.multiple || (Array.isArray(content.answer) ? true : false)
				};
				await createLessonBlock(
					lessonId,
					lessonBlockTypeEnum.multipleChoice,
					multipleChoiceContent
				);
				console.log(`Created multiple choice block: "${content.question}"`);
			} else {
				console.warn('Invalid multiple choice content structure:', content);
			}
			break;

		case 'image':
			// Validate and transform image content structure
			if (content && (content.url || content.src)) {
				const imageContent = {
					src: content.url || content.src || '',
					alt: content.alt || content.caption || 'Image',
					caption: content.caption || content.alt || ''
				};
				await createLessonBlock(lessonId, lessonBlockTypeEnum.image, imageContent);
				console.log(`Created image block: "${imageContent.caption}"`);
			} else {
				console.warn('Invalid image content structure:', content);
			}
			break;

		case 'video':
			// Validate video content structure
			if (content && (content.url || content.src)) {
				const videoContent = {
					src: content.url || content.src || '',
					title: content.title || content.caption || 'Video'
				};
				await createLessonBlock(lessonId, lessonBlockTypeEnum.video, videoContent);
				console.log(`Created video block: "${videoContent.title}"`);
			} else {
				console.warn('Invalid video content structure:', content);
			}
			break;

		case 'audio':
			// Validate audio content structure
			if (content && (content.url || content.src)) {
				const audioContent = {
					src: content.url || content.src || '',
					title: content.title || content.caption || 'Audio'
				};
				await createLessonBlock(lessonId, lessonBlockTypeEnum.audio, audioContent);
				console.log(`Created audio block: "${audioContent.title}"`);
			} else {
				console.warn('Invalid audio content structure:', content);
			}
			break;

		// Handle title and subtitle as headings
		case 'title': {
			const titleText = content?.text || content || 'Title';
			await createLessonBlock(lessonId, lessonBlockTypeEnum.h1, titleText);
			console.log(`Created h1 block from title: "${titleText}"`);
			break;
		}

		case 'subtitle': {
			const subtitleText = content?.text || content || 'Subtitle';
			await createLessonBlock(lessonId, lessonBlockTypeEnum.h2, subtitleText);
			console.log(`Created h2 block from subtitle: "${subtitleText}"`);
			break;
		}

		// Unsupported block types that we'll ignore for now
		case 'fill_in_blank':
			// Validate and transform fill-in-blank content structure
			if (content && content.sentence && content.answer) {
				const fillInBlankContent = {
					sentence: content.sentence,
					answer: content.answer
				};
				await createLessonBlock(lessonId, lessonBlockTypeEnum.fillInBlank, fillInBlankContent);
				console.log(`Created fill-in-blank block: "${content.sentence}"`);
			} else {
				console.warn('Invalid fill-in-blank content structure:', content);
			}
			break;

		case 'matching':
		case 'drag_and_drop':
		case 'math_input':
		case 'text_input':
		case 'input':
			console.log(`Ignoring unsupported block type: ${type}`);
			break;

		default:
			console.warn(`Unknown block type: ${type}, ignoring`);
			break;
	}
}

export const actions = {
	createLesson: async ({ request, locals: { security }, params: { subjectOfferingId } }) => {
		security.isAuthenticated();

		let subjectOfferingIdInt;
		try {
			subjectOfferingIdInt = parseInt(subjectOfferingId, 10);
		} catch {
			return fail(400, { message: 'Invalid subject offering ID' });
		}

		// Read the form data ONCE
		const formData = await request.formData();
		const form = await superValidate(formData, zod(formSchema));

		let lessonTopicId = form.data.lessonTopicId;

		// Create new topic if needed
		if (form.data.newTopicName && !lessonTopicId) {
			try {
				const newTopic = await createLessonTopic(subjectOfferingIdInt, form.data.newTopicName);
				lessonTopicId = newTopic.id;
				console.log('Created new topic:', newTopic);
			} catch (error) {
				console.error('Error creating new topic:', error);
				return fail(500, { form, message: 'Error creating new topic' });
			}
		}

		if (!lessonTopicId) {
			return fail(400, { form, message: 'Topic is required' });
		}

		const lesson = await createLesson(
			form.data.title,
			form.data.description,
			lessonStatusEnum.draft,
			form.data.type,
			lessonTopicId,
			form.data.dueDate
		);
		console.log('Created lesson:', form.data);

		// Now get the AI files from the same formData
		const aiFiles = form.data.files || [];
		console.log('AI files from formData:', aiFiles.length, 'files found');

		// Log each AI file
		aiFiles.forEach((file, index) => {
			if (file instanceof File) {
				console.log(`AI File ${index}: name=${file.name}, size=${file.size}, type=${file.type}`);
			} else {
				console.log(`AI File ${index}: Not a File object -`, typeof file, file);
			}
		});

		// Filter out empty files and ensure they're File objects
		const validFiles = aiFiles.filter(
			(file): file is File => file instanceof File && file.size > 0
		);

		console.log(`Valid files after filtering: ${validFiles.length} out of ${aiFiles.length}`);
		validFiles.forEach((file, index) => {
			console.log(`Valid File ${index}: ${file.name} (${file.size} bytes, ${file.type})`);
		});

		let tempFilePaths: string[] = [];
		let lessonSchema = '';

		try {
			if (validFiles.length > 0) {
				console.log(`Processing ${validFiles.length} AI files...`);

				// Save all files to temp directory
				const savePromises = validFiles.map(async (file, index) => {
					const timestamp = Date.now();
					const fileName = `${timestamp}-${index}-${file.name}`;
					const tempFilePath = join(tmpdir(), fileName);

					const arrayBuffer = await file.arrayBuffer();
					const buffer = Buffer.from(arrayBuffer);
					await fsPromises.writeFile(tempFilePath, buffer);

					console.log(`Temp file saved to ${tempFilePath} (${buffer.length} bytes)`);
					return tempFilePath;
				});

				tempFilePaths = await Promise.all(savePromises);
				console.log('All temp files saved:', tempFilePaths);

				// Pass files directly to Gemini instead of combining into text
				console.log('Sending files to Gemini:', tempFilePaths);
				for (const tempFilePath of tempFilePaths) {
					console.log(`Processing temp file: ${tempFilePath}`);
					lessonSchema += await geminiCompletion(
						lessonCreationPrompts[form.data.type],
						tempFilePath,
						lessonComponentSchema
					);
				}
			} else if (form.data.creationMethod === 'ai') {
				// AI mode but no files
				console.log('AI mode with no files - sending text-only prompt to Gemini');
				lessonSchema = await geminiCompletion(
					lessonCreationPrompts[form.data.type],
					undefined,
					lessonComponentSchema
				);
			} else {
				console.log('Manual creation method selected');
			}
		} catch (error) {
			console.error('Error creating response:', error);

			// Clear files from form to prevent serialization error
			form.data.files = undefined;

			return fail(500, { form, message: 'Error processing AI files' });
		} finally {
			// Clean up all temp files
			if (tempFilePaths.length > 0) {
				console.log(`Cleaning up ${tempFilePaths.length} temp files...`);
				const cleanupPromises = tempFilePaths.map(async (tempFilePath) => {
					try {
						await fsPromises.unlink(tempFilePath);
						console.log(`Temp file ${tempFilePath} deleted`);
					} catch (error) {
						console.error('Error deleting temp file:', error);
					}
				});
				await Promise.all(cleanupPromises);
				console.log('Cleanup completed');
			}
		}

		// Clear files from form to prevent serialization error
		form.data.files = undefined;

		// Process the lesson schema and create blocks
		if (lessonSchema) {
			console.log('Lesson schema from Gemini:', lessonSchema);
			try {
				await createBlocksFromSchema(lessonSchema, lesson.id);
				console.log('Successfully created lesson blocks from schema');
			} catch (error) {
				console.error('Error creating blocks from schema:', error);
				// Don't fail the entire request if block creation fails
			}
		} else {
			console.log('No lesson schema generated (manual mode or failed AI generation)');
		}

		throw redirect(303, `/subjects/${subjectOfferingIdInt}/lessons/${lesson.id}`);
	}
};
