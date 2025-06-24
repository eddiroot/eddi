import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema';
import { geminiCompletion } from '$lib/server/ai';
import { lessonCreationPrompt } from '$lib/server/ai/constants';
import { createLesson, getLessonTopicsBySubjectOfferingId } from '$lib/server/db/service';
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

	const [form, lessonTopics] = await Promise.all([
		superValidate(zod(formSchema)),
		getLessonTopicsBySubjectOfferingId(subjectOfferingIdInt)
	]);

	return { form, lessonTopics };
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

		const form = await superValidate(request, zod(formSchema));
		if (!form.valid) {
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
		let tempFilePath: string | undefined;

		if (form.data.file && form.data.file.size > 0) {
			try {
				// Use system temp directory
				const timestamp = Date.now();
				const fileName = `${timestamp}-${form.data.file.name}`;
				tempFilePath = join(tmpdir(), fileName);

				// Convert the file to a buffer and save temporarily
				const arrayBuffer = await form.data.file.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);
				await fsPromises.writeFile(tempFilePath, buffer);

				console.log(`Temp file saved to ${tempFilePath}`);
			} catch (error) {
				console.error('Error saving temp file:', error);
				return fail(500, { form, message: 'Error saving temp file' });
			}
		}

		let lessonSchema;
		try {
			if (form.data.creationMethod === 'ai') {
				if (tempFilePath) {
					lessonSchema = await geminiCompletion(tempFilePath, lessonCreationPrompt);
				} else {
					lessonSchema = await geminiCompletion(undefined, lessonCreationPrompt);
				}
			}
		} catch (error) {
			console.error('Error creating response:', error);
			return fail(500, { form });
		} finally {
			if (tempFilePath) {
				try {
					await fsPromises.unlink(tempFilePath);
					console.log(`Temp file ${tempFilePath} deleted`);
				} catch (error) {
					console.error('Error deleting temp file:', error);
				}
			}
		}

		// TODO: Validate the lesson schema against the expected structure
		// TODO: Save each lesson component as an LSB in the databas
		console.log('Lesson schema from Gemini:', lessonSchema);

		throw redirect(303, `/subjects/${subjectOfferingIdInt}/lessons/${lesson.id}`);
	}
};
