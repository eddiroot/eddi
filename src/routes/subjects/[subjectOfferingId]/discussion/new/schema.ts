import { z } from 'zod';

export const formSchema = z.object({
	type: z.enum(['qanda', 'discussion', 'announcement', 'question'], {
		required_error: 'Please select a type'
	}),
	title: z.string({ required_error: 'Please enter a title' }),
	content: z.string({ required_error: 'Please enter some content' })
});

export type FormSchema = typeof formSchema;
