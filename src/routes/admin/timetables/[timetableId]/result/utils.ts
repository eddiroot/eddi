import {
	TimetableHtmlParser,
	type TeacherStatistics,
	type TeacherStatisticsReport
} from './timetable';

/**
 * Example usage of the TimetableHtmlParser for teacher statistics
 */
export class TeacherStatisticsService {
	/**
	 * Parse teacher statistics from HTML file content
	 */
	static async parseFromHtmlFile(htmlContent: string): Promise<TeacherStatistics> {
		try {
			return await TimetableHtmlParser.parseTeacherStatistics(htmlContent);
		} catch (error) {
			console.error('Failed to parse teacher statistics:', error);
			throw error;
		}
	}

	/**
	 * Parse complete teacher statistics report from HTML file content
	 */
	static async parseCompleteReport(htmlContent: string): Promise<TeacherStatisticsReport> {
		try {
			return await TimetableHtmlParser.parseTeacherStatisticsReport(htmlContent);
		} catch (error) {
			console.error('Failed to parse teacher statistics report:', error);
			throw error;
		}
	}

	/**
	 * Load and parse teacher statistics from a file path
	 * (This would be used server-side)
	 */
	static async parseFromFile(filePath: string): Promise<TeacherStatistics> {
		try {
			// This would typically use fs.readFile in a Node.js environment
			// For now, it's just a placeholder showing the pattern
			const response = await fetch(filePath);
			const htmlContent = await response.text();
			return this.parseFromHtmlFile(htmlContent);
		} catch (error) {
			console.error('Failed to load and parse teacher statistics file:', error);
			throw error;
		}
	}

	/**
	 * Get teachers with high gap counts (potential issues)
	 */
	static getTeachersWithHighGaps(
		teachers: TeacherStatistics,
		threshold: number = 15
	): TeacherStatistics {
		return teachers.filter((teacher) => teacher.totalGaps > threshold);
	}

	/**
	 * Get teachers with many free days
	 */
	static getTeachersWithFreeDays(teachers: TeacherStatistics): TeacherStatistics {
		return teachers.filter((teacher) => teacher.freeDays > 0);
	}

	/**
	 * Calculate average statistics across all teachers
	 */
	static calculateAverages(teachers: TeacherStatistics) {
		if (teachers.length === 0) return null;

		const totals = teachers.reduce(
			(acc, teacher) => ({
				hoursPerWeek: acc.hoursPerWeek + teacher.hoursPerWeek,
				freeDays: acc.freeDays + teacher.freeDays,
				totalGaps: acc.totalGaps + teacher.totalGaps,
				minGapsPerDay: acc.minGapsPerDay + teacher.minGapsPerDay,
				maxGapsPerDay: acc.maxGapsPerDay + teacher.maxGapsPerDay,
				minHoursPerDay: acc.minHoursPerDay + teacher.minHoursPerDay,
				maxHoursPerDay: acc.maxHoursPerDay + teacher.maxHoursPerDay
			}),
			{
				hoursPerWeek: 0,
				freeDays: 0,
				totalGaps: 0,
				minGapsPerDay: 0,
				maxGapsPerDay: 0,
				minHoursPerDay: 0,
				maxHoursPerDay: 0
			}
		);

		const count = teachers.length;
		return {
			hoursPerWeek: Math.round((totals.hoursPerWeek / count) * 100) / 100,
			freeDays: Math.round((totals.freeDays / count) * 100) / 100,
			totalGaps: Math.round((totals.totalGaps / count) * 100) / 100,
			minGapsPerDay: Math.round((totals.minGapsPerDay / count) * 100) / 100,
			maxGapsPerDay: Math.round((totals.maxGapsPerDay / count) * 100) / 100,
			minHoursPerDay: Math.round((totals.minHoursPerDay / count) * 100) / 100,
			maxHoursPerDay: Math.round((totals.maxHoursPerDay / count) * 100) / 100
		};
	}
}

// Example usage (commented out as it would need actual HTML content):
/*
// Load and parse teacher statistics
const htmlContent = await fetch('/path/to/teacher-statistics.html').then(r => r.text());
const teachers = await TeacherStatisticsService.parseFromHtmlFile(htmlContent);

// Get teachers with issues
const problematicTeachers = TeacherStatisticsService.getTeachersWithHighGaps(teachers, 15);
const teachersWithFreeDays = TeacherStatisticsService.getTeachersWithFreeDays(teachers);

// Calculate averages
const averages = TeacherStatisticsService.calculateAverages(teachers);
console.log('Average teacher statistics:', averages);

// Parse complete report with metadata
const completeReport = await TeacherStatisticsService.parseCompleteReport(htmlContent);
console.log('Institution:', completeReport.metadata.institutionName);
console.log('Generated with:', completeReport.metadata.generatedWith);
console.log('Total teachers:', completeReport.teachers.length);
*/
