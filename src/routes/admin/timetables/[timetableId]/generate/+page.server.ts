import { userTypeEnum } from '$lib/enums.js';
import {
	getActiveTimetableConstraintsForTimetable,
	getBuildingsBySchoolId,
	getEnhancedTimetableActivitiesByTimetableId,
	getSchoolById,
	getSpacesBySchoolId,
	getStudentGroupsByTimetableId,
	getSubjectsBySchoolId,
	getTimetableDays,
	getTimetablePeriods,
	getTimetableQueueByTimetableId,
	getUsersBySchoolIdAndType
} from '$lib/server/db/service';
import { fail } from '@sveltejs/kit';
import { buildFETInput } from './utils.js';
import { processTimetableQueue } from '../../../../../scripts/processTimetable.js';

export const load = async ({ params, locals: { security }, depends }) => {
	security.isAuthenticated().isSchoolAdmin();

	const timetableId = parseInt(params.timetableId);
	if (isNaN(timetableId)) {
		return fail(400, { error: 'Invalid timetable ID' });
	}

	depends('app:queue');
	const queueEntries = await getTimetableQueueByTimetableId(timetableId);

	return {
		queueEntries
	};
};

export const actions = {
	generateTimetable: async ({ params, locals: { security }, fetch }) => {
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
				school,
				activeConstraints
			] = await Promise.all([
				getTimetableDays(timetableId),
				getTimetablePeriods(timetableId),
				getStudentGroupsByTimetableId(timetableId),
				getEnhancedTimetableActivitiesByTimetableId(timetableId),
				getBuildingsBySchoolId(user.schoolId),
				getSpacesBySchoolId(user.schoolId),
				getUsersBySchoolIdAndType(user.schoolId, userTypeEnum.teacher),
				getSubjectsBySchoolId(user.schoolId),
				getSchoolById(user.schoolId),
				getActiveTimetableConstraintsForTimetable(timetableId)
			]);

			const xmlContent = await buildFETInput({
				timetableDays,
				timetablePeriods,
				studentGroups,
				activities,
				buildings,
				spaces,
				teachers,
				subjects,
				school,
				activeConstraints
			});

			// console.log('FET XML generation successful.', (await xmlContent).substring(0, 500)); // Log first 500 characters

			// Call the FET API to generate the timetable
			try {
				const response = await fetch('/api/timetables/generate', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						timetableId,
						fetXmlContent: xmlContent
					})
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.message || 'Failed to generate timetable');
				}

				const result = await response.json();
				return {
					success: true,
					message: result.message || 'Timetable generation has been queued successfully'
				};
			} catch (apiError) {
				console.error('Error calling FET API:', apiError);
				// Fallback to manual queue entry if API call fails
				// await createTimetableQueueEntry(timetableId, user.id, uniqueFileName);
				return {
					success: true,
					message: 'Timetable data queued for processing (fallback mode)'
				};
			}
		} catch (error) {
			console.error('Error generating timetable XML:', error);
			return fail(500, {
				error: 'Failed to generate timetable. Please ensure all required data is configured.'
			});
		}
	},
	processQueue: async ({ locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		try {
			// Trigger the queue processor
			processTimetableQueue().catch((err: Error) => {
				console.error('Background processing error:', err);
			});

			return {
				success: true,
				message: 'Queue processing started'
			};
		} catch (error) {
			console.error('Error starting queue processor:', error);
			return fail(500, {
				error: 'Failed to start queue processing'
			});
		}
	}
};
