import { z } from 'zod/v4';
import { yearLevelEnum } from '$lib/enums';

export const createGroupSchema = z.object({
	name: z.string().min(1, 'Group name is required').max(255, 'Name must be 255 characters or less'),
	yearLevel: z.enum(yearLevelEnum, {
		message: 'Year level is required'
	})
});

export type CreateGroupSchema = typeof createGroupSchema;
