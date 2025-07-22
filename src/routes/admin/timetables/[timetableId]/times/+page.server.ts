import {
	getTimetableDays,
	getTimetablePeriods,
	updateTimetableDays,
	addTimetablePeriod,
	deleteTimetablePeriod
} from '$lib/server/db/service';
import { error, fail } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { updateDaysSchema, addPeriodSchema } from './schema.js';

export const load = async ({ params, locals: { security } }) => {
	security.isAuthenticated().isSchoolAdmin();

	const timetableId = parseInt(params.timetableId);

	if (isNaN(timetableId)) {
		error(400, 'Invalid timetable ID');
	}

	try {
		const [days, periods] = await Promise.all([
			getTimetableDays(timetableId),
			getTimetablePeriods(timetableId)
		]);

		const [updateDaysForm, addPeriodForm] = await Promise.all([
			superValidate({ selectedDays: days.map((d) => d.day) }, zod4(updateDaysSchema)),
			superValidate(zod4(addPeriodSchema))
		]);

		return {
			timetableId,
			days,
			periods,
			updateDaysForm,
			addPeriodForm
		};
	} catch (err) {
		console.error('Error loading timetable data:', err);
		error(500, 'Failed to load timetable data');
	}
};

export const actions = {
	updateDays: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		const timetableId = parseInt(params.timetableId);
		if (isNaN(timetableId)) {
			return fail(400, { error: 'Invalid timetable ID' });
		}

		const form = await superValidate(request, zod4(updateDaysSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await updateTimetableDays(timetableId, form.data.selectedDays);
			return message(form, 'Days updated successfully');
		} catch (err) {
			console.error('Error updating days:', err);
			return message(form, err instanceof Error ? err.message : 'Failed to update days', {
				status: 400
			});
		}
	},

	updatePeriods: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		const timetableId = parseInt(params.timetableId);
		if (isNaN(timetableId)) {
			return fail(400, { error: 'Invalid timetable ID' });
		}

		const form = await superValidate(request, zod4(addPeriodSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await addTimetablePeriod(timetableId, form.data.startTime, form.data.endTime);
			return message(form, 'Period added successfully');
		} catch (err) {
			console.error('Error adding period:', err);
			return message(form, 'Failed to add period', { status: 500 });
		}
	},

	deletePeriod: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		const timetableId = parseInt(params.timetableId);
		if (isNaN(timetableId)) {
			return fail(400, { error: 'Invalid timetable ID' });
		}

		const formData = await request.formData();
		const periodId = parseInt(formData.get('periodId') as string);
		if (isNaN(periodId)) {
			return fail(400, { error: 'Invalid period ID' });
		}

		try {
			await deleteTimetablePeriod(periodId, timetableId);
			return { success: true, message: 'Period deleted successfully' };
		} catch (err) {
			console.error('Error deleting period:', err);
			return {
				success: false,
				message: err instanceof Error ? err.message : 'Failed to delete period',
				status: 400
			};
		}
	}
};
