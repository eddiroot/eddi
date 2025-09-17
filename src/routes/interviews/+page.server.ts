import type { PageServerLoad, Actions } from './$types';
import { InterviewService } from '$lib/server/db/service/interviews';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().getUser();
	if (user.type !== 'teacher') {
		throw redirect(302, '/dashboard?error=teacher_only');
	}
	const config = await InterviewService.getConfigBySchoolId(user.schoolId);
	if (!config || !config.isActive) {
		return { config: null, teacherSlots: [], stats: null, groupedSlots: [] };
	}
	const allSlots = await InterviewService.getSlotsByConfig(config.id);
	const teacherSlots = allSlots.filter(slot => slot.teacherId === user.id);
	
	// Group slots by class or show all if teacher-based
	const groupedSlots = [];
	if (teacherSlots.length > 0) {
		const slotsByClass = new Map();
		for (const slot of teacherSlots) {
			const key = slot.classId || 'general';
			if (!slotsByClass.has(key)) {
				slotsByClass.set(key, {
					classId: slot.classId,
					className: slot.classId ? `Class ${slot.classId}` : 'General Slots',
					slots: []
				});
			}
			slotsByClass.get(key).slots.push(slot);
		}
		groupedSlots.push(...Array.from(slotsByClass.values()));
	}
	
	const stats = {
		totalSlots: teacherSlots.length,
		availableSlots: teacherSlots.filter(slot => slot.status === 'available').length,
		bookedSlots: teacherSlots.filter(slot => slot.status === 'booked').length,
		blockedSlots: teacherSlots.filter(slot => slot.status === 'blocked').length
	};
	return { config, teacherSlots, stats, groupedSlots };
};

export const actions: Actions = {
	toggleSlotStatus: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().getUser();
		if (user.type !== 'teacher') return fail(403, { error: 'Only teachers can manage slots' });
		const formData = await request.formData();
		const slotId = formData.get('slotId') as string;
		const currentStatus = formData.get('currentStatus') as string;
		const newStatus = currentStatus === 'available' ? 'blocked' : 'available';
		
		await InterviewService.updateSlotStatus(slotId, user.id, newStatus);
		return { success: true };
	}
};
