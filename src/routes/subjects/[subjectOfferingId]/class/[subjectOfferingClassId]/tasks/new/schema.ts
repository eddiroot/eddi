import { taskTypeEnum } from '$lib/enums';
import { z } from 'zod/v4';

const MAX_MB_COUNT = 5;
const MAX_UPLOAD_SIZE = 1024 * 1024 * MAX_MB_COUNT;

const ACCEPTED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
const ACCEPTED_FILE_TYPES_HR = ACCEPTED_FILE_TYPES.map((type) =>
	type.split('/')[1].toUpperCase()
).join(', ');

export const fileSchema = z
	.instanceof(File)
	.refine((file) => {
		return file.size <= MAX_UPLOAD_SIZE;
	}, `File size must be less than ${MAX_MB_COUNT}MB`)
	.refine((file) => {
		return ACCEPTED_FILE_TYPES.includes(file.type);
	}, `File must be one of ${ACCEPTED_FILE_TYPES_HR}`);

export const filesSchema = z
	.array(
		z
			.instanceof(File)
			.refine((file) => file.size <= 10 * 1024 * 1024, {
				message: 'File size must be less than 10MB'
			})
			.refine(
				(file) => {
					const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
					return allowedTypes.includes(file.type);
				},
				{
					message: 'File must be a PNG, JPEG, or PDF'
				}
			)
	)
	.min(1, 'At least one file is required')
	.max(5, 'Maximum 5 files allowed');

export const formSchema = z
	.object({
		title: z.string().min(1, 'Title cannot be empty'),
		description: z.string().max(500, 'Description cannot exceed 500 characters'),
		taskTopicId: z.number().optional(),
		newTopicName: z.string().min(1, 'New topic name cannot be empty').optional(),
		type: z.enum(taskTypeEnum).default(taskTypeEnum.lesson),
		dueDate: z.date().optional(),
		week: z.number().optional(),
		files: filesSchema.optional(),
		creationMethod: z.enum(['manual', 'ai']),
		selectedLearningAreaContentIds: z.array(z.number()).optional(),
		aiTutorEnabled: z.boolean().default(true)
	})
	.refine((data) => data.taskTopicId || data.newTopicName, {
		message: 'Please select an existing topic or create a new topic',
		path: ['taskTopicId']
	});

export type FileSchema = typeof fileSchema;
export type FilesSchema = typeof filesSchema;
export type FormSchema = typeof formSchema;
