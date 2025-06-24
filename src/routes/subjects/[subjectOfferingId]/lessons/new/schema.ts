import { z } from 'zod';

const MAX_MB_COUNT = 5;
const MAX_UPLOAD_SIZE = 1024 * 1024 * MAX_MB_COUNT;

const ACCEPTED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
const ACCEPTED_FILE_TYPES_HR = ACCEPTED_FILE_TYPES.map((type) =>
	type.split('/')[1].toUpperCase()
).join(', ');

export const formSchema = z.object({
	title: z.string({ required_error: 'Please enter a title' }).min(1, 'Title cannot be empty'),
	description: z
		.string({ required_error: 'Please enter a description' })
		.min(1, 'Description cannot be empty')
		.max(500, 'Description cannot exceed 500 characters'),
	subjectWeek: z
		.number({
			required_error: 'Please select a subject week'
		})
		.min(0, 'Subject week must be at least 0'),
	dueDate: z.date({ required_error: 'Please select a due date' }).optional(),
	lessonTopicId: z.number({ required_error: 'Please select a topic' }),
	file: z
		.instanceof(File)
		.optional()
		.refine((file) => {
			return !file || file.size <= MAX_UPLOAD_SIZE;
		}, `File size must be less than ${MAX_MB_COUNT}MB`)
		.refine((file) => {
			if (!file) return true; // because file is optional
			return ACCEPTED_FILE_TYPES.includes(file.type);
		}, `File must be one of ${ACCEPTED_FILE_TYPES_HR}`),
	creationMethod: z.enum(['manual', 'ai'], {
		required_error: 'Please select a creation method'
	})
});

export type FormSchema = typeof formSchema;
