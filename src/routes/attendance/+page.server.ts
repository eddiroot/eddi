import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { markAbsentSchema } from './schema.js';
import {
	getGuardiansChildrensAttendancesByUserId,
	getGuardiansChildrensSchedulesByUserId
} from '$lib/server/db/service';
import {
	getSubjectClassAllocationsByUserIdForDate,
	upsertSubjectClassAllocationAttendance
} from '$lib/server/db/service/subjects';

function groupRecordsByUserId<T extends { user: { id: string } }>(
	records: T[]
): Record<string, T[]> {
	return records.reduce<Record<string, T[]>>((acc, record) => {
		const userId = record.user.id;
		if (!acc[userId]) {
			acc[userId] = [];
		}
		acc[userId].push(record);
		return acc;
	}, {});
}

function validateAttendanceDate(date: Date): {
	isValid: boolean;
	error?: string;
	date?: Date;
} {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	if (date < today) {
		return { isValid: false, error: 'Cannot mark attendance for past dates' };
	}

	return { isValid: true, date };
}

async function markStudentAbsent(studentId: string, date: Date, note: string): Promise<number> {
	const classAllocations = await getSubjectClassAllocationsByUserIdForDate(studentId, date);

	for (const allocation of classAllocations) {
		await upsertSubjectClassAllocationAttendance(
			allocation.classAllocation.id,
			studentId,
			false, // Always mark as absent
			note || 'Marked absent by guardian'
		);
	}

	return classAllocations.length;
}

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isGuardian().getUser();

	const [attendances, schedules] = await Promise.all([
		getGuardiansChildrensAttendancesByUserId(user.id),
		getGuardiansChildrensSchedulesByUserId(user.id)
	]);

	const attendancesByUserId = groupRecordsByUserId(attendances);
	const schedulesByUserId = groupRecordsByUserId(schedules);
	const form = await superValidate(zod(markAbsentSchema));

	return {
		user,
		attendancesByUserId,
		schedulesByUserId,
		form
	};
};

export const actions = {
	markAttendance: async ({ request, locals: { security } }) => {
		security.isAuthenticated().isGuardian();

		const form = await superValidate(request, zod(markAbsentSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { studentId, date, note } = form.data;

		const dateValidation = validateAttendanceDate(date);
		if (!dateValidation.isValid) {
			return fail(400, { form, error: dateValidation.error });
		}

		try {
			const classCount = await markStudentAbsent(studentId, dateValidation.date!, note || '');

			return {
				form,
				success: true,
				message: `Successfully marked absent for ${classCount} classes`
			};
		} catch (error) {
			console.error('Error marking attendance:', error);
			return fail(500, { form, error: 'Failed to mark attendance' });
		}
	}
};
