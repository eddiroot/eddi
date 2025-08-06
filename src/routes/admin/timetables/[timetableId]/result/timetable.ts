export interface TeacherStatistic {
	id: string;
	name: string;
	hoursPerWeek: number;
	freeDays: number;
	totalGaps: number;
	minGapsPerDay: number;
	maxGapsPerDay: number;
	minHoursPerDay: number;
	maxHoursPerDay: number;
}

export type TeacherStatistics = TeacherStatistic[];

// Student Statistics Types
export interface StudentOverallStatistics {
	sum: {
		hoursPerWeek: number;
		freeDays: number;
		gaps: number;
	};
	average: {
		hoursPerWeek: number;
		freeDays: number;
		gaps: number;
	};
	min: {
		hoursPerWeek: number;
		freeDays: number;
		gaps: number;
		gapsPerDay: number;
		hoursPerDay: number;
	};
	max: {
		hoursPerWeek: number;
		freeDays: number;
		gaps: number;
		gapsPerDay: number;
		hoursPerDay: number;
	};
}

export interface YearLevelStatistic {
	year: string; // e.g., "S1", "S2", etc.
	minHoursPerWeek: number;
	maxHoursPerWeek: number;
	minFreeDays: number;
	maxFreeDays: number;
	minHoursPerDay: number;
	maxHoursPerDay: number;
	minGapsPerWeek: number;
	maxGapsPerWeek: number;
	minGapsPerDay: number;
	maxGapsPerDay: number;
}

export interface GroupStatistic {
	group: string; // e.g., "1A", "2B", etc.
	minHoursPerWeek: number;
	maxHoursPerWeek: number;
	minFreeDays: number;
	maxFreeDays: number;
	minHoursPerDay: number;
	maxHoursPerDay: number;
	minGapsPerWeek: number;
	maxGapsPerWeek: number;
	minGapsPerDay: number;
	maxGapsPerDay: number;
}

export interface SubgroupStatistic {
	subgroup: string; // e.g., "1AGp1", "4A-LS1", etc.
	hoursPerWeek: number;
	freeDays: number;
	totalGaps: number;
	minGapsPerDay: number;
	maxGapsPerDay: number;
	minHoursPerDay: number;
	maxHoursPerDay: number;
}

export interface TimetableMetadata {
	institutionName: string;
	comments: string;
	generatedWith: string;
	generatedAt: string;
}

export interface StudentStatisticsReport {
	metadata: TimetableMetadata;
	overall: StudentOverallStatistics;
	yearLevels: YearLevelStatistic[];
	groups: GroupStatistic[];
	subgroups: SubgroupStatistic[];
}

export type YearLevelStatistics = YearLevelStatistic[];
export type GroupStatistics = GroupStatistic[];
export type SubgroupStatistics = SubgroupStatistic[];

// Teacher Overall Statistics (similar to student overall stats)
export interface TeacherOverallStatistics {
	sum: {
		hoursPerWeek: number;
		freeDays: number;
		gaps: number;
	};
	average: {
		hoursPerWeek: number;
		freeDays: number;
		gaps: number;
	};
	min: {
		hoursPerWeek: number;
		freeDays: number;
		gaps: number;
		gapsPerDay: number;
		hoursPerDay: number;
	};
	max: {
		hoursPerWeek: number;
		freeDays: number;
		gaps: number;
		gapsPerDay: number;
		hoursPerDay: number;
	};
}

export interface TeacherStatisticsReport {
	metadata: TimetableMetadata;
	overall: TeacherOverallStatistics;
	teachers: TeacherStatistics;
}

// HTML Parser Functions
export class TimetableHtmlParser {
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
	 * Parses teacher statistics HTML and returns an array of TeacherStatistic objects
	 */
	static async parseTeacherStatistics(htmlContent: string): Promise<TeacherStatistics> {
		const doc = await this.parseHTML(htmlContent);

		// Find the table with individual teacher data (second table with border="1")
		const tables = doc.querySelectorAll('table[border="1"]');
		const teacherTable = tables[1]; // Second table contains individual teacher data

		if (!teacherTable) {
			throw new Error('Teacher statistics table not found in HTML');
		}

		const teachers: TeacherStatistics = [];
		const rows = teacherTable.querySelectorAll('tbody tr, tr');

		// Skip header row and footer row
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const cells = row.querySelectorAll('th, td');

			// Skip header row (has "Teacher" header) and footer row (has class "foot")
			if (
				cells.length < 8 ||
				row.classList.contains('foot') ||
				cells[0]?.textContent?.trim() === 'Teacher'
			) {
				continue;
			}

			// Extract teacher data from row
			const teacherId = cells[0]?.textContent?.trim();
			if (!teacherId || !teacherId.startsWith('T')) {
				continue; // Skip if not a valid teacher ID
			}

			try {
				const teacher: TeacherStatistic = {
					id: teacherId,
					name: `Teacher ${teacherId.substring(1).padStart(3, '0')}`, // Generate name from ID
					hoursPerWeek: parseInt(cells[1]?.textContent?.trim() || '0'),
					freeDays: parseInt(cells[2]?.textContent?.trim() || '0'),
					totalGaps: parseInt(cells[3]?.textContent?.trim() || '0'),
					minGapsPerDay: parseInt(cells[4]?.textContent?.trim() || '0'),
					maxGapsPerDay: parseInt(cells[5]?.textContent?.trim() || '0'),
					minHoursPerDay: parseInt(cells[6]?.textContent?.trim() || '0'),
					maxHoursPerDay: parseInt(cells[7]?.textContent?.trim() || '0')
				};

				teachers.push(teacher);
			} catch (error) {
				console.warn(`Failed to parse teacher row for ${teacherId}:`, error);
			}
		}

		return teachers;
	}

	/**
	 * Parses teacher overall statistics from HTML
	 */
	static async parseTeacherOverallStatistics(
		htmlContent: string
	): Promise<TeacherOverallStatistics> {
		const doc = await this.parseHTML(htmlContent);

		// Find the first table with border="1" (contains overall statistics)
		const overallTable = doc.querySelector('table[border="1"]');

		if (!overallTable) {
			throw new Error('Teacher overall statistics table not found in HTML');
		}

		const rows = overallTable.querySelectorAll('tr');
		const data: Partial<TeacherOverallStatistics> = {};

		for (const row of rows) {
			const cells = row.querySelectorAll('th, td');
			if (cells.length < 2) continue;

			const rowType = cells[0]?.textContent?.trim().toLowerCase();
			if (!rowType || rowType === 'all teachers') continue;

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

		return data as TeacherOverallStatistics;
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
	 * Parses complete teacher statistics report from HTML
	 */
	static async parseTeacherStatisticsReport(htmlContent: string): Promise<TeacherStatisticsReport> {
		return {
			metadata: await this.parseMetadata(htmlContent),
			overall: await this.parseTeacherOverallStatistics(htmlContent),
			teachers: await this.parseTeacherStatistics(htmlContent)
		};
	}
}
