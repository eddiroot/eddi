import type { PageServerLoad } from './$types';
import { InterviewService } from '$lib/server/db/service/interviews';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();
	const config = await InterviewService.getConfigBySchoolId(user.schoolId);
	
	// If no config exists, redirect to setup
	if (!config) {
		throw redirect(302, '/admin/interviews/setup');
	}
	
	// If config exists but is not active, redirect to overview
	if (!config.isActive) {
		throw redirect(302, '/admin/interviews/overview');
	}
	
	// Config exists and is active, show summary
	const stats = {
		totalSlots: (await InterviewService.getSlotsByConfig(config.id)).length,
		availableSlots: (await InterviewService.getSlotsByConfig(config.id)).filter(s => s.status === 'available').length,
		bookedSlots: (await InterviewService.getSlotsByConfig(config.id)).filter(s => s.status === 'booked').length
	};
	
	return { config, stats };
};
