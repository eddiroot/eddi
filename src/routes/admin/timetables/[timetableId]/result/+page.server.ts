import { error } from '@sveltejs/kit';
import { readFile } from 'fs/promises';
import { TimetableHtmlParser } from './timetable';
import type { PageServerLoad } from './$types';
import type { TeacherStatisticsReport } from './timetable';

export const load: PageServerLoad = async ({ params }) => {
	try {
		// Path to the HTML file relative to the project root
		const htmlFilePath =
			'/Users/maxfergie/Documents/projects/eddi/docs/timetabling/example/teachers_statistics.html';

		// Read the HTML file
		const htmlContent = await readFile(htmlFilePath, 'utf-8');

		// Parse the HTML content using our parser
		const teacherStatisticsReport: TeacherStatisticsReport =
			await TimetableHtmlParser.parseTeacherStatisticsReport(htmlContent);

		return {
			timetableId: params.timetableId,
			teacherStatisticsReport
			// You could also return individual parts if needed:
			// metadata: teacherStatisticsReport.metadata,
			// teacherStatistics: teacherStatisticsReport.teachers,
			// overallStatistics: teacherStatisticsReport.overall
		};
	} catch (err) {
		console.error('Failed to load teacher statistics:', err);
		throw error(500, {
			message: 'Failed to load teacher statistics file'
		});
	}
};
