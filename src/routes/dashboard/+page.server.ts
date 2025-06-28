import {
	getSubjectsByUserId,
	getRecentAnnouncementsByUserId,
	getSubjectClassAllocationsByUserIdForToday
} from '$lib/server/db/service';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().getUser();
	const subjects = await getSubjectsByUserId(user.id);
	const announcements = await getRecentAnnouncementsByUserId(user.id);
	const userClasses = await getSubjectClassAllocationsByUserIdForToday(user.id);
	return { user, subjects, announcements, userClasses };
};
