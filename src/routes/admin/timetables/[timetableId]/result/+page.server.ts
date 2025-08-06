import { error } from '@sveltejs/kit';
import { readFile } from 'fs/promises';
import { TimetableHtmlParser } from './timetable';
import { StudentStatisticsParser } from './utils';
import type { PageServerLoad } from './$types';
import type { TeacherStatisticsReport, StudentStatisticsReport } from './timetable';

export const load: PageServerLoad = async ({ params }) => {
	try {
		// Paths to the HTML files
		const teacherStatsFilePath =
			'/Users/maxfergie/Documents/projects/eddi/docs/timetabling/example/teachers_statistics.html';
		const studentStatsFilePath =
			'/Users/maxfergie/Documents/projects/eddi/docs/timetabling/example/period_students_statistics.html';

		// Read both HTML files
		const teacherHtmlContent = await readFile(teacherStatsFilePath, 'utf-8');
		const studentHtmlContent = await readFile(studentStatsFilePath, 'utf-8');

		// Parse both HTML files using their respective parsers
		const teacherStatisticsReport: TeacherStatisticsReport =
			await TimetableHtmlParser.parseTeacherStatisticsReport(teacherHtmlContent);

		const studentStatisticsReport: StudentStatisticsReport =
			await StudentStatisticsParser.parseStudentStatisticsReport(studentHtmlContent);

		return {
			timetableId: params.timetableId,
			teacherStatisticsReport,
			studentStatisticsReport
		};
	} catch (err) {
		console.error('Failed to load statistics:', err);
		throw error(500, {
			message: 'Failed to load statistics files'
		});
	}
};
