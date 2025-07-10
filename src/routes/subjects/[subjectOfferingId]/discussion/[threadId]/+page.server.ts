import {
	getSubjectThreadById,
	getSubjectThreadResponsesById,
	createSubjectThreadResponse
} from '$lib/server/db/service';
import { superValidate, fail } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema.js';
import { getNestedResponses } from './utils.js';

export const load = async ({ locals: { security }, params: { threadId } }) => {
	security.isAuthenticated();

	let threadIdInt;
	try {
		threadIdInt = parseInt(threadId, 10);
	} catch {
		return { thread: null, responses: [], form: null };
	}

	const thread = await getSubjectThreadById(threadIdInt);
	const responses = await getSubjectThreadResponsesById(threadIdInt);
	const nestedResponses = getNestedResponses(responses);
	const form = await superValidate(zod(formSchema), {
		defaults: {
			type:
				thread?.thread?.type === 'question' || thread?.thread?.type === 'qanda'
					? 'answer'
					: 'comment',
			content: ''
		}
	});

	return { thread, nestedResponses, form };
};

export const actions = {
	addResponse: async ({ request, locals: { security }, params: { threadId } }) => {
		const user = security.isAuthenticated().getUser();

		let threadIdInt;
		try {
			threadIdInt = parseInt(threadId, 10);
		} catch {
			return fail(400, { message: 'Invalid thread ID' });
		}

		const form = await superValidate(request, zod(formSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await createSubjectThreadResponse(
				form.data.type,
				threadIdInt,
				user.id,
				form.data.content,
				form.data.parentResponseId
			);
		} catch (error) {
			console.error('Error creating response:', error);
			return fail(500, { form });
		}

		return { form };
	}
};
