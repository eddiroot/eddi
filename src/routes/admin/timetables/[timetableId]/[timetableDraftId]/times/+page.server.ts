import {
	addTimetableDraftPeriod,
	deleteTimetableDraftPeriodByPeriodId,
	getTimetableDraftDaysByTimetableDraftId,
	getTimetableDraftPeriodsByTimetableDraftId,
	updateTimetableDraftDaysByTimetableDraftId
} from '$lib/server/db/service';
import { error, fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { addPeriodSchema, updateDaysSchema } from './schema.js';

export const load = async ({ params, locals: { security } }) => {
	security.isAuthenticated().isSchoolAdmin();

	const timetableDraftId = parseInt(params.timetableDraftId, 10);

	if (isNaN(timetableDraftId)) {
		error(400, 'Invalid timetable ID');
	}

	try {
		const [days, periods] = await Promise.all([
			getTimetableDraftDaysByTimetableDraftId(timetableDraftId),
			getTimetableDraftPeriodsByTimetableDraftId(timetableDraftId)
		]);

		const [updateDaysForm, addPeriodForm] = await Promise.all([
			superValidate({ selectedDays: days.map((d) => d.day) }, zod4(updateDaysSchema)),
			superValidate(zod4(addPeriodSchema))
		]);

		return {
			timetableDraftId,
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

		const timetableDraftId = parseInt(params.timetableDraftId, 10);
		if (isNaN(timetableDraftId)) {
			return fail(400, { error: 'Invalid timetable ID' });
		}

		const form = await superValidate(request, zod4(updateDaysSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await updateTimetableDraftDaysByTimetableDraftId(timetableDraftId, form.data.selectedDays);
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

		const timetableDraftId = parseInt(params.timetableDraftId, 10);
		if (isNaN(timetableDraftId)) {
			return fail(400, { error: 'Invalid timetable ID' });
		}

		const form = await superValidate(request, zod4(addPeriodSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await addTimetableDraftPeriod(timetableDraftId, form.data.startTime, form.data.endTime);
			return message(form, 'Period added successfully');
		} catch (err) {
			console.error('Error adding period:', err);
			return message(form, 'Failed to add period', { status: 500 });
		}
	},

	deletePeriod: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		const timetableDraftId = parseInt(params.timetableDraftId, 10);
		if (isNaN(timetableDraftId)) {
			return fail(400, { error: 'Invalid timetable ID' });
		}

		const formData = await request.formData();
		const periodId = parseInt(formData.get('periodId') as string, 10);
		if (isNaN(periodId)) {
			return fail(400, { error: 'Invalid period ID' });
		}

		try {
			await deleteTimetableDraftPeriodByPeriodId(periodId, timetableDraftId);
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
