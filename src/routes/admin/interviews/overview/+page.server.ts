import { InterviewService } from '$lib/server/db/service/interviews';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

type TeacherSlotGroup = {
	teacher: {
		id: string;
		name: string;
		email: string;
	};
	slots: Array<{
		id: string;
		startTime: string;
		endTime: string;
		status: string;
		classId: number | null;
	}>;
};

export const load: PageServerLoad = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();
	const config = await InterviewService.getConfigBySchoolId(user.schoolId);

	let stats = null;
	let teacherSlots = null;

	if (config) {
		const allSlots = await InterviewService.getSlotsByConfig(config.id);

		// Filter slots based on slot generation mode
		const filteredSlots =
			config.slotGenerationMode === 'class'
				? allSlots.filter((slot) => slot.classId !== null) // Only show slots with class labels
				: allSlots; // Show all slots for teacher-based mode

		stats = {
			totalSlots: filteredSlots.length,
			availableSlots: filteredSlots.filter((s) => s.status === 'available').length,
			bookedSlots: filteredSlots.filter((s) => s.status === 'booked').length
		};

		// Get teacher information for filtered slots
		const teacherIds = [...new Set(filteredSlots.map((slot) => slot.teacherId))];
		const teachers = await InterviewService.getTeachersByIds(teacherIds);
		const teacherMap = new Map(teachers.map((t) => [t.id, t]));

		// Group slots by date, then by teacher
		const slotsByDate = new Map();
		for (const slot of filteredSlots) {
			const teacher = teacherMap.get(slot.teacherId);
			if (!teacher) continue;

			if (!slotsByDate.has(slot.date)) {
				slotsByDate.set(slot.date, new Map());
			}

			const dateGroup = slotsByDate.get(slot.date);
			if (!dateGroup.has(slot.teacherId)) {
				dateGroup.set(slot.teacherId, {
					teacher: {
						id: teacher.id,
						name: `${teacher.firstName} ${teacher.lastName}`,
						email: teacher.email
					},
					slots: []
				});
			}

			dateGroup.get(slot.teacherId).slots.push({
				id: slot.id,
				startTime: slot.startTime,
				endTime: slot.endTime,
				status: slot.status,
				classId: slot.classId
			});
		}

		// Convert to array format and sort
		teacherSlots = Array.from(slotsByDate.entries())
			.map(([date, teacherMap]) => ({
				date,
				teachers: (Array.from(teacherMap.values()) as TeacherSlotGroup[]).sort((a, b) =>
					a.teacher.name.localeCompare(b.teacher.name)
				)
			}))
			.sort((a, b) => a.date.localeCompare(b.date));
	}

	return { config, stats, teacherSlots };
};

export const actions: Actions = {
	activate: async ({ locals: { security } }) => {
		const user = security.isAuthenticated().isSchoolAdmin().getUser();
		await InterviewService.activateConfig(user.schoolId);
		return redirect(302, '/admin/interviews');
	},
	deactivate: async ({ locals: { security } }) => {
		const user = security.isAuthenticated().isSchoolAdmin().getUser();
		const config = await InterviewService.getConfigBySchoolId(user.schoolId);
		if (config) {
			await InterviewService.createOrUpdateConfig(user.schoolId, { ...config, isActive: false });
		}
		return redirect(302, '/admin/interviews/overview');
	}
};
