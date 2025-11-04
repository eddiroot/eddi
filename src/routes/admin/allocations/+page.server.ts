import { userTypeEnum } from '$lib/enums.js';
import {
	createUserSubjectOfferingClass,
	deleteUserSubjectOfferingClass,
	getAllocationsBySchoolId,
	getSubjectOfferingClassesBySchoolId,
	getUsersBySchoolIdAndTypes
} from '$lib/server/db/service';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createAllocationSchema } from './schema.js';

export const load = async ({ locals }) => {
	const user = locals.security.isAuthenticated().isSchoolAdmin().getUser();

	const [allocations, users, subjectOfferingClasses] = await Promise.all([
		getAllocationsBySchoolId(user.schoolId),
		getUsersBySchoolIdAndTypes(user.schoolId, [userTypeEnum.student, userTypeEnum.teacher]),
		getSubjectOfferingClassesBySchoolId(user.schoolId)
	]);

	const createForm = await superValidate(zod4(createAllocationSchema));

	return {
		allocations,
		users,
		subjectOfferingClasses,
		createForm
	};
};

export const actions = {
	create: async ({ request, locals }) => {
		locals.security.isAuthenticated().isSchoolAdmin();

		const formData = await request.formData();
		const form = await superValidate(formData, zod4(createAllocationSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await createUserSubjectOfferingClass(
				form.data.userId,
				parseInt(form.data.subjectOfferingClassId, 10)
			);

			return { form, success: true };
		} catch (error) {
			console.error('Error creating allocation:', error);
			return fail(500, { form, error: 'Failed to create allocation' });
		}
	},

	delete: async ({ request, locals }) => {
		locals.security.isAuthenticated().isSchoolAdmin();

		const formData = await request.formData();
		const allocationId = parseInt(formData.get('id') as string, 10);

		if (!allocationId) {
			return fail(400, { error: 'Invalid allocation ID' });
		}

		try {
			await deleteUserSubjectOfferingClass(allocationId);
			return { success: true };
		} catch (error) {
			console.error('Error deleting allocation:', error);
			return fail(500, { error: 'Failed to delete allocation' });
		}
	}
};
