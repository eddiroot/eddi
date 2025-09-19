import { deleteTimetableConstraint, updateTimetableConstraintActiveStatus } from '$lib/server/db/service/timetables';
import { json } from '@sveltejs/kit';

// Update a constraint (toggle active state or update parameters)
export const PATCH = async ({ request, params, locals: { security } }) => {
	security.isAuthenticated().isSchoolAdmin().getUser();
	const timetableId = parseInt(params.timetableId);
	const constraintId = parseInt(params.constraintId);

	try {
		const { active } = await request.json();

		if (typeof active !== 'boolean') {
			return json({
				success: false,
				error: 'Active field must be a boolean'
			}, { status: 400 });
		}

		const updatedConstraint = await updateTimetableConstraintActiveStatus(
			timetableId, 
			constraintId, 
			active
		);

		if (!updatedConstraint) {
			return json({
				success: false,
				error: 'Constraint not found'
			}, { status: 404 });
		}

		return json({
			success: true,
			message: 'Constraint updated successfully',
			constraint: updatedConstraint
		});
	} catch (error) {
		console.error('Error updating constraint:', error);
		return json({
			success: false,
			error: 'Failed to update constraint'
		}, { status: 500 });
	}
};

// Remove a constraint from a timetable
export const DELETE = async ({ params, locals: { security } }) => {
	security.isAuthenticated().isSchoolAdmin().getUser();
	const timetableId = parseInt(params.timetableId);
	const constraintId = parseInt(params.constraintId);

	try {
		await deleteTimetableConstraint(timetableId, constraintId);

		return json({ success: true });
	} catch (error) {
		console.error('Error removing constraint:', error);
		return json(
			{
				success: false,
				error: 'Failed to remove constraint'
			},
			{ status: 500 }
		);
	}
};
