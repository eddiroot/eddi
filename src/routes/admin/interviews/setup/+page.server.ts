import { InterviewService } from '$lib/server/db/service/interviews';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { interviewSetupSchema } from './schema';

export const load: PageServerLoad = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();
	const existingConfig = await InterviewService.getConfigBySchoolId(user.schoolId);
	// Fetch year levels for this school
	const yearLevels = await InterviewService.getSchoolYearLevels(user.schoolId);
	return { existingConfig, yearLevels };
};

export const actions: Actions = {
	default: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().isSchoolAdmin().getUser();
		const formData = await request.formData();

		// Extract form data
		const wholeSchool = formData.get('wholeSchool') === 'true';
		const yearLevels = formData.getAll('yearLevels') as string[];
		const selectedDates = JSON.parse((formData.get('selectedDates') as string) || '[]');
		const dateTimeRanges = JSON.parse((formData.get('dateTimeRanges') as string) || '{}');
		const duration = parseInt(formData.get('duration') as string, 10) || 15;
		const autoAssign = formData.get('autoAssign') === 'true';
		const slotGenerationMode = (formData.get('slotGenerationMode') as string) || 'teacher';

		// Validate
		const validation = interviewSetupSchema.safeParse({
			wholeSchool,
			yearLevels,
			dates: selectedDates,
			timeRanges: JSON.stringify(dateTimeRanges),
			duration,
			schedulingMode: 'admin',
			autoAssign,
			deliveryModes: ['in_person']
		});

		if (!validation.success) {
			const errors: Record<string, string> = {};
			validation.error.issues.forEach((issue) => {
				const path = issue.path.join('.');
				errors[path] = issue.message;
			});
			return fail(400, {
				error: 'Validation failed',
				errors,
				formData: {
					wholeSchool,
					yearLevels,
					selectedDates,
					dateTimeRanges,
					duration,
					autoAssign,
					slotGenerationMode
				}
			});
		}

		// Save config
		const configData = {
			wholeSchool,
			yearLevels: wholeSchool ? null : yearLevels,
			interviewDates: selectedDates,
			durationMinutes: duration,
			autoAssign,
			deliveryModes: ['in_person'],
			dateTimeRanges: JSON.stringify(dateTimeRanges),
			slotGenerationMode,
			isActive: false
		};

		const updatedConfig = await InterviewService.createOrUpdateConfig(user.schoolId, configData);

		// Auto-generate slots if enabled
		if (autoAssign && selectedDates.length > 0) {
			// Fetch teachers who teach subjects in selected year levels
			const teachers = await InterviewService.getTeachersByYearLevels(
				user.schoolId,
				wholeSchool ? null : yearLevels
			);

			for (const teacher of teachers) {
				// Generate all slots for all dates
				const allSlots: { date: string; start: string; end: string }[] = [];

				for (const date of selectedDates) {
					const range = dateTimeRanges[date];
					if (!range) continue;

					const [startHour, startMinute] = range.start.split(':').map(Number);
					const [endHour, endMinute] = range.end.split(':').map(Number);
					const breaks = range.breaks || [];

					const current = new Date();
					current.setHours(startHour, startMinute, 0, 0);
					const end = new Date();
					end.setHours(endHour, endMinute, 0, 0);

					while (current < end) {
						const slotStart = `${current.getHours().toString().padStart(2, '0')}:${current.getMinutes().toString().padStart(2, '0')}`;
						const slotStartDate = new Date(current);
						current.setMinutes(current.getMinutes() + duration);
						if (current > end) break;
						const slotEnd = `${current.getHours().toString().padStart(2, '0')}:${current.getMinutes().toString().padStart(2, '0')}`;

						// Check for breaks
						const isInBreak = breaks.some((b: { start: string; end: string }) => {
							const [breakStartHour, breakStartMinute] = b.start.split(':').map(Number);
							const [breakEndHour, breakEndMinute] = b.end.split(':').map(Number);
							const breakStart = new Date();
							breakStart.setHours(breakStartHour, breakStartMinute, 0, 0);
							const breakEnd = new Date();
							breakEnd.setHours(breakEndHour, breakEndMinute, 0, 0);
							return slotStartDate < breakEnd && current > breakStart;
						});
						if (isInBreak) continue;

						allSlots.push({ date, start: slotStart, end: slotEnd });
					}
				}

				// If subject-based slot generation
				if (slotGenerationMode === 'class') {
					// Get classes and student counts for this teacher
					const classes = await InterviewService.getTeacherClassesWithStats(teacher.id, yearLevels);

					if (classes.length > 0) {
						// Split slots evenly among classes
						const slotsPerClass = Math.floor(allSlots.length / classes.length);
						let slotIndex = 0;

						for (const cls of classes) {
							const classSlots = allSlots.slice(slotIndex, slotIndex + slotsPerClass);
							slotIndex += slotsPerClass;

							// Save slots for this teacher/class
							if (classSlots.length > 0) {
								await InterviewService.createSlots(
									updatedConfig.id,
									teacher.id,
									cls.id.toString(),
									classSlots,
									duration,
									['in_person']
								);
							}
						}
					}
				} else {
					// Teacher-based slot generation - save all slots for this teacher
					if (allSlots.length > 0) {
						await InterviewService.createSlots(
							updatedConfig.id,
							teacher.id,
							null,
							allSlots,
							duration,
							['in_person']
						);
					}
				}
			}
		}

		return redirect(302, '/admin/interviews/overview');
	}
};
