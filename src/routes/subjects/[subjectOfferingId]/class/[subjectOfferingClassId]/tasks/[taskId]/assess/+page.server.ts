import {
	getTaskById,
	getSubjectOfferingClassTaskByTaskId,
	getClassTaskResponse,
	getClassTaskResponseResources,
	getClassTaskResponsesWithStudents,
	updateClassTaskResponseComment,
	getRubricWithRowsAndCells
} from '$lib/server/db/service';
import { getPresignedUrl } from '$lib/server/obj';
import { redirect, fail } from '@sveltejs/kit';
import { userTypeEnum } from '$lib/enums';
import type { ClassTaskResponse, Resource } from '$lib/server/db/schema';

interface StudentSubmission extends ClassTaskResponse {
	student: {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
	};
}

export const load = async ({
	locals: { security },
	params: { taskId, subjectOfferingId, subjectOfferingClassId },
	url
}) => {
	const user = security.isAuthenticated().getUser();

	// Only teachers and above can access assessment page
	if (user.type === userTypeEnum.student) {
		throw redirect(302, `/subjects/${subjectOfferingId}/class/${subjectOfferingClassId}/tasks/${taskId}`);
	}

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

	// Get rubric if it exists
	let rubric = null;
	if (task.rubricId || classTask.rubricId) {
		const rubricId = classTask.rubricId || task.rubricId;
		rubric = await getRubricWithRowsAndCells(rubricId!);
	}

	// Get all student submissions for this task
	const submissions = await getClassTaskResponsesWithStudents(classTask.id);

	// Get specific student submission if studentId is provided in URL
	const selectedStudentId = url.searchParams.get('studentId');
	let selectedSubmission: StudentSubmission | null = null;
	let selectedResources: Array<{
		id: number;
		fileName: string;
		contentType: string;
		downloadUrl?: string;
		resourceType: string;
		fileSize: number;
	}> = [];

	if (selectedStudentId && submissions.find(s => s.authorId === selectedStudentId)) {
		selectedSubmission = submissions.find(s => s.authorId === selectedStudentId) || null;
		if (selectedSubmission) {
			const resources = await getClassTaskResponseResources(selectedSubmission.id);
			// Generate presigned URLs for resources
			selectedResources = await Promise.all(
				resources.map(async (resourceData) => {
					const resource = resourceData.resource as Resource;
					try {
						const schoolId = user.schoolId.toString();
						// Strip schoolId prefix if it exists to avoid double-prefixing
						const objectName = resource.objectKey.startsWith(schoolId) 
							? resource.objectKey.substring(schoolId.length + 1)
							: resource.objectKey;
						
						const downloadUrl = await getPresignedUrl(
							schoolId,
							objectName,
							7 * 24 * 60 * 60 // 7 days expiry
						);
						return {
							id: resource.id,
							fileName: resource.fileName,
							contentType: resource.contentType,
							downloadUrl,
							resourceType: resource.resourceType,
							fileSize: resource.fileSize
						};
					} catch (error) {
						console.error(`Failed to generate URL for resource ${resource.id}:`, error);
						console.error(`Resource objectKey: ${resource.objectKey}`);
						return {
							id: resource.id,
							fileName: resource.fileName,
							contentType: resource.contentType,
							resourceType: resource.resourceType,
							fileSize: resource.fileSize
						};
					}
				})
			);
		}
	}

	return {
		task,
		classTask,
		rubric,
		submissions,
		selectedSubmission,
		selectedResources,
		selectedStudentId,
		subjectOfferingId,
		subjectOfferingClassId,
		user
	};
};

export const actions = {
	updateFeedback: async ({ request, params, locals }) => {
		const user = locals.security.isAuthenticated().getUser();

		if (user.type === userTypeEnum.student) {
			return fail(403, { message: 'Access denied' });
		}

		const formData = await request.formData();
		const feedback = formData.get('feedback') as string;
		const studentId = formData.get('studentId') as string;

		if (!feedback || !studentId) {
			return fail(400, { message: 'Feedback and student ID are required' });
		}

		const { taskId, subjectOfferingClassId } = params;
		
		try {
			const taskIdInt = parseInt(taskId, 10);
			const classIdInt = parseInt(subjectOfferingClassId, 10);

			// Get the class task
			const classTask = await getSubjectOfferingClassTaskByTaskId(taskIdInt, classIdInt);
			if (!classTask) {
				return fail(404, { message: 'Task not found' });
			}

			// Get the student's submission
			const studentSubmission = await getClassTaskResponse(classTask.id, studentId);
			if (!studentSubmission) {
				return fail(404, { message: 'Student submission not found' });
			}

			// Update the submission with feedback
			await updateClassTaskResponseComment(studentSubmission.id, feedback);

			return { success: true };
		} catch (error) {
			console.error('Error updating feedback:', error);
			return fail(500, { message: 'Failed to update feedback' });
		}
	}
};


