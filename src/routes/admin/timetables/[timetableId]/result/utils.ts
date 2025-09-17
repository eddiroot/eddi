import {
	TimetableHtmlParser,
	type TeacherStatistics,
	type TeacherStatisticsReport,
	type StudentStatisticsReport,
	type StudentOverallStatistics,
	type YearLevelStatistic,
	type GroupStatistic,
	type SubgroupStatistic,
	type TimetableMetadata
} from './timetable';

/**
 * Parser specifically for student statistics HTML files
 */
export class StudentStatisticsParser {
	/**
	 * Creates a DOM document from HTML content (works in both browser and Node.js)
	 */
	private static async parseHTML(htmlContent: string): Promise<Document> {
		// Check if we're in a browser environment
		if (typeof DOMParser !== 'undefined') {
			const parser = new DOMParser();
			return parser.parseFromString(htmlContent, 'text/html');
		}

		// Server-side: use jsdom
		const { JSDOM } = await import('jsdom');
		const dom = new JSDOM(htmlContent);
		return dom.window.document;
	}

	/**
	 * Parses student overall statistics from HTML (first table)
	 */
	static async parseStudentOverallStatistics(
		htmlContent: string
	): Promise<StudentOverallStatistics> {
		const doc = await this.parseHTML(htmlContent);

		// Find the first table with border="1" (contains overall statistics)
		const overallTable = doc.querySelector('table[border="1"]');

		if (!overallTable) {
			throw new Error('Student overall statistics table not found in HTML');
		}

		const rows = overallTable.querySelectorAll('tr');
		const data: Partial<StudentOverallStatistics> = {};

		for (const row of rows) {
			const cells = row.querySelectorAll('th, td');
			if (cells.length < 2) continue;

			const rowType = cells[0]?.textContent?.trim().toLowerCase();
			if (!rowType || rowType === 'all students') continue;

			const values = Array.from(cells)
				.slice(1)
				.map((cell) => {
					const text = cell.textContent?.trim() || '';
					return text === '---' ? null : parseFloat(text) || 0;
				});

			if (rowType === 'sum') {
				data.sum = {
					hoursPerWeek: values[0] || 0,
					freeDays: values[1] || 0,
					gaps: values[2] || 0
				};
			} else if (rowType === 'average') {
				data.average = {
					hoursPerWeek: values[0] || 0,
					freeDays: values[1] || 0,
					gaps: values[2] || 0
				};
			} else if (rowType === 'min') {
				data.min = {
					hoursPerWeek: values[0] || 0,
					freeDays: values[1] || 0,
					gaps: values[2] || 0,
					gapsPerDay: values[3] || 0,
					hoursPerDay: values[4] || 0
				};
			} else if (rowType === 'max') {
				data.max = {
					hoursPerWeek: values[0] || 0,
					freeDays: values[1] || 0,
					gaps: values[2] || 0,
					gapsPerDay: values[3] || 0,
					hoursPerDay: values[4] || 0
				};
			}
		}

		return data as StudentOverallStatistics;
	}

	/**
	 * Parses year level statistics from HTML (second table)
	 */
	static async parseYearLevelStatistics(htmlContent: string): Promise<YearLevelStatistic[]> {
		const doc = await this.parseHTML(htmlContent);

		// Find all tables with border="1"
		const tables = doc.querySelectorAll('table[border="1"]');
		const yearTable = tables[1]; // Second table contains year level data

		if (!yearTable) {
			throw new Error('Year level statistics table not found in HTML');
		}

		const yearLevels: YearLevelStatistic[] = [];
		const rows = yearTable.querySelectorAll('tr');

		for (const row of rows) {
			const cells = row.querySelectorAll('th, td');

			// Skip header row and footer row
			if (
				cells.length < 11 ||
				row.classList.contains('foot') ||
				cells[0]?.textContent?.trim() === 'Year'
			) {
				continue;
			}

			const yearId = cells[0]?.textContent?.trim();
			if (!yearId || !yearId.startsWith('S')) {
				continue; // Skip if not a valid year ID
			}

			try {
				const yearLevel: YearLevelStatistic = {
					year: yearId,
					minHoursPerWeek: parseInt(cells[1]?.textContent?.trim() || '0'),
					maxHoursPerWeek: parseInt(cells[2]?.textContent?.trim() || '0'),
					minFreeDays: parseInt(cells[3]?.textContent?.trim() || '0'),
					maxFreeDays: parseInt(cells[4]?.textContent?.trim() || '0'),
					minHoursPerDay: parseInt(cells[5]?.textContent?.trim() || '0'),
					maxHoursPerDay: parseInt(cells[6]?.textContent?.trim() || '0'),
					minGapsPerWeek: parseInt(cells[7]?.textContent?.trim() || '0'),
					maxGapsPerWeek: parseInt(cells[8]?.textContent?.trim() || '0'),
					minGapsPerDay: parseInt(cells[9]?.textContent?.trim() || '0'),
					maxGapsPerDay: parseInt(cells[10]?.textContent?.trim() || '0')
				};

				yearLevels.push(yearLevel);
			} catch (error) {
				console.warn(`Failed to parse year level row for ${yearId}:`, error);
			}
		}

		return yearLevels;
	}

