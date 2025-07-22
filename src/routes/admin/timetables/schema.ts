import { z } from 'zod/v4';

const currentYear = new Date().getFullYear();

export const createTimetableSchema = z.object({
	name: z
		.string()
		.min(1, 'Timetable name is required')
		.max(255, 'Name must be 255 characters or less'),
	schoolYear: z
		.number()
		.int()
		.min(currentYear, `Year must be ${currentYear} or later`)
		.default(currentYear)
});

export type CreateTimetableSchema = typeof createTimetableSchema;
