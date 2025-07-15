import type { Task } from '$lib/server/db/schema';
import { getTasksBySubjectOfferingClassId, getResourcesBySubjectOfferingClassId, getTopics } from '$lib/server/db/service';
import { getPresignedUrl } from '$lib/server/obj';
import { error, fail } from '@sveltejs/kit';
import { superValidate, withFiles } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { uploadBufferHelper, generateUniqueFileName } from '$lib/server/obj';
import { db } from '$lib/server/db';
import { subjectOfferingClassResource } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

interface ResourceWithUrl {
	id: number;
	title: string | null;
	description: string | null;
	originalFileName: string;
	storedFileName: string;
	fileSize: number;
	subjectOfferingClassId: number;
	coursemapItemId: number | null;
	authorId: string;
	isArchived: boolean;
	createdAt: Date;
	updatedAt: Date;
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

export const load = async ({ locals: { security }, params: { subjectOfferingId, subjectOfferingClassId }, setHeaders }) => {
	const user = security.isAuthenticated().getUser();

	// Disable all caching to ensure fresh data
	setHeaders({
		'cache-control': 'no-cache, no-store, must-revalidate',
		'pragma': 'no-cache',
		'expires': '0'
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
					row.resource.storedFileName,
					7 * 24 * 60 * 60 // 7 days expiry
				);
				return {
					...row.resource,
					author: row.author,
					downloadUrl
				};
			} catch (error) {
				console.error(`Failed to generate URL for resource ${row.resource.id}:`, error);
				return {
					...row.resource,
					author: row.author,
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
			topicEntry.tasks.push(task.task);
			return acc;
		},
		[] as Array<{ topic: Topic; tasks: Array<Task>; resources: Array<ResourceWithUrl> }>
	);

	// Add resources to their respective topics
	resourcesWithUrls.forEach(resource => {
		if (resource.coursemapItemId) {
			const topicEntry = topicsWithTasks.find(item => item.topic.id === resource.coursemapItemId);
			if (topicEntry) {
				topicEntry.resources.push(resource);
			}
		}
	});

	return { user, topicsWithTasks, topics, form };
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

			// Convert file to buffer
			const buffer = Buffer.from(await file.arrayBuffer());

			// Generate unique filename
			const uniqueFileName = generateUniqueFileName(file.name);

			// Upload file to storage in school bucket
			await uploadBufferHelper(buffer, 'schools', `${user.schoolId}/${uniqueFileName}`, file.type);

			// Save resource metadata to database
			await db.insert(subjectOfferingClassResource).values({
				title: form.data.title || null,
				description: form.data.description || null,
				originalFileName: file.name,
				storedFileName: uniqueFileName,
				fileSize: file.size,
				subjectOfferingClassId: classId,
				coursemapItemId: form.data.topicId,
				authorId: user.id
			});

			return withFiles({ form });
		} catch (error) {
			console.error('Error uploading resource:', error);
			return fail(500, { form, message: 'Failed to upload resource' });
		}
	},

	delete: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().getUser();

		const formData = await request.formData();
		const resourceId = parseInt(formData.get('resourceId') as string, 10);

		if (isNaN(resourceId)) {
			return fail(400, { message: 'Invalid resource ID' });
		}

		try {
			// Check if the resource exists and get its details
			const resource = await db
				.select()
				.from(subjectOfferingClassResource)
				.where(eq(subjectOfferingClassResource.id, resourceId))
				.limit(1);

			if (resource.length === 0) {
				return fail(404, { message: 'Resource not found' });
			}

			// Check if user is authorized to delete (must be the author)
			if (resource[0].authorId !== user.id) {
				return fail(403, { message: 'You are not authorized to delete this resource' });
			}

			// Delete the resource from the database
			await db
				.delete(subjectOfferingClassResource)
				.where(eq(subjectOfferingClassResource.id, resourceId));

			// TODO: Also delete the actual file from storage if needed
			// await deleteFileFromStorage(resource[0].storedFileName);

			return { success: true };
		} catch (error) {
			console.error('Error deleting resource:', error);
			return fail(500, { message: 'Failed to delete resource' });
		}
	}
};
