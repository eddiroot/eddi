import { fail, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { schoolFormSchema, logoUploadSchema } from './schema';
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
			emailSuffix: school?.emailSuffix || ''
		},
		zod(schoolFormSchema)
	);

	return { form, school };
};

export const actions = {
	updateDetails: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().isSchoolAdmin().getUser();

		const formData = await request.formData();
		const form = await superValidate(formData, zod(schoolFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await updateSchool(user.schoolId, form.data.name, form.data.emailSuffix);
			return { form };
		} catch (error) {
			console.error('Error updating school:', error);
			return fail(500, { form, message: 'Failed to update school details' });
		}
	},
	uploadLogo: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().isSchoolAdmin().getUser();

		const formData = await request.formData();
		const logoFile = formData.get('logo') as File;

		if (!logoFile || logoFile.size === 0) {
			return fail(400, { message: 'No logo file provided' });
		}

		// Validate file
		const logoForm = await superValidate({ logo: logoFile }, zod(logoUploadSchema));
		if (!logoForm.valid) {
			return fail(400, {
				message: 'Invalid logo file. Please upload a JPEG, PNG, or WebP image smaller than 5MB.'
			});
		}

		try {
			// Get current school to check for existing logo
			const school = await getSchoolById(user.schoolId);
			if (!school) {
				return fail(404, { message: 'School not found' });
			}

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

			// Upload new logo
			const buffer = Buffer.from(await logoFile.arrayBuffer());
			const uniqueFileName = generateUniqueFileName(logoFile.name);
			const logoUrl = await uploadBufferHelper(buffer, 'logos', uniqueFileName, logoFile.type);

			// Update school with new logo URL
			await updateSchool(user.schoolId, school.name, school.emailSuffix, logoUrl);

			return { success: true, logoUrl };
		} catch (error) {
			console.error('Error uploading logo:', error);
			return fail(500, { message: 'Failed to upload logo' });
		}
	}
};
