import {
	getCompletedIterationsByTimetableId,
	getTimetableWithSchool
} from '$lib/server/db/service';
import { error } from '@sveltejs/kit';
import { processStatistics } from '../../../../../scripts/processStatistics';
import type { PageServerLoad } from './$types';
import { transformToStudentStatisticsReport, transformToTeacherStatisticsReport } from './utils';

export const load: PageServerLoad = async ({ params, url, locals: { security } }) => {
	security.isAuthenticated().isSchoolAdmin();

	const timetableId = parseInt(params.timetableId);
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

			return {
				timetableId: params.timetableId,
				teacherStatisticsReport,
				studentStatisticsReport,
				completedIterations,
				selectedIterationId: iterationId
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

		const timetableId = parseInt(params.timetableId);
		const formData = await request.formData();
		const iterationId = parseInt(formData.get('iterationId') as string);

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
	}
};
