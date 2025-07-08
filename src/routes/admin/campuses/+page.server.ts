import { getCampusesBySchoolId, updateCampus, archiveCampus } from '$lib/server/db/service';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';

const editCampusSchema = z.object({
	campusId: z.coerce.number(),
	name: z.string().min(1, 'Campus name is required'),
	address: z.string().min(1, 'Address is required'),
	description: z.string().optional()
});

const archiveCampusSchema = z.object({
	campusId: z.coerce.number()
});

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();
	const campuses = await getCampusesBySchoolId(user.schoolId);

	return { campuses };
};

export const actions = {
	editCampus: async ({ request, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();
		const formData = await request.formData();

		const result = editCampusSchema.safeParse(Object.fromEntries(formData));

		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors
			});
		}

		try {
			await updateCampus(
				result.data.campusId,
				result.data.name,
				result.data.address,
				result.data.description
			);

			return { success: true, message: 'Campus updated successfully' };
		} catch (error) {
			console.error('Error updating campus:', error);
			return fail(500, {
				error: 'Failed to update campus'
			});
		}
	},

	archiveCampus: async ({ request, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();
		const formData = await request.formData();

		const result = archiveCampusSchema.safeParse(Object.fromEntries(formData));

		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors
			});
		}

		try {
			await archiveCampus(result.data.campusId);

			return { success: true, message: 'Campus archived successfully' };
		} catch (error) {
			console.error('Error archiving campus:', error);
			return fail(500, {
				error: 'Failed to archive campus'
			});
		}
	}
};
