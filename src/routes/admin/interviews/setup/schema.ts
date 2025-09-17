import { z } from 'zod';

export const interviewSetupSchema = z.object({
	wholeSchool: z.boolean().default(true),
	yearLevels: z.array(z.string()).default([]),
	dates: z.array(z.string()).min(1, 'Please select at least one interview date'),
	timeRanges: z.string().default('{}'),
	duration: z.number().min(1, 'Duration must be at least 1 minute').max(120, 'Duration cannot exceed 120 minutes'),
	schedulingMode: z.enum(['admin', 'self_service']).default('admin'),
	autoAssign: z.boolean().refine(val => val === true, {
		message: 'Auto-assign must be enabled to generate interview slots'
	}),
	deliveryModes: z.array(z.enum(['in_person', 'online'])).min(1, 'Please select at least one delivery mode')
}).refine((data) => {
	// If not whole school, require at least one year level
	if (!data.wholeSchool && data.yearLevels.length === 0) {
		return false;
	}
	return true;
}, {
	message: 'Please select at least one year level when not configuring for whole school',
	path: ['yearLevels'] // This will attach the error to the yearLevels field
});

export type InterviewSetupForm = z.infer<typeof interviewSetupSchema>;
