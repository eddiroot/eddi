import {
	getCompletedIterationsByTimetableId,
	getTimetableWithSchool
} from '$lib/server/db/service';
import { getFileFromStorage } from '$lib/server/obj';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { StudentStatisticsReport, TeacherStatisticsReport } from './timetable';
import { TimetableHtmlParser } from './timetable';
import { StudentStatisticsParser } from './utils';

export const load: PageServerLoad = async ({ params, url, locals: { security } }) => {
	security.isAuthenticated().isSchoolAdmin();

	const timetableId = parseInt(params.timetableId);
	if (isNaN(timetableId)) {
		throw error(400, 'Invalid timetable ID');
	}

	try {
		// Get completed iterations for this timetable
		const completedIterations = await getCompletedIterationsByTimetableId(timetableId);

		if (completedIterations.length === 0) {
			throw error(404, {
				message: 'No completed timetable iterations found'
			});
		}

		// Get iteration ID from URL or use the most recent one
		const iterationIdParam = url.searchParams.get('iterationId');
		const selectedIteration = iterationIdParam
			? completedIterations.find((i) => i.iterationId.toString() === iterationIdParam)
			: completedIterations[completedIterations.length - 1]; // Most recent

		if (!selectedIteration) {
			throw error(404, {
				message: 'Selected iteration not found'
			});
		}

		// Get timetable with school info
		const timetableWithSchool = await getTimetableWithSchool(timetableId);
		if (!timetableWithSchool) {
			throw error(404, 'Timetable not found');
		}

		const { school } = timetableWithSchool;
		const iterationId = selectedIteration.iterationId;

		// Construct file names based on the pattern: {iteration_id}_tt_{timetable_id}_*.html
		const teacherStatsFileName = `${iterationId}_tt_id${timetableId}_teachers_statistics.html`;
		const studentStatsFileName = `${iterationId}_tt_id${timetableId}_students_statistics.html`;

		try {
			// Fetch files from object storage
			const [teacherHtmlBuffer, studentHtmlBuffer] = await Promise.all([
				getFileFromStorage(
					school.id.toString(),
					timetableId.toString(),
					teacherStatsFileName,
					false, // output directory
					iterationId.toString()
				),
				getFileFromStorage(
					school.id.toString(),
					timetableId.toString(),
					studentStatsFileName,
					false, // output directory
					iterationId.toString()
				)
			]);

			// Convert buffers to strings
			const teacherHtmlContent = teacherHtmlBuffer.toString('utf-8');
			const studentHtmlContent = studentHtmlBuffer.toString('utf-8');

			// Parse both HTML files using their respective parsers
			const teacherStatisticsReport: TeacherStatisticsReport =
				await TimetableHtmlParser.parseTeacherStatisticsReport(teacherHtmlContent);

			const studentStatisticsReport: StudentStatisticsReport =
				await StudentStatisticsParser.parseStudentStatisticsReport(studentHtmlContent);

			return {
				timetableId: params.timetableId,
				teacherStatisticsReport,
				studentStatisticsReport,
				completedIterations,
				selectedIterationId: iterationId
			};
		} catch (fileError) {
			console.error('Failed to load statistics files from object storage:', fileError);
			throw error(500, {
				message: 'Failed to load statistics files. The timetable may not have been fully generated.'
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
			// Get completed iterations for this timetable
			const completedIterations = await getCompletedIterationsByTimetableId(timetableId);

			// Find the selected iteration
			const selectedIteration = completedIterations.find((i) => i.iterationId === iterationId);

			if (!selectedIteration) {
				throw error(404, 'Iteration not found');
			}

			// Get timetable with school info
			const timetableWithSchool = await getTimetableWithSchool(timetableId);
			if (!timetableWithSchool) {
				throw error(404, 'Timetable not found');
			}

			const { school } = timetableWithSchool;

			// Construct file names
			const teacherStatsFileName = `${iterationId}_tt_id${timetableId}_teachers_statistics.html`;
			const studentStatsFileName = `${iterationId}_tt_id${timetableId}_students_statistics.html`;

			// Fetch files from object storage
			const [teacherHtmlBuffer, studentHtmlBuffer] = await Promise.all([
				getFileFromStorage(
					school.id.toString(),
					timetableId.toString(),
					teacherStatsFileName,
					false,
					iterationId.toString()
				),
				getFileFromStorage(
					school.id.toString(),
					timetableId.toString(),
					studentStatsFileName,
					false,
					iterationId.toString()
				)
			]);

			// Convert buffers to strings
			const teacherHtmlContent = teacherHtmlBuffer.toString('utf-8');
			const studentHtmlContent = studentHtmlBuffer.toString('utf-8');

			// Parse both HTML files
			const teacherStatisticsReport: TeacherStatisticsReport =
				await TimetableHtmlParser.parseTeacherStatisticsReport(teacherHtmlContent);

			const studentStatisticsReport: StudentStatisticsReport =
				await StudentStatisticsParser.parseStudentStatisticsReport(studentHtmlContent);

			return {
				success: true,
				teacherStatisticsReport,
				studentStatisticsReport,
				completedIterations,
				selectedIterationId: iterationId
			};
		} catch (err) {
			console.error('Failed to load statistics for iteration:', err);
			throw error(500, {
				message: 'Failed to load statistics files'
			});
		}
	}
};
