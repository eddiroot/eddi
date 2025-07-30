import { fail } from '@sveltejs/kit';
import { XMLBuilder } from 'fast-xml-parser';
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
import { buildFETXML } from './utils.js';
import type { Actions } from './$types.js';
import { generateUniqueFileName, uploadBufferHelper } from '$lib/server/obj.js';

export const actions: Actions = {
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

			const xmlData = buildFETXML({
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

			const xmlBuilderOptions = {
				ignoreAttributes: false,
				format: true,
				suppressEmptyNode: true,
				attributeNamePrefix: '@_'
			};

			const builder = new XMLBuilder(xmlBuilderOptions);
			const xmlContent = builder.build(xmlData);

			const uniqueFileName = generateUniqueFileName(`${timetableId}.xml`);
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
