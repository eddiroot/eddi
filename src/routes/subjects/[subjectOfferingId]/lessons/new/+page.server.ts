import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema';
import { geminiCompletion } from '$lib/server/ai';
import { lessonCreationPrompt } from '$lib/server/ai/constants';
import { createLesson, getLessonTopicsBySubjectOfferingId } from '$lib/server/db/service';

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

		let lessonSchema;
		try {
			lessonSchema = await geminiCompletion('path/to/media/file', lessonCreationPrompt);
		} catch (error) {
			console.error('Error creating response:', error);
			return fail(500, { form });
		}

		// TODO: Validate the lesson schema against the expected structure
		// TODO: Save each lesson component as an LSB in the database
		console.log('Lesson schema from Gemini:', lessonSchema);

		throw redirect(303, `/subjects/${subjectOfferingIdInt}/lessons/${lesson.id}`);
	}
};
