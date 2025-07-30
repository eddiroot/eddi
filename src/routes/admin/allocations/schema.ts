import { z } from 'zod/v4';

export const createAllocationSchema = z.object({
	userId: z.string().min(1, 'User is required'),
	subjectOfferingClassId: z.string().min(1, 'Class is required')
});

export type CreateAllocationSchema = typeof createAllocationSchema;
