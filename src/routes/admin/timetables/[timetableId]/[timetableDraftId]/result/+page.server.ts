import {
	getCompletedDraftsByTimetableId,
	getSpaceFETActivitiesByTimetableDraftId,
	getSpacesBySchoolId,
	getTimetableAndSchoolByTimetableId,
	getTimetableDraftDaysByTimetableId,
	getTimetableDraftPeriodsByTimetableDraftId,
	getUserFETActivitiesByTimetableDraftId,
	getUsersBySchoolId
} from '$lib/server/db/service';
import { error } from '@sveltejs/kit';
import { processStatistics } from '../../../../../../scripts/process/statistics';
import type { PageServerLoad } from './$types';
import { transformToStudentStatisticsReport, transformToTeacherStatisticsReport } from './utils';

export const load: PageServerLoad = async ({ params, url, locals: { security } }) => {
	security.isAuthenticated().isSchoolAdmin();
	const user = security.getUser();

	const timetableId = parseInt(params.timetableId, 10);
	if (isNaN(timetableId)) {
		throw error(400, 'Invalid timetable ID');
	}

	try {
		// Get timetable with school info first to verify it exists
		const timetableWithSchool = await getTimetableAndSchoolByTimetableId(timetableId);
		if (!timetableWithSchool) {
			throw error(404, 'Timetable not found');
		}

		// Get completed drafts for this timetable
		const completedDrafts = await getCompletedDraftsByTimetableId(timetableId);

		if (completedDrafts.length === 0) {
			throw error(
				404,
				`No generated timetables found. The timetable "${timetableWithSchool.timetable.name}" has not been generated yet. Please generate the timetable first before viewing results.`
			);
		}

		// Get draft ID from URL or use the most recent one
		const timetableDraftIdParam = url.searchParams.get('timetableDraftId');
		const selectedDraft = timetableDraftIdParam
			? completedDrafts.find((i) => i.timetableDraftId.toString() === timetableDraftIdParam)
			: completedDrafts[completedDrafts.length - 1]; // Most recent

		if (!selectedDraft) {
			throw error(404, 'Selected draft not found');
		}

		const timetableDraftId = selectedDraft.timetableDraftId;

		try {
			// Process statistics from database
			const statistics = await processStatistics(timetableDraftId);

			// Transform to report formats
			const teacherStatisticsReport = transformToTeacherStatisticsReport(
				statistics,
				timetableWithSchool.timetable.name
			);

			const studentStatisticsReport = transformToStudentStatisticsReport(
				statistics,
				timetableWithSchool.timetable.name
			);

			// Get all users for the school for the autocomplete
			const allUsers = await getUsersBySchoolId(user.schoolId);

			// Get all spaces for the school
			const allSpaces = await getSpacesBySchoolId(user.schoolId);

			return {
				timetableId: params.timetableId,
				teacherStatisticsReport,
				studentStatisticsReport,
				completedDrafts,
				selectedDraftId: timetableDraftId,
				allUsers,
				allSpaces
			};
		} catch (statisticsError) {
			console.error('Failed to process statistics from database:', statisticsError);
			throw error(500, {
				message: 'Failed to process statistics. The timetable may not have been fully generated.'
			});
		}
	} catch (err) {
		console.error('Failed to load statistics:', err);
		throw error(500, {
			message: 'Failed to load statistics files'
		});
	}
};

export const actions = {
	changeDraft: async ({ params, request, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		const timetableId = parseInt(params.timetableId, 10);
		const formData = await request.formData();
		const timetableDraftId = parseInt(formData.get('timetableDraftId') as string);

		if (isNaN(timetableId) || isNaN(timetableDraftId)) {
			throw error(400, 'Invalid parameters');
		}

		try {
			// Get timetable with school info first
			const timetableWithSchool = await getTimetableAndSchoolByTimetableId(timetableId);
			if (!timetableWithSchool) {
				throw error(404, 'Timetable not found');
			}

			// Get completed drafts for this timetable
			const completedDrafts = await getCompletedDraftsByTimetableId(timetableId);

			if (completedDrafts.length === 0) {
				throw error(
					404,
					`No generated timetables found. The timetable "${timetableWithSchool.timetable.name}" has not been generated yet. Please generate the timetable first before viewing results.`
				);
			}

			// Find the selected draft
			const selectedDraft = completedDrafts.find((i) => i.timetableDraftId === timetableDraftId);

			if (!selectedDraft) {
				throw error(404, 'Draft not found');
			}

			// Process statistics from database
			const statistics = await processStatistics(timetableDraftId);

			// Transform to report formats
			const teacherStatisticsReport = transformToTeacherStatisticsReport(
				statistics,
				timetableWithSchool.timetable.name
			);

			const studentStatisticsReport = transformToStudentStatisticsReport(
				statistics,
				timetableWithSchool.timetable.name
			);

			return {
				success: true,
				teacherStatisticsReport,
				studentStatisticsReport,
				completedDrafts,
				selectedDraftId: timetableDraftId
			};
		} catch (err) {
			console.error('Failed to load statistics for draft:', err);
			throw error(500, 'Failed to process statistics for the selected draft');
		}
	},

	getUserTimetable: async ({ params, request, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		const timetableId = parseInt(params.timetableId, 10);
		const formData = await request.formData();
		const userId = formData.get('userId') as string;
		const timetableDraftId = parseInt(formData.get('timetableDraftId') as string);

		if (isNaN(timetableId) || !userId || isNaN(timetableDraftId)) {
			throw error(400, 'Invalid parameters');
		}

		try {
			const [activities, timetableDays, timetablePeriods] = await Promise.all([
				getUserFETActivitiesByTimetableDraftId(userId, timetableDraftId),
				getTimetableDraftDaysByTimetableId(timetableId),
				getTimetableDraftPeriodsByTimetableDraftId(timetableId)
			]);

			return {
				success: true,
				userActivities: activities,
				selectedUserId: userId,
				timetableDays,
				timetablePeriods
			};
		} catch (err) {
			console.error('Failed to load user timetable:', err);
			throw error(500, 'Failed to load user timetable');
		}
	},

	getSpaceTimetable: async ({ params, request, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		const timetableId = parseInt(params.timetableId, 10);
		const formData = await request.formData();
		const spaceId = parseInt(formData.get('spaceId') as string);
		const timetableDraftId = parseInt(formData.get('timetableDraftId') as string);

		if (isNaN(timetableId) || isNaN(spaceId) || isNaN(timetableDraftId)) {
			throw error(400, 'Invalid parameters');
		}

		try {
			const [activities, timetableDays, timetablePeriods] = await Promise.all([
				getSpaceFETActivitiesByTimetableDraftId(spaceId, timetableDraftId),
				getTimetableDraftDaysByTimetableId(timetableId),
				getTimetableDraftPeriodsByTimetableDraftId(timetableId)
			]);

			return {
				success: true,
				spaceActivities: activities,
				selectedSpaceId: spaceId,
				timetableDays,
				timetablePeriods
			};
		} catch (err) {
			console.error('Failed to load space timetable:', err);
			throw error(500, 'Failed to load space timetable');
		}
	}
};
