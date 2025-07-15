import { getGuardiansChildrensAttendancesByUserId } from '$lib/server/db/service';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isGuardian().getUser();

	const attendances = await getGuardiansChildrensAttendancesByUserId(user.id);

	const attendancesByUserId = attendances.reduce<Record<string, (typeof attendances)[number][]>>(
		(acc, attendance) => {
			const userId = attendance.user.id;
			if (!acc[userId]) {
				acc[userId] = [];
			}
			acc[userId].push(attendance);
			return acc;
		},
		{}
	);

	return {
		user,
		attendancesByUserId
	};
};
