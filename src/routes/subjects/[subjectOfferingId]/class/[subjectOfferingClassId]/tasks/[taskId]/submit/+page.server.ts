import {
	getTaskById,
	getTaskBlocksByTaskId,
	getSubjectOfferingClassTaskByTaskId,
	getRubricWithRowsAndCells,
	createClassTaskResponse,
	getClassTaskResponse,
	updateClassTaskResponseComment,
	deleteResourceFromClassTaskResponse,
	createResource,
	addResourcesToClassTaskResponse,
	getClassTaskResponseResources
} from '$lib/server/db/service';
import { redirect, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod/v4';
import { taskStatusEnum } from '$lib/enums';
import { inferResourceTypeFromFileName } from '$lib/schemas/resourceSchema';
import { uploadBufferHelper, generateUniqueFileName, deleteFile } from '$lib/server/obj';

// Simplified schema for the task submission
const submitSchema = z.object({
	comment: z.string().optional(),
	files: z.array(z.instanceof(File)).optional()
});

export const load = async ({
	locals: { security },
	params: { taskId, subjectOfferingId, subjectOfferingClassId }
}) => {
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
		throw redirect(
			302,
			`/subjects/${subjectOfferingId}/class/${subjectOfferingClassId}/tasks/${taskId}`
		);
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
	const form = await superValidate(zod4(submitSchema));

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
		// Get files from the FormData first before superValidate consumes it
		const formData = await request.formData();
		const uploadedFiles = formData.getAll('files') as File[];
		const comment = formData.get('comment') as string;

		console.log('Server received files:', uploadedFiles.length);
		console.log('Server received comment:', comment);
		console.log('Raw comment value:', formData.get('comment'));
		console.log('All form keys:', Array.from(formData.keys()));

		// Create a new FormData with just the comment for validation
		const validationData = new FormData();
		validationData.set('comment', comment || '');

		// Create a new Request for validation
		const validationRequest = new Request(request.url, {
			method: 'POST',
			body: validationData
		});

		const form = await superValidate(validationRequest, zod4(submitSchema));

		if (!form.valid) {
			console.log('Form validation failed:', form.errors);
			return fail(400, { form });
		}

		const { subjectOfferingId, subjectOfferingClassId, taskId } = params;
		const userId = locals.user?.id;
		const userSchoolId = locals.user?.schoolId;

		if (!userId || !userSchoolId) {
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

			// Check if user already has a submission
			let response = await getClassTaskResponse(subjectOfferingClassTask.id, userId);

			if (response) {
				// Update existing submission - only update comment, don't delete existing files
				console.log('Updating existing submission:', response.id);

				// Update the comment on the existing response
				await updateClassTaskResponseComment(response.id, comment || null);

				console.log('Updated existing response with new comment');
			} else {
				// Create new class task response
				console.log('Creating new submission');
				response = await createClassTaskResponse(
					subjectOfferingClassTask.id,
					userId,
					comment || undefined
				);
			}

			// Handle file uploads if any
			const validFiles = uploadedFiles.filter((file) => file instanceof File && file.size > 0);

			if (validFiles.length > 0) {
				const resourceIds: number[] = [];

				for (const file of validFiles) {
					// Generate unique filename and upload to S3
					const uniqueFileName = generateUniqueFileName(file.name);
					const objectKey = `${userSchoolId}/tasks/${subjectOfferingClassTask.id}/${uniqueFileName}`;
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
			throw redirect(303, `/subjects/${subjectOfferingId}/class/${subjectOfferingClassId}/tasks`);
		} catch (error) {
			// Check if it's a redirect (which is expected)
			if (error && typeof error === 'object' && 'status' in error && error.status === 303) {
				throw error; // Re-throw redirects
			}
			console.error('Error submitting task:', error);
			return fail(500, { form });
		}
	},

	removeFile: async ({ request, params, locals }) => {
		const formData = await request.formData();
		const resourceId = parseInt(formData.get('resourceId') as string);

		const { subjectOfferingClassId, taskId } = params;
		const userId = locals.user?.id;

		if (!userId || !resourceId) {
			return fail(400, { error: 'Missing required data' });
		}

		try {
			// Check if task exists and is available for the class
			const subjectOfferingClassTask = await getSubjectOfferingClassTaskByTaskId(
				parseInt(taskId),
				parseInt(subjectOfferingClassId)
			);

			if (!subjectOfferingClassTask) {
				return fail(404, { error: 'Task not found' });
			}

			// Get the user's response
			const response = await getClassTaskResponse(subjectOfferingClassTask.id, userId);

			if (!response) {
				return fail(404, { error: 'Submission not found' });
			}

			// Remove the specific resource
			const deletedResource = await deleteResourceFromClassTaskResponse(
				response.id,
				resourceId,
				userId
			);

			// Delete file from S3
			try {
				await deleteFile(deletedResource.bucketName, deletedResource.objectKey);
				console.log('Deleted file from S3:', deletedResource.fileName);
			} catch (error) {
				console.error('Error deleting file from S3:', deletedResource.fileName, error);
				// Continue even if S3 deletion fails
			}

			return { success: true };
		} catch (error) {
			console.error('Error removing file:', error);
			return fail(500, { error: 'Failed to remove file' });
		}
	}
};
