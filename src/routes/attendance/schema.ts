import { z } from 'zod/v4';

export const markAbsentSchema = z.object({
	studentId: z.string().min(1, 'Student ID is required'),
	date: z.date(),
	attendanceNote: z.string().min(1, 'Note is required')
});

export type MarkAbsentSchema = typeof markAbsentSchema;
