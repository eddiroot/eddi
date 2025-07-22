import { z } from 'zod/v4';

export const formSchema = z.object({
	type: z.enum(['answer', 'comment']),
	content: z.string().min(1, 'Content cannot be empty'),
	parentResponseId: z.number().optional()
});

export type FormSchema = typeof formSchema;
