import { error, fail } from '@sveltejs/kit';
import { superValidate, withFiles } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { getClassById } from '$lib/server/db/service';
import { uploadBufferHelper, generateUniqueFileName } from '$lib/server/obj';
import { db } from '$lib/server/db';
import { subjectOfferingClassResource } from '$lib/server/db/schema';

const uploadSchema = z.object({
    file: z.instanceof(File).refine((file) => file.size > 0, 'Please select a file to upload'),
    description: z.string().optional()
});

export const load = async ({ locals: { security }, params: { subjectOfferingId, subjectOfferingClassId } }) => {
    security.isAuthenticated();

    // Validate parameters
    const classId = parseInt(subjectOfferingClassId, 10);
    if (isNaN(classId)) {
        throw error(400, 'Invalid class ID');
    }

    // Get class details to verify it exists and belongs to the subject offering
    const classDetails = await getClassById(classId);
    if (!classDetails) {
        throw error(404, 'Class not found');
    }

    // Verify the class belongs to the subject offering
    if (classDetails.subjectOfferingClass.subOfferingId !== parseInt(subjectOfferingId, 10)) {
        throw error(400, 'Class does not belong to this subject offering');
    }

    const form = await superValidate(zod(uploadSchema));

    return {
        form,
        classDetails
    };
};

export const actions = {
    default: async ({ request, locals: { security }, params: { subjectOfferingId, subjectOfferingClassId } }) => {
        const user = security.isAuthenticated().getUser();

        const formData = await request.formData();
        const form = await superValidate(formData, zod(uploadSchema));

        if (!form.valid) {
            return fail(400, { form });
        }

        const classId = parseInt(subjectOfferingClassId, 10);
        if (isNaN(classId)) {
            return fail(400, { form, message: 'Invalid class ID' });
        }

        try {
            // Get class details to verify it exists
            const classDetails = await getClassById(classId);
            if (!classDetails) {
                return fail(404, { form, message: 'Class not found' });
            }

            // Verify the class belongs to the subject offering
            if (classDetails.subjectOfferingClass.subOfferingId !== parseInt(subjectOfferingId, 10)) {
                return fail(400, { form, message: 'Class does not belong to this subject offering' });
            }

            const file = form.data.file;

            // Convert file to buffer
            const buffer = Buffer.from(await file.arrayBuffer());

            // Generate unique filename
            const uniqueFileName = generateUniqueFileName(file.name);

            // Upload file to storage in school bucket
            await uploadBufferHelper(buffer, 'schools', `${user.schoolId}/${uniqueFileName}`, file.type);

            // Save resource metadata to database
            await db.insert(subjectOfferingClassResource).values({
                originalFileName: file.name,
                storedFileName: uniqueFileName,
                fileSize: file.size,
                subjectOfferingClassId: classId,
                authorId: user.id
            });

            return withFiles({ form });
        } catch (error) {
            console.error('Error uploading resource:', error);
            return fail(500, { form, message: 'Failed to upload resource' });
        }
    }
};
