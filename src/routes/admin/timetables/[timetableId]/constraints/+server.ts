import { createTimetableConstraint, deleteTimetableConstraint, updateTimetableConstraintActiveStatus } from '$lib/server/db/service';
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

		const timetableConstraint = await createTimetableConstraint(data);

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

// Update a constraint (toggle active state or update parameters)
export const PATCH = async ({ request, params, locals: { security } }) => {
	security.isAuthenticated().isSchoolAdmin().getUser();
	const timetableId = parseInt(params.timetableId);

	try {
		const { constraintId, active } = await request.json();

		if (!constraintId) {
			return json({
				success: false,
				error: 'constraintId is required'
			}, { status: 400 });
		}

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
export const DELETE = async ({ request, params, locals: { security } }) => {
	security.isAuthenticated().isSchoolAdmin().getUser();
	const timetableId = parseInt(params.timetableId);

	try {
		const { constraintId } = await request.json();

		if (!constraintId) {
			return json({
				success: false,
				error: 'constraintId is required'
			}, { status: 400 });
		}

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
