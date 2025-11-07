import {
	getCompletedIterationsByTimetableId,
	getSpaceFETActivitiesByIterationId,
	getSpacesBySchoolId,
	getTimetableDays,
	getTimetablePeriods,
	getTimetableWithSchool,
	getUserFETActivitiesByIterationId,
	getUsersBySchoolId
} from '$lib/server/db/service';
import { error } from '@sveltejs/kit';
import { processStatistics } from '../../../../../scripts/process/statistics';
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
		const timetableWithSchool = await getTimetableWithSchool(timetableId);
		if (!timetableWithSchool) {
			throw error(404, 'Timetable not found');
		}

		// Get completed drafts for this timetable
		const completedIterations = await getCompletedIterationsByTimetableId(timetableId);

		if (completedIterations.length === 0) {
			throw error(
				404,
				`No generated timetables found. The timetable "${timetableWithSchool.timetable.name}" has not been generated yet. Please generate the timetable first before viewing results.`
			);
		}

		// Get draft ID from URL or use the most recent one
		const ttDraftIdParam = url.searchParams.get('ttDraftId');
		const selectedIteration = ttDraftIdParam
			? completedIterations.find((i) => i.ttDraftId.toString() === ttDraftIdParam)
			: completedIterations[completedIterations.length - 1]; // Most recent

		if (!selectedIteration) {
			throw error(404, 'Selected draft not found');
		}

		const ttDraftId = selectedIteration.ttDraftId;

		try {
			// Process statistics from database
			const statistics = await processStatistics(timetableId, ttDraftId);

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
				completedIterations,
				selectedIterationId: ttDraftId,
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
	changeIteration: async ({ params, request, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		const timetableId = parseInt(params.timetableId, 10);
		const formData = await request.formData();
		const ttDraftId = parseInt(formData.get('ttDraftId') as string);

		if (isNaN(timetableId) || isNaN(ttDraftId)) {
			throw error(400, 'Invalid parameters');
		}

		try {
			// Get timetable with school info first
			const timetableWithSchool = await getTimetableWithSchool(timetableId);
			if (!timetableWithSchool) {
				throw error(404, 'Timetable not found');
			}

			// Get completed drafts for this timetable
			const completedIterations = await getCompletedIterationsByTimetableId(timetableId);

			if (completedIterations.length === 0) {
				throw error(
					404,
					`No generated timetables found. The timetable "${timetableWithSchool.timetable.name}" has not been generated yet. Please generate the timetable first before viewing results.`
				);
			}

			// Find the selected draft
			const selectedIteration = completedIterations.find((i) => i.ttDraftId === ttDraftId);

			if (!selectedIteration) {
				throw error(404, 'Iteration not found');
			}

			// Process statistics from database
			const statistics = await processStatistics(timetableId, ttDraftId);

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
				completedIterations,
				selectedIterationId: ttDraftId
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
		const ttDraftId = parseInt(formData.get('ttDraftId') as string);

		if (isNaN(timetableId) || !userId || isNaN(ttDraftId)) {
			throw error(400, 'Invalid parameters');
		}

		try {
			const [activities, timetableDays, timetablePeriods] = await Promise.all([
				getUserFETActivitiesByIterationId(userId, ttDraftId),
				getTimetableDays(timetableId),
				getTimetablePeriods(timetableId)
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
		const ttDraftId = parseInt(formData.get('ttDraftId') as string);

		if (isNaN(timetableId) || isNaN(spaceId) || isNaN(ttDraftId)) {
			throw error(400, 'Invalid parameters');
		}

		try {
			const [activities, timetableDays, timetablePeriods] = await Promise.all([
				getSpaceFETActivitiesByIterationId(spaceId, ttDraftId),
				getTimetableDays(timetableId),
				getTimetablePeriods(timetableId)
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
