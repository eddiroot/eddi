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

		// Get completed iterations for this timetable
		const completedIterations = await getCompletedIterationsByTimetableId(timetableId);

		if (completedIterations.length === 0) {
			throw error(
				404,
				`No generated timetables found. The timetable "${timetableWithSchool.timetable.name}" has not been generated yet. Please generate the timetable first before viewing results.`
			);
		}

		// Get iteration ID from URL or use the most recent one
		const iterationIdParam = url.searchParams.get('iterationId');
		const selectedIteration = iterationIdParam
			? completedIterations.find((i) => i.iterationId.toString() === iterationIdParam)
			: completedIterations[completedIterations.length - 1]; // Most recent

		if (!selectedIteration) {
			throw error(404, 'Selected iteration not found');
		}

		const iterationId = selectedIteration.iterationId;

		try {
			// Process statistics from database
			const statistics = await processStatistics(timetableId, iterationId);

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
				selectedIterationId: iterationId,
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
		const iterationId = parseInt(formData.get('iterationId') as string, 10);

		if (isNaN(timetableId) || isNaN(iterationId)) {
			throw error(400, 'Invalid parameters');
		}

		try {
			// Get timetable with school info first
			const timetableWithSchool = await getTimetableWithSchool(timetableId);
			if (!timetableWithSchool) {
				throw error(404, 'Timetable not found');
			}

			// Get completed iterations for this timetable
			const completedIterations = await getCompletedIterationsByTimetableId(timetableId);

			if (completedIterations.length === 0) {
				throw error(
					404,
					`No generated timetables found. The timetable "${timetableWithSchool.timetable.name}" has not been generated yet. Please generate the timetable first before viewing results.`
				);
			}

			// Find the selected iteration
			const selectedIteration = completedIterations.find((i) => i.iterationId === iterationId);

			if (!selectedIteration) {
				throw error(404, 'Iteration not found');
			}

			// Process statistics from database
			const statistics = await processStatistics(timetableId, iterationId);

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
				selectedIterationId: iterationId
			};
		} catch (err) {
			console.error('Failed to load statistics for iteration:', err);
			throw error(500, 'Failed to process statistics for the selected iteration');
		}
	},

	getUserTimetable: async ({ params, request, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		const timetableId = parseInt(params.timetableId, 10);
		const formData = await request.formData();
		const userId = formData.get('userId') as string;
		const iterationId = parseInt(formData.get('iterationId') as string, 10);

		if (isNaN(timetableId) || !userId || isNaN(iterationId)) {
			throw error(400, 'Invalid parameters');
		}

		try {
			const [activities, timetableDays, timetablePeriods] = await Promise.all([
				getUserFETActivitiesByIterationId(userId, iterationId),
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
		const spaceId = parseInt(formData.get('spaceId') as string, 10);
		const iterationId = parseInt(formData.get('iterationId') as string, 10);

		if (isNaN(timetableId) || isNaN(spaceId) || isNaN(iterationId)) {
			throw error(400, 'Invalid parameters');
		}

		try {
			const [activities, timetableDays, timetablePeriods] = await Promise.all([
				getSpaceFETActivitiesByIterationId(spaceId, iterationId),
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
