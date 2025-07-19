import {
	getSubjectClassAllocationAndStudentAttendancesByClassIdForToday,
	upsertSubjectClassAllocationAttendance,
	getSubjectOfferingClassByAllocationId,
	getGuardiansForStudent
} from '$lib/server/db/service';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { attendanceSchema } from './schema.js';
import { sendAbsenceEmail } from '$lib/server/email.js';
import { convertToFullName } from '$lib/utils.js';

export const load = async ({ locals: { security }, params: { subjectOfferingClassId } }) => {
	security.isAuthenticated();

	let subjectOfferingClassIdInt;
	try {
		subjectOfferingClassIdInt = parseInt(subjectOfferingClassId, 10);
	} catch {
		return { subject: null };
	}

	const attendances =
		await getSubjectClassAllocationAndStudentAttendancesByClassIdForToday(
			subjectOfferingClassIdInt
		);

	const form = await superValidate(zod(attendanceSchema));

	return { attendances, form };
};

export const actions = {
	updateAttendance: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().getUser();

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
				form.data.attendanceNote,
				form.data.behaviourNote
			);

			if (!form.data.didAttend) {
				const classDetails = await getSubjectOfferingClassByAllocationId(
					form.data.subjectClassAllocationId
				);
				const guardians = await getGuardiansForStudent(form.data.userId);

				if (classDetails && guardians.length > 0) {
					const studentName = convertToFullName(user.firstName, user.middleName, user.lastName);
					const className = `${classDetails.subject.name} - ${classDetails.subjectOfferingClass.name}`;
					const today = new Date();

					for (const guardianData of guardians) {
						await sendAbsenceEmail(guardianData.guardian.email, studentName, className, today);
					}
				}
			}

			return { form, success: true };
		} catch (err) {
			console.error('Error updating attendance:', err);
			return fail(500, { form, error: 'Failed to update attendance' });
		}
	}
};
