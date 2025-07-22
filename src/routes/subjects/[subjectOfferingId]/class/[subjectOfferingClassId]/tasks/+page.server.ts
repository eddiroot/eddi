import type { Task } from '$lib/server/db/schema';
import {
	getTasksBySubjectOfferingClassId,
	getResourcesBySubjectOfferingClassId,
	getTopics,
	createResource,
	addResourceToSubjectOfferingClass,
	removeResourceFromSubjectOfferingClass
} from '$lib/server/db/service';
import { getPresignedUrl } from '$lib/server/obj';
import { error, fail } from '@sveltejs/kit';
import { superValidate, withFiles } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { uploadBufferHelper, generateUniqueFileName } from '$lib/server/obj';

interface ResourceWithUrl {
	id: number;
	title: string | null;
	description: string | null;
	fileName: string;
	objectKey: string;
	bucketName: string;
	contentType: string;
	fileSize: number;
	resourceType: string;
	uploadedBy: string;
	isArchived: boolean;
	createdAt: Date;
	updatedAt: Date;
	coursemapItemId: number | null;
	author: {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
	};
	downloadUrl: string | null;
}

const uploadSchema = z.object({
	file: z.instanceof(File).refine((file) => file.size > 0, 'Please select a file to upload'),
	title: z.string().optional(),
	description: z.string().optional(),
	topicId: z.number().min(1, 'Please select a topic')
});

export const load = async ({
	locals: { security },
	params: { subjectOfferingId, subjectOfferingClassId },
	setHeaders
}) => {
	const user = security.isAuthenticated().getUser();

	// Disable all caching to ensure fresh data
	setHeaders({
		'cache-control': 'no-cache, no-store, must-revalidate',
		pragma: 'no-cache',
		expires: '0'
	});

	let subjectOfferingClassIdInt;
	try {
		subjectOfferingClassIdInt = parseInt(subjectOfferingClassId, 10);
	} catch {
		return { subject: null };
	}

	const subjectOfferingIdInt = parseInt(subjectOfferingId, 10);
	if (isNaN(subjectOfferingIdInt)) {
		throw error(400, 'Invalid subject offering ID');
	}

	const tasks = await getTasksBySubjectOfferingClassId(user.id, subjectOfferingClassIdInt);
	const resources = await getResourcesBySubjectOfferingClassId(subjectOfferingClassIdInt);
	const topics = await getTopics(subjectOfferingIdInt);

	// Generate presigned URLs for each resource
	const resourcesWithUrls = await Promise.all(
		resources.map(async (row) => {
			try {
				const downloadUrl = await getPresignedUrl(
					user.schoolId.toString(),
					row.resource.objectKey,
					7 * 24 * 60 * 60 // 7 days expiry
				);
				return {
					id: row.resource.id,
					title: row.resourceRelation.title,
					description: row.resourceRelation.description,
					fileName: row.resource.fileName,
					objectKey: row.resource.objectKey,
					bucketName: row.resource.bucketName,
					contentType: row.resource.contentType,
					fileSize: row.resource.fileSize,
					resourceType: row.resource.resourceType,
					uploadedBy: row.resource.uploadedBy,
					isArchived: row.resource.isArchived,
					createdAt: row.resource.createdAt,
					updatedAt: row.resource.updatedAt,
					coursemapItemId: row.resourceRelation.coursemapItemId,
					author: {
						id: row.author.id,
						firstName: row.author.firstName,
						lastName: row.author.lastName,
						email: row.author.email
					},
					downloadUrl
				};
			} catch (error) {
				console.error(`Failed to generate URL for resource ${row.resource.id}:`, error);
				return {
					id: row.resource.id,
					title: row.resourceRelation.title,
					description: row.resourceRelation.description,
					fileName: row.resource.fileName,
					objectKey: row.resource.objectKey,
					bucketName: row.resource.bucketName,
					contentType: row.resource.contentType,
					fileSize: row.resource.fileSize,
					resourceType: row.resource.resourceType,
					uploadedBy: row.resource.uploadedBy,
					isArchived: row.resource.isArchived,
					createdAt: row.resource.createdAt,
					updatedAt: row.resource.updatedAt,
					coursemapItemId: row.resourceRelation.coursemapItemId,
					author: {
						id: row.author.id,
						firstName: row.author.firstName,
						lastName: row.author.lastName,
						email: row.author.email
					},
					downloadUrl: null
				};
			}
		})
	);

	const form = await superValidate(zod(uploadSchema));

	interface Topic {
		id: number;
		name: string;
	}

	interface TaskWithStatus {
		task: Task;
		status: string; // taskStatusEnum
	}

	const topicsWithTasks = tasks.reduce(
		(acc, task) => {
			const topicId = task.courseMapItem.id;
			let topicEntry = acc.find((item) => item.topic.id === topicId);
			if (!topicEntry) {
				// Create a simple topic object with id and name (topic)
				const topic: Topic = {
					id: task.courseMapItem.id,
					name: task.courseMapItem.topic
				};
				topicEntry = { topic: topic, tasks: [], resources: [] };
				acc.push(topicEntry);
			}
			topicEntry.tasks.push({
				task: task.task,
				status:
					task.subjectOfferingClassTask.status.charAt(0).toUpperCase() +
					task.subjectOfferingClassTask.status.slice(1)
			});
			return acc;
		},
		[] as Array<{ topic: Topic; tasks: Array<TaskWithStatus>; resources: Array<ResourceWithUrl> }>
	);

	// Add resources to their respective topics
	resourcesWithUrls.forEach((resource) => {
		if (resource.coursemapItemId) {
			const topicEntry = topicsWithTasks.find((item) => item.topic.id === resource.coursemapItemId);
			if (topicEntry) {
				topicEntry.resources.push(resource);
			}
		}
	});

	// Check for active presentations across all tasks in this class
	const activePresentations = new Map<number, {
		taskId: number;
		taskTitle: string;
		teacherId?: string;
		startTime?: Date;
	}>();
	for (const topicWithTasks of topicsWithTasks) {
		for (const taskWithStatus of topicWithTasks.tasks) {
			try {
				const presentationCheckResponse = await fetch(`${process.env.ORIGIN || 'http://localhost:5173'}/api/presentations?taskId=${taskWithStatus.task.id}`);
				if (presentationCheckResponse.ok) {
					const presentationStatus = await presentationCheckResponse.json();
					if (presentationStatus.isActive) {
						activePresentations.set(taskWithStatus.task.id, {
							taskId: taskWithStatus.task.id,
							taskTitle: taskWithStatus.task.title,
							teacherId: presentationStatus.presentation?.teacherId,
							startTime: presentationStatus.presentation?.startTime
						});
					}
				}
			} catch (error) {
				console.error('Failed to check presentation status for task:', taskWithStatus.task.id, error);
			}
		}
	}

	return { user, topicsWithTasks, topics, form, activePresentations: Array.from(activePresentations.values()) };
};

