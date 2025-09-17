import {
	getAllConstraintsByTimetableId,
	getAllConstraints
} from '$lib/server/db/service/timetables';
import { constraintTypeEnum } from '$lib/enums';
import { hasCustomForm } from '$lib/constraint-form-mapping';

export const load = async ({ locals: { security }, params }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();
	const timetableId = parseInt(params.timetableId);
	
	// Get constraints currently assigned to this timetable
	const assignedConstraints = await getAllConstraintsByTimetableId(timetableId);
	
	// Get all constraints from the database
	const allConstraints = await getAllConstraints();
	
	// Filter to only show constraints that have custom forms
	const constraintsWithForms = allConstraints.filter(constraint => hasCustomForm(constraint.FETName));
	
	// Separate current constraints by type
	const currentTimeConstraints = assignedConstraints.filter(
		con => con.type === constraintTypeEnum.time
	);
	const currentSpaceConstraints = assignedConstraints.filter(
		con => con.type === constraintTypeEnum.space
	);
	
	// Separate available constraints by type (all constraints with forms)
	const availableTimeConstraints = constraintsWithForms.filter(
		con => con.type === constraintTypeEnum.time
	);
	const availableSpaceConstraints = constraintsWithForms.filter(
		con => con.type === constraintTypeEnum.space
	);

	return {
		user,
		timetableId,
		// current constraints that are assigned to this timetable
		currentTimeConstraints,
		currentSpaceConstraints,
		// available constraints that can be added (have forms)
		availableTimeConstraints,
		availableSpaceConstraints,
	};
};
