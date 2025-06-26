import { z } from 'zod';

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
	.array(fileSchema)
	.optional()
	.refine((files) => {
		if (!files) return true;
		return files.length <= 10; // Max 10 files
	}, 'Maximum 10 files allowed')
	.refine((files) => {
		if (!files) return true;
		const totalSize = files.reduce((sum, file) => sum + file.size, 0);
		return totalSize <= MAX_UPLOAD_SIZE * 5; // Max 25MB total
	}, 'Total file size must be less than 25MB');

export const formSchema = z
	.object({
		title: z.string({ required_error: 'Please enter a title' }).min(1, 'Title cannot be empty'),
		description: z
			.string({ required_error: 'Please enter a description' })
			.max(500, 'Description cannot exceed 500 characters'),
		lessonTopicId: z.number().optional(), // Make this optional
		newTopicName: z.string().optional(), // Add this for new topic creation
		subjectWeek: z
			.number({ required_error: 'Please enter a week' })
			.min(0, 'Subject week must be at least 0'),
		dueDate: z.date().optional(),
		files: filesSchema.optional(),
		creationMethod: z.enum(['manual', 'ai'], {
			required_error: 'Please select a creation method'
		})
	})
	.refine((data) => data.lessonTopicId || data.newTopicName, {
		message: 'Please select an existing topic or enter a new topic name',
		path: ['lessonTopicId']
	});

export type FileSchema = typeof fileSchema;
export type FilesSchema = typeof filesSchema;
export type FormSchema = typeof formSchema;