export const actions = {
	upload: async ({ request, locals: { security }, params: { subjectOfferingClassId } }) => {
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
			const file = form.data.file;

			// Generate unique filename
			const uniqueFileName = generateUniqueFileName(file.name);

			// Convert file to buffer
			const buffer = Buffer.from(await file.arrayBuffer());

			// Upload file to storage in school bucket
			const objectKey = `${user.schoolId}/${uniqueFileName}`;
			await uploadBufferHelper(buffer, 'schools', objectKey, file.type);

			// Create resource in database
			const resource = await createResource(
				form.data.title || file.name.replace(/\.[^/.]+$/, ''), // Use title or filename without extension
				file.name,
				objectKey,
				file.type,
				file.size,
				'general', // resource type
				user.id
			);

			// Link resource to subject offering class
			await addResourceToSubjectOfferingClass(
				classId,
				resource.id,
				user.id,
				form.data.title,
				form.data.description,
				form.data.topicId
			);

			return withFiles({ form });
		} catch (error) {
			console.error('Error uploading resource:', error);
			return fail(500, { form, message: 'Failed to upload resource' });
		}
	},

	delete: async ({ request, locals: { security }, params: { subjectOfferingClassId } }) => {
		security.isAuthenticated();

		const formData = await request.formData();
		const resourceId = parseInt(formData.get('resourceId') as string, 10);
		const classId = parseInt(subjectOfferingClassId, 10);

		if (isNaN(resourceId) || isNaN(classId)) {
			return fail(400, { message: 'Invalid resource or class ID' });
		}

		try {
			await removeResourceFromSubjectOfferingClass(classId, resourceId);
			return { success: true };
		} catch (error) {
			console.error('Error deleting resource:', error);
			return fail(500, { message: 'Failed to delete resource' });
		}
	}
};