	/**
	 * Parses group statistics from HTML (third table)
	 */
	static async parseGroupStatistics(htmlContent: string): Promise<GroupStatistic[]> {
		const doc = await this.parseHTML(htmlContent);

		// Find all tables with border="1"
		const tables = doc.querySelectorAll('table[border="1"]');
		const groupTable = tables[2]; // Third table contains group data

		if (!groupTable) {
			throw new Error('Group statistics table not found in HTML');
		}

		const groups: GroupStatistic[] = [];
		const rows = groupTable.querySelectorAll('tr');

		for (const row of rows) {
			const cells = row.querySelectorAll('th, td');

			// Skip header row and footer row
			if (
				cells.length < 11 ||
				row.classList.contains('foot') ||
				cells[0]?.textContent?.trim() === 'Group'
			) {
				continue;
			}

			const groupId = cells[0]?.textContent?.trim();
			if (!groupId) {
				continue; // Skip if no group ID
			}

			try {
				const group: GroupStatistic = {
					group: groupId,
					minHoursPerWeek: parseInt(cells[1]?.textContent?.trim() || '0'),
					maxHoursPerWeek: parseInt(cells[2]?.textContent?.trim() || '0'),
					minFreeDays: parseInt(cells[3]?.textContent?.trim() || '0'),
					maxFreeDays: parseInt(cells[4]?.textContent?.trim() || '0'),
					minHoursPerDay: parseInt(cells[5]?.textContent?.trim() || '0'),
					maxHoursPerDay: parseInt(cells[6]?.textContent?.trim() || '0'),
					minGapsPerWeek: parseInt(cells[7]?.textContent?.trim() || '0'),
					maxGapsPerWeek: parseInt(cells[8]?.textContent?.trim() || '0'),
					minGapsPerDay: parseInt(cells[9]?.textContent?.trim() || '0'),
					maxGapsPerDay: parseInt(cells[10]?.textContent?.trim() || '0')
				};

				groups.push(group);
			} catch (error) {
				console.warn(`Failed to parse group row for ${groupId}:`, error);
			}
		}

		return groups;
	}

	/**
	 * Parses subgroup statistics from HTML (fourth table)
	 */
	static async parseSubgroupStatistics(htmlContent: string): Promise<SubgroupStatistic[]> {
		const doc = await this.parseHTML(htmlContent);

		// Find all tables with border="1"
		const tables = doc.querySelectorAll('table[border="1"]');
		const subgroupTable = tables[3]; // Fourth table contains subgroup data

		if (!subgroupTable) {
			throw new Error('Subgroup statistics table not found in HTML');
		}

		const subgroups: SubgroupStatistic[] = [];
		const rows = subgroupTable.querySelectorAll('tr');

		for (const row of rows) {
			const cells = row.querySelectorAll('th, td');

			// Skip header row and footer row
			if (
				cells.length < 8 ||
				row.classList.contains('foot') ||
				cells[0]?.textContent?.trim() === 'Subgroup'
			) {
				continue;
			}

			const subgroupId = cells[0]?.textContent?.trim();
			if (!subgroupId) {
				continue; // Skip if no subgroup ID
			}

			try {
				const subgroup: SubgroupStatistic = {
					subgroup: subgroupId,
					hoursPerWeek: parseInt(cells[1]?.textContent?.trim() || '0'),
					freeDays: parseInt(cells[2]?.textContent?.trim() || '0'),
					totalGaps: parseInt(cells[3]?.textContent?.trim() || '0'),
					minGapsPerDay: parseInt(cells[4]?.textContent?.trim() || '0'),
					maxGapsPerDay: parseInt(cells[5]?.textContent?.trim() || '0'),
					minHoursPerDay: parseInt(cells[6]?.textContent?.trim() || '0'),
					maxHoursPerDay: parseInt(cells[7]?.textContent?.trim() || '0')
				};

				subgroups.push(subgroup);
			} catch (error) {
				console.warn(`Failed to parse subgroup row for ${subgroupId}:`, error);
			}
		}

		return subgroups;
	}

	/**
	 * Parses metadata from HTML (institution name, comments, generation info)
	 */
	static async parseMetadata(htmlContent: string): Promise<TimetableMetadata> {
		const doc = await this.parseHTML(htmlContent);

		// Extract institution name
		const institutionRows = doc.querySelectorAll('table tr');
		let institutionName = '';
		let comments = '';

		for (const row of institutionRows) {
			const cells = row.querySelectorAll('th, td');
			if (cells.length >= 2) {
				const header = cells[0]?.textContent?.trim();
				if (header === 'Institution name:') {
					institutionName = cells[1]?.textContent?.trim() || '';
				} else if (header === 'Comments:') {
					comments = cells[1]?.textContent?.trim() || '';
				}
			}
		}

		// Extract generation info from footer
		const footerRow = doc.querySelector('tr.foot td[colspan]');
		const footerText = footerRow?.textContent?.trim() || '';
		const generationMatch = footerText.match(/Timetable generated with (.+?) on (.+)/);

		return {
			institutionName,
			comments,
			generatedWith: generationMatch?.[1] || '',
			generatedAt: generationMatch?.[2] || ''
		};
	}

	/**
	 * Parses complete student statistics report from HTML
	 */
	static async parseStudentStatisticsReport(htmlContent: string): Promise<StudentStatisticsReport> {
		return {
			metadata: await this.parseMetadata(htmlContent),
			overall: await this.parseStudentOverallStatistics(htmlContent),
			yearLevels: await this.parseYearLevelStatistics(htmlContent),
			groups: await this.parseGroupStatistics(htmlContent),
			subgroups: await this.parseSubgroupStatistics(htmlContent)
		};
	}
}

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
