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
	getLearningAreaStandardWithElaborationsByIds,
	createSubjectOfferingClassTask,
	getCurriculumLearningAreaWithStandards,
	type CurriculumStandardWithElaborations,
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
		getCurriculumLearningAreaWithStandards(subjectOfferingIdInt)
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
	if (!component || !component.content || !component.content.type) {
		console.warn('Invalid component structure:', component);
		return;
	}

	const type = component.content.type;
	const content = component.content.content;

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
		case 'paragraph': {
			// Extract paragraph content properly
			const paragraphContent = content?.markdown || '';
			await createTaskBlock(taskId, taskBlockTypeEnum.markdown, paragraphContent);
			console.log(`Created paragraph block with content length: ${paragraphContent.length}`);
			break;
		}
		case 'math_input': {
			// const question = content?.question || '';
			// const answerLatex = content?.answer_latex || '';
			// await createTaskBlock(taskId, 'math_input', { question, answer_latex: answerLatex });
			break;
		}
		case 'multiple_choice': {
			// Validate and transform multiple choice content structure
			const question = content?.question || '';
			const options = content?.options || [];
			const multiple = content?.multiple || false;
			const answer = component.answer || [];
			await createTaskBlock(taskId, taskBlockTypeEnum.multipleChoice, { question, options, answer, multiple});
			console.log(`Created multiple choice block: "${question}"`);
			break;
		}

		case 'image': {
			// Validate and transform image content structure
			const url = content?.url || '';
			const caption = content?.caption || '';
			await createTaskBlock(taskId, taskBlockTypeEnum.image, { url, caption });
			console.log(`Created image block: "${caption}"`);
			break;
		}

		case 'video': {
			const url = content?.url || '';
			const caption = content?.caption || '';
			await createTaskBlock(taskId, taskBlockTypeEnum.video, { url, caption });
			console.log(`Created video block: "${caption}"`);
			break;
		}

		// Unsupported block types that we'll ignore for now
		case 'fill_in_blank': {
			const sentence = content?.sentence || '';
			const answer = component.answer || [];
			await createTaskBlock(taskId, taskBlockTypeEnum.fillInBlank, { sentence, answer });
			console.log(`Created fill-in-blank block: "${sentence}"`);
			break;
		}

		case 'matching': {
			const instructions = content?.instructions || '';
			const pairs = content?.pairs || [];
			await createTaskBlock(taskId, taskBlockTypeEnum.matching, { instructions, pairs });
			console.log(`Created matching block with ${pairs.length} pairs: "${instructions}"`);
			break;
		}
		case 'short_answer': {
			const question = content?.question || '';
			await createTaskBlock(taskId, taskBlockTypeEnum.shortAnswer, { question });
			console.log(`Created short answer block: "${question}"`);
			break;
		}

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

		let learningAreaContentData: CurriculumStandardWithElaborations[] = [];
		if (selectedLearningAreaContentIds.length > 0) {
			learningAreaContentData = await getLearningAreaStandardWithElaborationsByIds(
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
			form.data.week,
			form.data.dueDate
		);

		let contentElaborationPrompt = '';
		if (learningAreaContentData.length > 0) {
			contentElaborationPrompt = learningAreaContentData
				.map((item) => {
					const lac = item.learningAreaStandard;
					let contextText = `${lac.name}`;
					if (lac.description) {
						contextText += `\nDescription: ${lac.description}`;
					}
					if (item.elaborations && item.elaborations.length > 0) {
						const elaborationsText = item.elaborations
							.map((elab) => `- ${elab.standardElaboration}`)
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
