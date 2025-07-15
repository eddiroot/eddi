import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema';
import { geminiCompletion } from '$lib/server/ai';
import { taskComponentSchema, taskCreationPrompts } from '$lib/server/taskSchema';
import {
	createTask,
	createTaskBlock,
	getTopics,
	createCourseMapItem,
	getLearningAreaContentWithElaborationsByIds,
	createSubjectOfferingClassTask,
	getCurriculumLearningAreaWithContents,
	type CurriculumContentWithElaborations,
	getSubjectYearLevelBySubjectOfferingId
} from '$lib/server/db/service';
import { promises as fsPromises } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { taskBlockTypeEnum, taskTypeEnum } from '$lib/server/db/schema';

export const load = async ({ locals: { security }, params: { subjectOfferingId } }) => {
	security.isAuthenticated();

	let subjectOfferingIdInt;
	try {
		subjectOfferingIdInt = parseInt(subjectOfferingId, 10);
	} catch {
		throw new Error('Invalid subject offering ID or class ID');
	}

	const [form, taskTopics, learningAreaWithContents] = await Promise.all([
		superValidate(zod(formSchema)),
		getTopics(subjectOfferingIdInt),
		getCurriculumLearningAreaWithContents(subjectOfferingIdInt)
	]);

	return { form, taskTopics, learningAreaWithContents };
};

// Helper function to validate and create blocks from task schema
async function createBlocksFromSchema(taskSchema: string, taskId: number) {
	try {
		// Parse the JSON schema
		const parsedSchema = JSON.parse(taskSchema);
		// Extract task components from schema
		const taskComponents = parsedSchema?.task || [];

		if (!Array.isArray(taskComponents)) {
			console.error('Task schema does not contain a valid task array');
			return;
		}

		console.log(`Processing ${taskComponents.length} task components`);

		// Process each component and create blocks
		for (const component of taskComponents) {
			try {
				await createBlockFromComponent(component, taskId);
			} catch (error) {
				console.error('Error creating block from component:', component, error);
				// Continue processing other components even if one fails
			}
		}

		console.log('Successfully processed all task components');
	} catch (error) {
		console.error('Error parsing or processing task schema:', error);
	}
}

// Helper function to create individual blocks from components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createBlockFromComponent(component: any, taskId: number) {
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
			await createTaskBlock(taskId, type, headingText);
			console.log(`Created ${type} block with content: "${headingText}"`);
			break;
		}

		case 'markdown':
		case 'paragraph':
		case 'text': {
			// Extract markdown content properly
			const markdownContent = content?.markdown || content?.text || content || '';
			await createTaskBlock(taskId, taskBlockTypeEnum.markdown, markdownContent);
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
				await createTaskBlock(taskId, taskBlockTypeEnum.multipleChoice, multipleChoiceContent);
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
				await createTaskBlock(taskId, taskBlockTypeEnum.image, imageContent);
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
				await createTaskBlock(taskId, taskBlockTypeEnum.video, videoContent);
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
				await createTaskBlock(taskId, taskBlockTypeEnum.audio, audioContent);
				console.log(`Created audio block: "${audioContent.title}"`);
			} else {
				console.warn('Invalid audio content structure:', content);
			}
			break;

		// Handle title and subtitle as headings
		case 'title': {
			const titleText = content?.text || content || 'Title';
			await createTaskBlock(taskId, taskBlockTypeEnum.h1, titleText);
			console.log(`Created h1 block from title: "${titleText}"`);
			break;
		}

		case 'subtitle': {
			const subtitleText = content?.text || content || 'Subtitle';
			await createTaskBlock(taskId, taskBlockTypeEnum.h2, subtitleText);
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
				await createTaskBlock(taskId, taskBlockTypeEnum.fillInBlank, fillInBlankContent);
				console.log(`Created fill-in-blank block: "${content.sentence}"`);
			} else {
				console.warn('Invalid fill-in-blank content structure:', content);
			}
			break;

		case 'matching':
			// Validate and transform matching content structure
			if (content && content.instructions !== undefined && Array.isArray(content.pairs)) {
				const matchingContent = {
					instructions: content.instructions || '',
					pairs: content.pairs
						.filter(
							(pair: { left?: unknown; right?: unknown }) =>
								pair &&
								typeof pair.left === 'string' &&
								typeof pair.right === 'string' &&
								pair.left.trim() &&
								pair.right.trim()
						)
						.map((pair: { left: string; right: string }) => ({
							left: pair.left.trim(),
							right: pair.right.trim()
						}))
				};

				// Only create the block if we have valid pairs
				if (matchingContent.pairs.length > 0) {
					await createTaskBlock(taskId, taskBlockTypeEnum.matching, matchingContent);
					console.log(
						`Created matching block with ${matchingContent.pairs.length} pairs: "${matchingContent.instructions}"`
					);
				} else {
					console.warn('No valid matching pairs found in content:', content);
				}
			} else {
				console.warn('Invalid matching content structure:', content);
			}
			break;

		case 'short_answer':
			// Validate and transform text input content structure
			if (content && content.question) {
				// Clean up the question text by removing excessive newlines and whitespace
				let questionText = content.question || content.text || '';

				// Remove excessive newlines (more than 2 consecutive newlines)
				questionText = questionText.replace(/\n{3,}/g, '\n\n');
				// Remove excessive whitespace
				questionText = questionText.replace(/\s{3,}/g, ' ');
				// Trim whitespace and ensure reasonable length
				questionText = questionText.trim();

				// Skip if the question is too short or appears to be malformed
				if (questionText.length < 3) {
					console.warn('Text input question too short, skipping:', questionText);
					break;
				}
				if (questionText.length > 2000) {
					console.warn(
						'Text input question too long, truncating:',
						questionText.substring(0, 100) + '...'
					);
					questionText = questionText.substring(0, 2000);
				}

				const shortAnswerContent = {
					question: questionText
				};
				await createTaskBlock(taskId, taskBlockTypeEnum.shortAnswer, shortAnswerContent);
				console.log(
					`Created text input block: "${shortAnswerContent.question.substring(0, 100)}${shortAnswerContent.question.length > 100 ? '...' : ''}"`
				);
			} else {
				console.warn('Invalid text input content structure:', content);
			}
			break;

		case 'drag_and_drop':
		case 'math_input':
			console.log(`Ignoring unsupported block type: ${type}`);
			break;

		default:
			console.warn(`Unknown block type: ${type}, ignoring`);
			break;
	}
}

