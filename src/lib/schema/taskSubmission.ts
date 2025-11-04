import { z } from 'zod';
import { resourceFilesSchema } from './resourceSchema';

// Form schema for task submission
export const taskSubmissionSchema = z.object({
	comment: z.string().max(1000, 'Comment cannot exceed 1000 characters').optional(),
	files: resourceFilesSchema.optional()
});

export type TaskSubmissionSchema = typeof taskSubmissionSchema;
export type TaskSubmission = z.infer<typeof taskSubmissionSchema>;
