import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema';
import { geminiCompletion } from '$lib/server/ai';
import {
	taskSchema as taskGenerationSchema,
	taskCreationPrompts
} from '$lib/server/schema/taskSchema';
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
import { taskTypeEnum } from '$lib/enums';

export const load = async ({ locals: { security }, params: { subjectOfferingId } }) => {
	security.isAuthenticated();

	let subjectOfferingIdInt;
	try {
		subjectOfferingIdInt = parseInt(subjectOfferingId, 10);
	} catch {
		throw new Error('Invalid subject offering ID or class ID');
	}

	const [form, taskTopics, learningAreaWithContents] = await Promise.all([
		superValidate(zod4(formSchema)),
		getTopics(subjectOfferingIdInt),
		getCurriculumLearningAreaWithStandards(subjectOfferingIdInt)
	]);

	return { form, taskTopics, learningAreaWithContents };
};

// Helper function to validate and create blocks from task schema
async function createBlocksFromSchema(taskSchema: string, taskId: number) {
	try {
		const blocks = JSON.parse(taskSchema)?.blocks || [];

		if (!Array.isArray(blocks)) {
			throw new Error('Invalid schema: blocks property must be an array');
		}

		await Promise.all(
			blocks.map(async (block) => {
				try {
					await createTaskBlock(taskId, block.type, block.config, taskId);
				} catch (error) {
					console.error(`Error creating block:`, block, error);
				}
			})
		);
	} catch (error) {
		console.error('Error parsing or processing task schema:', error);
		throw new Error(
			`Failed to process task schema: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
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

			const formData = await request.formData();
			const form = await superValidate(formData, zod4(formSchema));

			const selectedLearningAreaContentIds = form.data.selectedLearningAreaContentIds || [];

			let learningAreaContentData: CurriculumStandardWithElaborations[] = [];
			if (selectedLearningAreaContentIds.length > 0) {
				learningAreaContentData = await getLearningAreaStandardWithElaborationsByIds(
					selectedLearningAreaContentIds
				);
			}

			let courseMapItemId = form.data.taskTopicId;

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
						const aiResponse = await geminiCompletion(
							enhancedPrompt,
							tempFilePath,
							taskGenerationSchema
						);
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
					taskSchema = await geminiCompletion(enhancedPrompt, undefined, taskGenerationSchema);
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
			// If it's a redirect, re-throw it so it can work properly
			if (error && typeof error === 'object' && 'status' in error && error.status === 303) {
				throw error;
			}

			console.error('Task creation error:', error);

			// Return error response for actual errors
			return {
				status: 500,
				error:
					error instanceof Error ? error.message : 'Unknown error occurred during task creation'
			};
		}
	}
};
