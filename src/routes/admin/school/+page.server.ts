import { error } from '@sveltejs/kit';
import { superValidate, fail, withFiles } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { schoolFormSchema } from './schema';
import { getSchoolById, updateSchool } from '$lib/server/db/service';
import { uploadBufferHelper, deleteFile, generateUniqueFileName } from '$lib/server/obj';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();
	const school = await getSchoolById(user.schoolId);

	if (!school) {
		throw error(404, 'School not found');
	}

	const form = await superValidate(
		{
			name: school?.name || '',
		},
		zod(schoolFormSchema)
	);

	return { form, school };
};

export const actions = {
	default: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().isSchoolAdmin().getUser();

		const formData = await request.formData();
		const form = await superValidate(formData, zod(schoolFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			// Get current school to check for existing logo
			const school = await getSchoolById(user.schoolId);
			if (!school) {
				return fail(404, { form, message: 'School not found' });
			}

			let logoUrl = school.logoUrl || undefined;

			// Handle logo upload if provided
			if (form.data.logo && form.data.logo.size > 0) {
				// Delete existing logo if it exists
				if (school.logoUrl) {
					try {
						// Extract the object name from the URL
						const urlParts = school.logoUrl.split('/');
						const objectName = urlParts.slice(-1)[0];
						await deleteFile('logos', objectName);
					} catch (deleteError) {
						console.warn('Could not delete existing logo:', deleteError);
					}
				}

				const buffer = Buffer.from(await form.data.logo.arrayBuffer());
				const uniqueFileName = generateUniqueFileName(form.data.logo.name);
				logoUrl = await uploadBufferHelper(buffer, 'logos', uniqueFileName, form.data.logo.type);
			}

			// Update school with new details and logo URL
			await updateSchool(user.schoolId, form.data.name, logoUrl);

			return withFiles({ form });
		} catch (error) {
			console.error('Error updating school:', error);
			return fail(500, { form, message: 'Failed to update school details' });
		}
	}
};
