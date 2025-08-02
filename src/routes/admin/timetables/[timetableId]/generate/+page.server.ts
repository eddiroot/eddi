import { fail } from '@sveltejs/kit';
import {
	getTimetableDays,
	getTimetablePeriods,
	getTimetableStudentGroupsWithCountsByTimetableId,
	getTimetableActivitiesByTimetableId,
	getBuildingsBySchoolId,
	getSpacesBySchoolId,
	getUsersBySchoolIdAndType,
	getSubjectsBySchoolId,
	getSchoolById,
	createTimetableQueueEntry
} from '$lib/server/db/service';
import { userTypeEnum } from '$lib/enums';
import { buildFETInput } from './utils.js';
import { generateUniqueFileName, uploadBufferHelper } from '$lib/server/obj.js';

export const actions = {
	generateTimetable: async ({ params, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();
		const user = security.getUser();

		const timetableId = parseInt(params.timetableId);
		if (isNaN(timetableId)) {
			return fail(400, { error: 'Invalid timetable ID' });
		}

		try {
			const [
				timetableDays,
				timetablePeriods,
				studentGroups,
				activities,
				buildings,
				spaces,
				teachers,
				subjects,
				school
			] = await Promise.all([
				getTimetableDays(timetableId),
				getTimetablePeriods(timetableId),
				getTimetableStudentGroupsWithCountsByTimetableId(timetableId),
				getTimetableActivitiesByTimetableId(timetableId),
				getBuildingsBySchoolId(user.schoolId),
				getSpacesBySchoolId(user.schoolId),
				getUsersBySchoolIdAndType(user.schoolId, userTypeEnum.teacher),
				getSubjectsBySchoolId(user.schoolId),
				getSchoolById(user.schoolId)
			]);

			const xmlContent = buildFETInput({
				timetableDays,
				timetablePeriods,
				studentGroups,
				activities,
				buildings,
				spaces,
				teachers,
				subjects,
				school
			});

			const uniqueFileName = generateUniqueFileName(`${timetableId}.fet`);
			const objectKey = `${user.schoolId}/${uniqueFileName}`;

			await uploadBufferHelper(
				Buffer.from(xmlContent, 'utf-8'),
				'schools',
				objectKey,
				'application/xml'
			);

			await createTimetableQueueEntry(timetableId, user.id, uniqueFileName);

			return { success: true, message: 'Timetable data queued for processing' };
		} catch (error) {
			console.error('Error generating timetable XML:', error);
			return fail(500, {
				error: 'Failed to generate timetable. Please ensure all required data is configured.'
			});
		}
	}
};
