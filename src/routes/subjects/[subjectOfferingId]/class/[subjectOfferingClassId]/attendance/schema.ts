import { z } from 'zod';

export const attendanceSchema = z.object({
	subjectClassAllocationId: z.number(),
	userId: z.string(),
	didAttend: z.boolean(),
	note: z.string().optional()
});

export type AttendanceSchema = typeof attendanceSchema;
