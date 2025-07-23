import { z } from 'zod/v4';
import { yearLevelEnum } from '$lib/enums';

export const activityFormSchema = z.object({
	yearLevel: z.enum(yearLevelEnum),
	activities: z
		.object({
			subjectId: z.number().int().positive(),
			periodsPerInstance: z.number().int().min(1).max(10),
			totalPeriods: z.number().int().min(1).max(100),
			teacherIds: z.array(z.uuid()).min(1, 'At least one teacher must be selected')
		})
		.array()
});

export type ActivityFormSchema = typeof activityFormSchema;
