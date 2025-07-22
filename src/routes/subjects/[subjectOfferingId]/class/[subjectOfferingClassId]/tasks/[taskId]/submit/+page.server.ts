import { 
    getTaskById, 
    getTaskBlocksByTaskId, 
    getSubjectOfferingClassTaskByTaskId,
    getRubricWithRowsAndCells,
    createClassTaskResponse,
    getClassTaskResponse,
    createResource,
    addResourcesToClassTaskResponse,
    getClassTaskResponseResources
} from '$lib/server/db/service';
import { redirect, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { taskStatusEnum } from '$lib/server/db/schema';
import { inferResourceTypeFromFileName } from '$lib/server/schema/resourceSchema';
import { uploadBufferHelper, generateUniqueFileName } from '$lib/server/obj';

// Simplified schema for the task submission
const submitSchema = z.object({
    comment: z.string().optional(),
    files: z.array(z.instanceof(File)).optional()
});

export const load = async ({ locals: { security }, params: { taskId, subjectOfferingId, subjectOfferingClassId } }) => {
    const user = security.isAuthenticated().getUser();

    let taskIdInt;
    try {
        taskIdInt = parseInt(taskId, 10);
    } catch {
        throw redirect(302, '/dashboard');
    }

    const classIdInt = parseInt(subjectOfferingClassId, 10);
    if (isNaN(classIdInt)) {
        throw redirect(302, '/dashboard');
    }

    const task = await getTaskById(taskIdInt);
    if (!task) throw redirect(302, '/dashboard');

    // Get the class task to access status
    const classTask = await getSubjectOfferingClassTaskByTaskId(taskIdInt, classIdInt);
    if (!classTask) throw redirect(302, '/dashboard');

    // Check if task is published (students can only submit to published tasks)
    if (user.type === 'student' && classTask.status !== taskStatusEnum.published) {
        throw redirect(302, `/subjects/${subjectOfferingId}/class/${subjectOfferingClassId}/tasks/${taskId}`);
    }

    const blocks = await getTaskBlocksByTaskId(taskIdInt);
    
    // Get rubric if it exists
    let rubric = null;
    if (task.rubricId || classTask.rubricId) {
        const rubricId = classTask.rubricId || task.rubricId;
        rubric = await getRubricWithRowsAndCells(rubricId!);
    }

    // Check if user already has a submission
    const existingSubmission = await getClassTaskResponse(classTask.id, user.id);
    let existingResources: Array<{
        responseResource: unknown;
        resource: unknown;
    }> = [];
    if (existingSubmission) {
        existingResources = await getClassTaskResponseResources(existingSubmission.id);
    }

    // Create form
    const form = await superValidate(zod(submitSchema));

    return { 
        task, 
        classTask, 
        blocks, 
        rubric, 
        subjectOfferingId, 
        subjectOfferingClassId, 
        user, 
        form,
        existingSubmission,
        existingResources
    };
};

export const actions = {
    submit: async ({ request, params, locals }) => {
        const form = await superValidate(request, zod(submitSchema));
        
        if (!form.valid) {
            return fail(400, { form });
        }

        const { subjectOfferingId, subjectOfferingClassId, taskId } = params;
        const userId = locals.user?.id;

        if (!userId) {
            return fail(401, { form });
        }

        try {
            // Check if task exists and is available for the class
            const subjectOfferingClassTask = await getSubjectOfferingClassTaskByTaskId(
                parseInt(taskId),
                parseInt(subjectOfferingClassId)
            );

            if (!subjectOfferingClassTask) {
                return fail(404, { form });
            }

            // Create the class task response
            const response = await createClassTaskResponse(
                subjectOfferingClassTask.id,
                userId,
                form.data.comment as string | undefined
            );

            // Handle file uploads if any
            const files = form.data.files || [];
            const validFiles = Array.isArray(files) ? files.filter(
                (file: unknown): file is File => file instanceof File && file.size > 0
            ) : [];

            if (validFiles.length > 0) {
                const resourceIds: number[] = [];

                for (const file of validFiles) {
                    // Generate unique filename and upload to S3
                    const objectKey = generateUniqueFileName(file.name);
                    const buffer = Buffer.from(await file.arrayBuffer());
                    await uploadBufferHelper(buffer, 'schools', objectKey, file.type);

                    // Create resource entry in database
                    const resource = await createResource(
                        file.name, // name
                        file.name, // fileName
                        objectKey, // objectKey
                        file.type, // contentType
                        file.size, // fileSize
                        inferResourceTypeFromFileName(file.name), // resourceType
                        userId // uploadedBy
                    );

                    resourceIds.push(resource.id);
                }

                // Link all resources to the task response
                if (resourceIds.length > 0) {
                    await addResourcesToClassTaskResponse(response.id, resourceIds, userId);
                }
            }

            // Redirect to a success page or task list
            redirect(303, `/subjects/${subjectOfferingId}/class/${subjectOfferingClassId}/tasks`);
        } catch (error) {
            console.error('Error submitting task:', error);
            return fail(500, { form });
        }
    }
};