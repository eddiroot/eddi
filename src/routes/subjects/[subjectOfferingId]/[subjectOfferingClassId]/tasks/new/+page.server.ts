import { redirect } from '@sveltejs/kit';
import { superValidate, fail } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema';
import { geminiCompletion } from '$lib/server/ai';
import { taskComponentSchema, taskCreationPrompts } from './constants';
import {
	createTask,
	createTaskBlock,
	getTopics,
	createCourseMapItem,
	getLearningAreaContentWithElaborationsByIds,
	createSubjectOfferingTask
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

	const [form, taskTopics] = await Promise.all([
		superValidate(zod(formSchema)),
		getTopics(subjectOfferingIdInt)
	]);

	return { form, taskTopics };
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
	createTask: async ({
		request,
		locals: { security },
		params: { subjectOfferingId, subjectOfferingClassId }
	}) => {
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

		// Extract selected learning area content IDs
		let selectedLearningAreaContentIds: number[] = [];
		const learningContentData = formData.get('selectedLearningAreaContentIds');
		if (learningContentData && typeof learningContentData === 'string') {
			try {
				selectedLearningAreaContentIds = JSON.parse(learningContentData);
			} catch (error) {
				console.error('Error parsing learning area content IDs:', error);
			}
		}

		// Get learning area content with elaborations if any were selected
		let learningAreaContentData: Array<{
			id: number;
			name: string;
			description: string | null;
			elaborations: Array<{
				id: number;
				learningAreaContentId: number;
				name: string;
				contentElaboration: string;
			}>;
		}> = [];
		if (selectedLearningAreaContentIds.length > 0) {
			try {
				learningAreaContentData = await getLearningAreaContentWithElaborationsByIds(
					selectedLearningAreaContentIds
				);
				console.log(
					`Loaded ${learningAreaContentData.length} learning area content items with elaborations`
				);
			} catch (error) {
				console.error('Error loading learning area content with elaborations:', error);
			}
		}

		let taskTopicId = form.data.taskTopicId;

		// Create new topic if needed
		if (form.data.newTopicName && !taskTopicId) {
			try {
				const newTopic = await createCourseMapItem(subjectOfferingIdInt, form.data.newTopicName);
				taskTopicId = newTopic.id;
				console.log('Created new topic:', newTopic);
			} catch (error) {
				console.error('Error creating new topic:', error);
				return fail(500, { form, message: 'Error creating new topic' });
			}
		}
		if (!taskTopicId) {
			return fail(400, { form, message: 'Topic is required' });
		}

		const user = security.isAuthenticated().getUser();

		const task = await createTask(
			form.data.title,
			form.data.description,
			1,
			taskTypeEnum[form.data.type]
		);

		await createSubjectOfferingTask(task.id, subjectOfferingIdInt, user.id, taskTopicId);

		console.log('Created task:', form.data);

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
		let taskSchema = '';

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

				// Create enhanced prompt with learning area content
				let enhancedPrompt = taskCreationPrompts[form.data.type];
				if (learningAreaContentData.length > 0) {
					const curriculumContext = learningAreaContentData
						.map((content) => {
							let contextText = `${content.name}`;
							if (content.description) {
								contextText += `\nDescription: ${content.description}`;
							}
							if (content.elaborations.length > 0) {
								const elaborationsText = content.elaborations
									.map((elab) => `- ${elab.name}: ${elab.contentElaboration}`)
									.join('\n');
								contextText += `\nElaborations:\n${elaborationsText}`;
							}
							return contextText;
						})
						.join('\n\n');

					enhancedPrompt += `\n\nCURRICULUM CONTEXT:\nPlease ensure the task aligns with these specific learning outcomes and elaborations:\n\n${curriculumContext}\n\nUse this curriculum context to guide the content, complexity, and focus of the task you create.`;
				}

				// Pass files directly to Gemini instead of combining into text
				console.log('Sending files to Gemini:', tempFilePaths);
				for (const tempFilePath of tempFilePaths) {
					console.log(`Processing temp file: ${tempFilePath}`);
					taskSchema += await geminiCompletion(enhancedPrompt, tempFilePath, taskComponentSchema);
				}
			} else if (form.data.creationMethod === 'ai') {
				// AI mode but no files
				console.log('AI mode with no files - sending text-only prompt to Gemini');
				let enhancedPrompt = taskCreationPrompts[form.data.type];
				if (learningAreaContentData.length > 0) {
					const curriculumContext = learningAreaContentData
						.map((content) => {
							let contextText = `${content.name}`;
							if (content.description) {
								contextText += `\nDescription: ${content.description}`;
							}
							if (content.elaborations.length > 0) {
								const elaborationsText = content.elaborations
									.map((elab) => `- ${elab.name}: ${elab.contentElaboration}`)
									.join('\n');
								contextText += `\nElaborations:\n${elaborationsText}`;
							}
							return contextText;
						})
						.join('\n\n');

					enhancedPrompt += `\n\nCURRICULUM CONTEXT:\nPlease create a task that aligns with these specific learning outcomes and elaborations:\n\n${curriculumContext}\n\nUse this curriculum context to guide the content, complexity, and focus of the task you create. The task should be based on the title "${form.data.title}" and description "${form.data.description}".`;
				}

				taskSchema = await geminiCompletion(enhancedPrompt, undefined, taskComponentSchema);
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

		// Process the task schema and create blocks
		if (taskSchema) {
			console.log('Task schema from Gemini:', taskSchema);
			try {
				await createBlocksFromSchema(taskSchema, task.id);
				console.log('Successfully created task blocks from schema');
			} catch (error) {
				console.error('Error creating blocks from schema:', error);
				// Don't fail the entire request if block creation fails
			}
		} else {
			console.log('No task schema generated (manual mode or failed AI generation)');
		}

		throw redirect(
			303,
			`/subjects/${subjectOfferingId}/${subjectOfferingClassId}/tasks/${task.id}`
		);
	}
};
