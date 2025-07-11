import { createSubjectThread } from '$lib/server/db/service';
import { redirect } from '@sveltejs/kit';
import { superValidate, fail } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema';

export const load = async ({ locals: { security } }) => {
	security.isAuthenticated();

	return { form: await superValidate(zod(formSchema)) };
};

export const actions = {
	create: async ({ request, locals: { security }, params: { subjectOfferingId } }) => {
		const user = security.isAuthenticated().getUser();

		let subjectOfferingIdInt;
		try {
			subjectOfferingIdInt = parseInt(subjectOfferingId, 10);
		} catch {
			return fail(400, { message: 'Invalid subject ID' });
		}

		const form = await superValidate(request, zod(formSchema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		let newThread;
		try {
			newThread = await createSubjectThread(
				form.data.type,
				subjectOfferingIdInt,
				user.id,
				form.data.title,
				form.data.content
			);
		} catch (error) {
			console.error('Error creating thread:', error);
			return fail(500, { message: 'Failed to create discussion post' });
		}

		throw redirect(303, `/subjects/${subjectOfferingIdInt}/discussion/${newThread.id}`);
	}
};
