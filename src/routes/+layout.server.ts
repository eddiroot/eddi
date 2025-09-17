import {
	getCampusesByUserId,
	getSchoolById,
	getSubjectsWithClassesByUserId
} from '$lib/server/db/service';
import { InterviewService } from '$lib/server/db/service/interviews';

export const load = async ({ locals: { user } }) => {
	if (!user) {
		return { user: null, school: null, subjects: [], classes: [], hasInterviewSlots: false };
	}

	// Needed to populate the sidebar with subjects and their classes
	const subjects = await getSubjectsWithClassesByUserId(user.id);

	// Needed to display the school and campus top left
	const school = await getSchoolById(user.schoolId);

	const campuses = await getCampusesByUserId(user.id);

	// Check if teacher has active interview slots (only for teachers)
	let hasInterviewSlots = false;
	if (user.type === 'teacher') {
		hasInterviewSlots = await InterviewService.hasActiveInterviewSlots(user.id);
	}

	return {
		user,
		school,
		campuses,
		subjects,
		hasInterviewSlots
	};
};
