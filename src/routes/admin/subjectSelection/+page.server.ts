import { yearLevelEnum } from '$lib/enums.js';
import {
  createSubjectSelectionConstraint,
  deleteSubjectSelectionConstraint,
  getSubjectSelectionConstraints,
  getSubjectsBySchoolId,
  updateSubjectSelectionConstraint
} from '$lib/server/db/service';
import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import {
  createConstraintSchema,
  deleteConstraintSchema,
  updateConstraintSchema
} from './schema.js';

export const load = async ({ locals: { security }, url }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();

	// Get year level and year from URL params or use defaults
	const yearLevel = (url.searchParams.get('yearLevel') as yearLevelEnum) || yearLevelEnum.year7;
	const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());

	// Get all subjects for the school to populate the selector
	const subjects = await getSubjectsBySchoolId(user.schoolId);

	// Get constraints for the selected year level and year
	const constraints = await getSubjectSelectionConstraints(user.schoolId, yearLevel, year);

	return {
		subjects,
		constraints,
		selectedYearLevel: yearLevel,
		selectedYear: year,
		createForm: await superValidate(zod4(createConstraintSchema)),
		updateForm: await superValidate(zod4(updateConstraintSchema)),
		deleteForm: await superValidate(zod4(deleteConstraintSchema))
	};
};

export const actions = {
	create: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().isSchoolAdmin().getUser();
		const form = await superValidate(request, zod4(createConstraintSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await createSubjectSelectionConstraint(
				user.schoolId,
				form.data.yearLevel as yearLevelEnum,
				form.data.year,
				form.data.name,
				form.data.description || null,
				form.data.min,
				form.data.max ? form.data.max : null,
				form.data.subjectIds
			);

			return message(form, 'Constraint created successfully');
		} catch (error) {
			console.error('Error creating constraint:', error);
			return fail(500, { form, error: 'Failed to create constraint' });
		}
	},

	update: async ({ request, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();
		const form = await superValidate(request, zod4(updateConstraintSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await updateSubjectSelectionConstraint(
				form.data.constraintId,
				form.data.name,
				form.data.description || null,
				form.data.min,
				form.data.max ? form.data.max : null,
				form.data.subjectIds
			);

			return message(form, 'Constraint updated successfully');
		} catch (error) {
			console.error('Error updating constraint:', error);
			return fail(500, { form, error: 'Failed to update constraint' });
		}
	},

	delete: async ({ request, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();
		const form = await superValidate(request, zod4(deleteConstraintSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await deleteSubjectSelectionConstraint(form.data.constraintId);

			return message(form, 'Constraint deleted successfully');
		} catch (error) {
			console.error('Error deleting constraint:', error);
			return fail(500, { form, error: 'Failed to delete constraint' });
		}
	}
};
