import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { formSchema, topicFormSchema } from './schema';
import { geminiCompletion } from '$lib/server/ai';
import { lessonCreationPrompt } from '$lib/server/ai/constants';
import {
	createLesson,
	getLessonTopicsBySubjectOfferingId,
	createLessonTopic
} from '$lib/server/db/service';
import { promises as fsPromises } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export const load = async ({ locals: { security }, params: { subjectOfferingId } }) => {
	security.isAuthenticated();

	let subjectOfferingIdInt;
	try {
		subjectOfferingIdInt = parseInt(subjectOfferingId, 10);
	} catch {
		throw new Error('Invalid subject offering ID');
	}

	const [form, topicForm, lessonTopics] = await Promise.all([
		superValidate(zod(formSchema)),
		superValidate(zod(topicFormSchema)),
		getLessonTopicsBySubjectOfferingId(subjectOfferingIdInt)
	]);

	return { form, topicForm, lessonTopics };
};

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

		// Log all form data entries
		console.log('=== FORM DATA DEBUG ===');
		for (const [key, value] of formData.entries()) {
			if (value instanceof File) {
				console.log(`${key}: File - name: ${value.name}, size: ${value.size}, type: ${value.type}`);
			} else {
				console.log(`${key}: ${value}`);
			}
		}
		console.log('=== END FORM DATA DEBUG ===');

		// Validate the form using formData instead of request
		const form = await superValidate(formData, zod(formSchema));
		if (!form.valid) {
			console.log('Form validation failed:', form.errors);
			return fail(400, { form });
		}

		const lesson = await createLesson(
			form.data.title,
			form.data.description,
			'draft',
			form.data.subjectWeek,
			form.data.lessonTopicId,
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
			// Handle multiple AI files
			if (validFiles.length > 0 && form.data.creationMethod === 'ai') {
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
					lessonSchema += await geminiCompletion(tempFilePath, lessonCreationPrompt);
				}
			} else if (form.data.creationMethod === 'ai') {
				// AI mode but no files
				console.log('AI mode with no files - sending text-only prompt to Gemini');
				lessonSchema = await geminiCompletion(undefined, lessonCreationPrompt);
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

		// TODO: Validate the lesson schema against the expected structure
		// TODO: Save each lesson component as an LSB in the database
		if (lessonSchema) {
			console.log('Lesson schema from Gemini:', lessonSchema);
		} else {
			console.log('No lesson schema generated (manual mode or failed AI generation)');
		}

		throw redirect(303, `/subjects/${subjectOfferingIdInt}/lessons/${lesson.id}`);
	},

	createTopic: async ({ request, locals: { security }, params: { subjectOfferingId } }) => {
		security.isAuthenticated();
		const id = parseInt(subjectOfferingId, 10);
		const form = await superValidate(request, zod(topicFormSchema));
		if (!form.valid) return fail(400, { form });
		const topic = await createLessonTopic(id, form.data.name);
		return { form, topic };
	}
};
