import { subjectThreadTypeEnum } from '$lib/enums';
import { z } from 'zod/v4';

export const formSchema = z.object({
	type: z.enum(subjectThreadTypeEnum),
	title: z.string().min(1, 'Title is required'),
	content: z.string().min(1, 'Content is required')
});

export type FormSchema = typeof formSchema;
