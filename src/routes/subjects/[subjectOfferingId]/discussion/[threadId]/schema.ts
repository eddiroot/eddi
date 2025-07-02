import { z } from 'zod';

export const formSchema = z.object({
	type: z.enum(['answer', 'comment'], {
		required_error: 'Please select a response type'
	}),
	content: z
		.string({ required_error: 'Please enter some content' })
		.min(1, 'Content cannot be empty'),
	parentResponseId: z.number().optional()
});

export type FormSchema = typeof formSchema;
