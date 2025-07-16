import { z } from 'zod';

export const markAbsentSchema = z.object({
	studentId: z.string().min(1, 'Student ID is required'),
	date: z.date(),
	note: z.string().optional()
});

export type MarkAbsentSchema = typeof markAbsentSchema;
