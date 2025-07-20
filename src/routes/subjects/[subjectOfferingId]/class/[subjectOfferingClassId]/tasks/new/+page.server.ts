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
	getSubjectYearLevelBySubjectOfferingId,
	createAnswer,
	createCriteria
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
			throw new Error('Invalid task schema: task property must be an array');
		}

		// Process each component and create blocks
		for (let i = 0; i < taskComponents.length; i++) {
			const component = taskComponents[i];
			try {
				await createBlockFromComponent(component, taskId);
			} catch (error) {
				console.error(`Error creating block from component ${i + 1}:`, component, error);
				// Continue processing other components even if one fails
			}
		}
	} catch (error) {
		console.error('Error parsing or processing task schema:', error);
		throw new Error(`Failed to process task schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

	let createdBlock;

	switch (type) {
		case 'h1':
		case 'h2':
		case 'h3':
		case 'h4':
		case 'h5': {
			// Extract text content properly
			const headingText = content?.text || content || 'Heading';
			createdBlock = await createTaskBlock(taskId, type, headingText);
			break;
		}
		case 'paragraph': {
			// Extract paragraph content properly
			const paragraphContent = content?.markdown || '';
			createdBlock = await createTaskBlock(taskId, taskBlockTypeEnum.markdown, paragraphContent);
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
			createdBlock = await createTaskBlock(taskId, taskBlockTypeEnum.multipleChoice, { question, options, answer, multiple});
			break;
		}

		case 'image': {
			// Validate and transform image content structure
			const url = content?.url || '';
			const caption = content?.caption || '';
			createdBlock = await createTaskBlock(taskId, taskBlockTypeEnum.image, { url, caption });
			break;
		}

		case 'video': {
			const url = content?.url || '';
			const caption = content?.caption || '';
			createdBlock = await createTaskBlock(taskId, taskBlockTypeEnum.video, { url, caption });
			break;
		}

		// Unsupported block types that we'll ignore for now
		case 'fill_in_blank': {
			const sentence = content?.sentence || '';
			const answer = component.answer || [];
			createdBlock = await createTaskBlock(taskId, taskBlockTypeEnum.fillInBlank, { sentence, answer });
			break;
		}

		case 'matching': {
			const instructions = content?.instructions || '';
			const pairs = content?.pairs || [];
			createdBlock = await createTaskBlock(taskId, taskBlockTypeEnum.matching, { instructions, pairs });
			break;
		}
		case 'short_answer': {
			const question = content?.question || '';
			createdBlock = await createTaskBlock(taskId, taskBlockTypeEnum.shortAnswer, { question });
			break;
		}

		default:
			console.warn(`Unknown block type: ${type}, ignoring`);
			return;
	}

	// If block was created successfully, process answers and criteria
	if (createdBlock) {
		await processAnswersAndCriteria(component, createdBlock.id);
	}
}

// Helper function to process answers and criteria for a task block
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processAnswersAndCriteria(component: any, taskBlockId: number) {
	try {
		// Process answers
		if (component.answers && Array.isArray(component.answers)) {
			for (const answerData of component.answers) {
				const answer = answerData.answer || answerData;
				const marks = answerData.marks || answerData.mark || undefined;
				
				await createAnswer(taskBlockId, answer, marks);
			}
		} else if (component.answer !== undefined) {
			// Handle single answer (like in multiple choice, fill in blank, etc.)
			const marks = component.marks || component.mark || undefined;
			await createAnswer(taskBlockId, component.answer, marks);
		}

		// Process criteria
		if (component.criteria && Array.isArray(component.criteria)) {
			for (const criteriaData of component.criteria) {
				const description = criteriaData.description || criteriaData.criterion || criteriaData;
				const marks = criteriaData.marks || criteriaData.mark || 1; // Default to 1 mark if not specified
				
				if (typeof description === 'string' && description.trim()) {
					await createCriteria(taskBlockId, description.trim(), marks);
				}
			}
		}

		// Process marking criteria (alternative structure)
		if (component.marking_criteria && Array.isArray(component.marking_criteria)) {
			for (const criteriaData of component.marking_criteria) {
				const description = criteriaData.description || criteriaData.criterion || criteriaData;
				const marks = criteriaData.marks || criteriaData.mark || 1;
				
				if (typeof description === 'string' && description.trim()) {
					await createCriteria(taskBlockId, description.trim(), marks);
				}
			}
		}

	} catch (error) {
		console.error(`Error processing answers/criteria for task block ${taskBlockId}:`, error);
		// Don't throw - continue processing other blocks
	}
}

export const actions = {
	createTask: async ({
		request,
		locals: { security },
		params: { subjectOfferingId, subjectOfferingClassId }
	}) => {
		try {
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
				subjectOfferingIdInt,
				form.data.aiTutorEnabled
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
					try {
						const aiResponse = await geminiCompletion(enhancedPrompt, tempFilePath, taskComponentSchema);
						taskSchema += aiResponse;
					} catch (aiError) {
						console.error(`Error processing file ${tempFilePath}:`, aiError);
						throw new Error(`AI generation failed for uploaded file: ${aiError}`);
					}
				}
			} else if (form.data.creationMethod === 'ai') {
				// AI mode but no files
				let enhancedPrompt = taskCreationPrompts[form.data.type](
					form.data.title,
					form.data.description || ''
				);
				enhancedPrompt += `For Year Level: ${yearLevel}\n` + contentElaborationPrompt;

				try {
					taskSchema = await geminiCompletion(enhancedPrompt, undefined, taskComponentSchema);
				} catch (aiError) {
					console.error('Error in AI generation:', aiError);
					throw new Error(`AI generation failed: ${aiError}`);
				}
			}

			// Clean up all temp files
			if (tempFilePaths.length > 0) {
				try {
					const cleanupPromises = tempFilePaths.map(async (tempFilePath) => {
						await fsPromises.unlink(tempFilePath);
					});
					await Promise.all(cleanupPromises);
				} catch (cleanupError) {
					console.error('Error during cleanup:', cleanupError);
					// Don't throw here, cleanup errors shouldn't prevent task creation
				}
			}
			form.data.files = undefined;

			// Process the task schema and create blocks
			if (taskSchema) {
				try {
					await createBlocksFromSchema(taskSchema, task.id);
				} catch (schemaError) {
					console.error('Error creating blocks from schema:', schemaError);
					throw new Error(`Error creating task blocks: ${schemaError}`);
				}
			}

			// Only redirect if everything succeeded
			throw redirect(
				303,
				`/subjects/${subjectOfferingId}/class/${subjectOfferingClassId}/tasks/${task.id}`
			);
		} catch (error) {
			console.error('Task creation error:', error);
			// Return error response instead of throwing
			return {
				status: 500,
				error: error instanceof Error ? error.message : 'Unknown error occurred during task creation'
			};
		}
	}
};
