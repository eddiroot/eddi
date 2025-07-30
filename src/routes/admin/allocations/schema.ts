import { z } from 'zod/v4';
import { userSubjectOfferingClassRoleEnum } from '$lib/enums.js';

export const createAllocationSchema = z.object({
	userId: z.string().min(1, 'User is required'),
	subjectOfferingClassId: z.string().min(1, 'Class is required'),
	role: z.enum(userSubjectOfferingClassRoleEnum)
});

export const updateAllocationSchema = z.object({
	id: z.number().int().positive('Allocation ID is required'),
	role: z.enum(userSubjectOfferingClassRoleEnum)
});

export type CreateAllocationSchema = typeof createAllocationSchema;
export type UpdateAllocationSchema = typeof updateAllocationSchema;
