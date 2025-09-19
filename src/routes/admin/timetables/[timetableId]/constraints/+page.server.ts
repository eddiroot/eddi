import { hasCustomForm } from '$lib/constraint-form-mapping';
import { constraintTypeEnum } from '$lib/enums';
import {
	getAllConstraints,
	getAllConstraintsByTimetableId
} from '$lib/server/db/service/timetables';

export const load = async ({ locals: { security }, params }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();
	const timetableId = parseInt(params.timetableId);

	// Get constraints currently assigned to this timetable
	const assignedConstraints = await getAllConstraintsByTimetableId(timetableId);

	// Get all constraints from the database
	const allConstraints = await getAllConstraints();

	// Filter to only show constraints that have custom forms
	const constraintsWithForms = allConstraints.filter((constraint) => hasCustomForm(constraint.FETName));

	// Get the constraint IDs that are already assigned to this timetable
	const assignedConstraintIds = new Set(assignedConstraints.map(c => c.id));

	// Filter available constraints based on repeatability rules
	const availableConstraints = constraintsWithForms.filter(constraint => {
		// If the constraint is repeatable, always show it
		if (constraint.repeatable) {
			return true;
		}
		// If the constraint is not repeatable, only show it if it hasn't been used yet
		return !assignedConstraintIds.has(constraint.id);
	});

	// Separate current constraints by type
	const currentTimeConstraints = assignedConstraints.filter((con) => con.type === constraintTypeEnum.time);
	const currentSpaceConstraints = assignedConstraints.filter((con) => con.type === constraintTypeEnum.space);

	// Separate available constraints by type
	const availableTimeConstraints = availableConstraints.filter((con) => con.type === constraintTypeEnum.time);
	const availableSpaceConstraints = availableConstraints.filter((con) => con.type === constraintTypeEnum.space);

	return {
		user,
		timetableId,
		// current constraints that are assigned to this timetable
		currentTimeConstraints,
		currentSpaceConstraints,
		// available constraints that can be added (have forms and respect repeatability rules)
		availableTimeConstraints,
		availableSpaceConstraints
	};
};
