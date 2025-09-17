import type { SubjectClassAllocationAttendance } from '$lib/server/db/schema';
import { z } from 'zod/v4';

export const attendanceSchema = z.object({
	subjectClassAllocationId: z.number(),
	userId: z.string(),
	didAttend: z.boolean(),
	attendanceNote: z.string().optional(),
	behaviourNote: z.string().optional()
});

export type AttendanceSchema = typeof attendanceSchema;

export type AttendanceFormData = Pick<
	SubjectClassAllocationAttendance,
	'subjectClassAllocationId' | 'userId' | 'didAttend' | 'attendanceNote' | 'behaviourNote'
>;

export type AttendanceUpdate = Omit<AttendanceFormData, 'subjectClassAllocationId' | 'userId'> & {
	subjectClassAllocationId: number;
	userId: string;
};
