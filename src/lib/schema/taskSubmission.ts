import { resourceFilesSchema } from '$lib/schema/resource';
import { z } from 'zod';

// Form schema for task submission
export const taskSubmissionSchema = z.object({
	comment: z.string().max(1000, 'Comment cannot exceed 1000 characters').optional(),
	files: resourceFilesSchema.optional()
});

export type TaskSubmissionSchema = typeof taskSubmissionSchema;
export type TaskSubmission = z.infer<typeof taskSubmissionSchema>;
