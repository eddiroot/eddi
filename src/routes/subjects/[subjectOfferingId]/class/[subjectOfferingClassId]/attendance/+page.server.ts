import {
	getSubjectClassAllocationAndAttendancesByClassIdForToday,
	upsertSubjectClassAllocationAttendance
} from '$lib/server/db/service';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { attendanceSchema } from './schema.js';

export const load = async ({ locals: { security }, params: { subjectOfferingClassId } }) => {
	security.isAuthenticated();

	let subjectOfferingClassIdInt;
	try {
		subjectOfferingClassIdInt = parseInt(subjectOfferingClassId, 10);
	} catch {
		return { subject: null };
	}

	const attendances =
		await getSubjectClassAllocationAndAttendancesByClassIdForToday(subjectOfferingClassIdInt);

	const form = await superValidate(zod(attendanceSchema));

	return { attendances, form };
};

export const actions = {
	updateAttendance: async ({ request, locals: { security } }) => {
		security.isAuthenticated();

		const formData = await request.formData();
		const form = await superValidate(formData, zod(attendanceSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await upsertSubjectClassAllocationAttendance(
				form.data.subjectClassAllocationId,
				form.data.userId,
				form.data.didAttend,
				form.data.note
			);

			return { form, success: true };
		} catch (err) {
			console.error('Error updating attendance:', err);
			return fail(500, { form, error: 'Failed to update attendance' });
		}
	}
};
