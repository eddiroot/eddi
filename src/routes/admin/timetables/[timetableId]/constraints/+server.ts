import { createTimetableConstriant } from '$lib/server/db/service/timetables';
import { json } from '@sveltejs/kit';

// Add a constraint to a timetable
export const POST = async ({ request, params, locals: { security } }) => {
	security.isAuthenticated().isSchoolAdmin().getUser();
	const timetableId = parseInt(params.timetableId);

	try {
		const { constraintId, parameters = {} } = await request.json();

		const data = {
			timetableId,
			constraintId,
			active: true,
			parameters
		};

		const timetableConstraint = await createTimetableConstriant(data);

		return json({
			success: true,
			constraint: timetableConstraint
		});
	} catch (error) {
		console.error('Error adding constraint:', error);
		return json(
			{
				success: false,
				error: 'Failed to add constraint'
			},
			{ status: 500 }
		);
	}
};