export const actions = {
	createTask: async ({
		request,
		locals: { security },
		params: { subjectOfferingId, subjectOfferingClassId }
	}) => {
		const user = security.isAuthenticated().getUser();
		const subjectOfferingIdInt = parseInt(subjectOfferingId, 10);
		const subjectOfferingClassIdInt = parseInt(subjectOfferingClassId, 10);

		// Read the form data ONCE
		const formData = await request.formData();
		const form = await superValidate(formData, zod(formSchema));

		// Extract selected learning area content IDs
		const selectedLearningAreaContentIds = form.data.selectedLearningAreaContentIds || [];

		let learningAreaContentData: CurriculumContentWithElaborations[] = [];
		if (selectedLearningAreaContentIds.length > 0) {
			learningAreaContentData = await getLearningAreaContentWithElaborationsByIds(
				selectedLearningAreaContentIds
			);
		}

		let courseMapItemId = form.data.taskTopicId;
		// Create new topic if needed
		if (form.data.newTopicName && !courseMapItemId) {
			const newTopic = await createCourseMapItem(subjectOfferingIdInt, form.data.newTopicName);
			courseMapItemId = newTopic.id;
		}

		const task = await createTask(
			form.data.title,
			form.data.description,
			1,
			taskTypeEnum[form.data.type],
			subjectOfferingIdInt
		);

		await createSubjectOfferingClassTask(
			task.id,
			subjectOfferingClassIdInt,
			user.id,
			courseMapItemId,
			form.data.week
		);

		let contentElaborationPrompt = '';
		if (learningAreaContentData.length > 0) {
			contentElaborationPrompt = learningAreaContentData
				.map((item) => {
					const lac = item.learningAreaContent;
					let contextText = `${lac.name}`;
					if (lac.description) {
						contextText += `\nDescription: ${lac.description}`;
					}
					if (item.elaborations && item.elaborations.length > 0) {
						const elaborationsText = item.elaborations
							.map((elab) => `- ${elab.contentElaboration}`)
							.join('\n');
						contextText += `\nElaborations:\n${elaborationsText}`;
					}
					return contextText;
				})
				.join('\n\n');
			contentElaborationPrompt = `\n\nCURRICULUM CONTEXT:\nPlease ensure the task aligns with these specific learning outcomes and elaborations:\n\n${contentElaborationPrompt}`;
		}

		// Now get the AI files from the same formData
		const yearLevel = await getSubjectYearLevelBySubjectOfferingId(subjectOfferingIdInt);
		const aiFiles = form.data.files || [];
		const validFiles = aiFiles.filter(
			(file): file is File => file instanceof File && file.size > 0
		);
		let tempFilePaths: string[] = [];
		let taskSchema = '';

		if (validFiles.length > 0) {
			// Save all files to temp directory
			const savePromises = validFiles.map(async (file, index) => {
				const timestamp = Date.now();
				const fileName = `${timestamp}-${index}-${file.name}`;
				const tempFilePath = join(tmpdir(), fileName);
				const arrayBuffer = await file.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);
				await fsPromises.writeFile(tempFilePath, buffer);
				return tempFilePath;
			});

			tempFilePaths = await Promise.all(savePromises);

			let enhancedPrompt = taskCreationPrompts[form.data.type](
				form.data.title,
				form.data.description || ''
			);
			enhancedPrompt += `For Year Level: ${yearLevel}\n` + contentElaborationPrompt;

			for (const tempFilePath of tempFilePaths) {
				taskSchema += await geminiCompletion(enhancedPrompt, tempFilePath, taskComponentSchema);
			}
		} else if (form.data.creationMethod === 'ai') {
			// AI mode but no files
			let enhancedPrompt = taskCreationPrompts[form.data.type](
				form.data.title,
				form.data.description || ''
			);
			enhancedPrompt += `For Year Level: ${yearLevel}\n` + contentElaborationPrompt;

			taskSchema = await geminiCompletion(enhancedPrompt, undefined, taskComponentSchema);
		}
		// Clean up all temp files
		if (tempFilePaths.length > 0) {
			console.log(`Cleaning up ${tempFilePaths.length} temp files...`);
			const cleanupPromises = tempFilePaths.map(async (tempFilePath) => {
				await fsPromises.unlink(tempFilePath);
				console.log(`Temp file ${tempFilePath} deleted`);
			});
			await Promise.all(cleanupPromises);
			console.log('Cleanup completed');
		}
		form.data.files = undefined;

		// Process the task schema and create blocks
		if (taskSchema) {
			try {
				await createBlocksFromSchema(taskSchema, task.id);
			} catch (error) {
				throw new Error(`Error creating blocks from schema: ${error}`);
			}
		}
		throw redirect(
			303,
			`/subjects/${subjectOfferingId}/class/${subjectOfferingClassId}/tasks/${task.id}`
		);
	}
};
