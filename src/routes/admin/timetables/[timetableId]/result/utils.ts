import {
	TimetableHtmlParser,
	type GroupStatistic,
	type StudentOverallStatistics,
	type StudentStatisticsReport,
	type SubgroupStatistic,
	type TeacherStatistics,
	type TeacherStatisticsReport,
	type TimetableMetadata,
	type YearLevelStatistic
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
					minHoursPerWeek: parseInt(cells[1]?.textContent?.trim() || '0', 10),
					maxHoursPerWeek: parseInt(cells[2]?.textContent?.trim() || '0', 10),
					minFreeDays: parseInt(cells[3]?.textContent?.trim() || '0', 10),
					maxFreeDays: parseInt(cells[4]?.textContent?.trim() || '0', 10),
					minHoursPerDay: parseInt(cells[5]?.textContent?.trim() || '0', 10),
					maxHoursPerDay: parseInt(cells[6]?.textContent?.trim() || '0', 10),
					minGapsPerWeek: parseInt(cells[7]?.textContent?.trim() || '0', 10),
					maxGapsPerWeek: parseInt(cells[8]?.textContent?.trim() || '0', 10),
					minGapsPerDay: parseInt(cells[9]?.textContent?.trim() || '0', 10),
					maxGapsPerDay: parseInt(cells[10]?.textContent?.trim() || '0', 10)
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
					minHoursPerWeek: parseInt(cells[1]?.textContent?.trim() || '0', 10),
					maxHoursPerWeek: parseInt(cells[2]?.textContent?.trim() || '0', 10),
					minFreeDays: parseInt(cells[3]?.textContent?.trim() || '0', 10),
					maxFreeDays: parseInt(cells[4]?.textContent?.trim() || '0', 10),
					minHoursPerDay: parseInt(cells[5]?.textContent?.trim() || '0', 10),
					maxHoursPerDay: parseInt(cells[6]?.textContent?.trim() || '0', 10),
					minGapsPerWeek: parseInt(cells[7]?.textContent?.trim() || '0', 10),
					maxGapsPerWeek: parseInt(cells[8]?.textContent?.trim() || '0', 10),
					minGapsPerDay: parseInt(cells[9]?.textContent?.trim() || '0', 10),
					maxGapsPerDay: parseInt(cells[10]?.textContent?.trim() || '0', 10)
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
					hoursPerWeek: parseInt(cells[1]?.textContent?.trim() || '0', 10),
					freeDays: parseInt(cells[2]?.textContent?.trim() || '0', 10),
					totalGaps: parseInt(cells[3]?.textContent?.trim() || '0', 10),
					minGapsPerDay: parseInt(cells[4]?.textContent?.trim() || '0', 10),
					maxGapsPerDay: parseInt(cells[5]?.textContent?.trim() || '0', 10),
					minHoursPerDay: parseInt(cells[6]?.textContent?.trim() || '0', 10),
					maxHoursPerDay: parseInt(cells[7]?.textContent?.trim() || '0', 10)
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

// Transform processStatistics output to report formats
interface UserStatistics {
	userId: string;
	userName: string;
	userType: string;
	totalHoursPerCycle: number;
	averageHoursPerDay: number;
	maxHoursPerDay: number;
	minHoursPerDay: number;
	numberOfFreeDays: number;
	dailyHours: Map<number, number>;
}

interface TimetableStatistics {
	timetableId: number;
	iterationId: number;
	totalDays: number;
	totalPeriods: number;
	userStatistics: UserStatistics[];
	generatedAt: Date;
}

export function transformToTeacherStatisticsReport(
	statistics: TimetableStatistics,
	timetableName: string
): TeacherStatisticsReport {
	// Filter teacher statistics
	const teacherStats = statistics.userStatistics.filter((u) => u.userType === 'teacher');

	// Transform to TeacherStatistic format
	const teachers: TeacherStatistics = teacherStats.map((t) => ({
		id: t.userId,
		name: t.userName,
		hoursPerWeek: t.totalHoursPerCycle,
		freeDays: t.numberOfFreeDays,
		totalGaps: 0, // Not calculated in processStatistics yet
		minGapsPerDay: 0, // Not calculated in processStatistics yet
		maxGapsPerDay: 0, // Not calculated in processStatistics yet
		minHoursPerDay: t.minHoursPerDay,
		maxHoursPerDay: t.maxHoursPerDay
	}));

	// Calculate overall statistics
	const overall = calculateTeacherOverallStatistics(teachers);

	// Create metadata
	const metadata: TimetableMetadata = {
		institutionName: timetableName,
		comments: 'Statistics generated from database',
		generatedWith: 'EDDI Timetabling System',
		generatedAt: statistics.generatedAt.toISOString()
	};

	return {
		metadata,
		overall,
		teachers
	};
}

export function transformToStudentStatisticsReport(
	statistics: TimetableStatistics,
	timetableName: string
): StudentStatisticsReport {
	// Filter student statistics
	const studentStats = statistics.userStatistics.filter((u) => u.userType === 'student');

	// Calculate overall statistics
	const overall = calculateStudentOverallStatistics(studentStats);

	// Group by year level (extract from userId - assuming format like S1234 where S is year)
	const yearLevelMap = new Map<string, UserStatistics[]>();
	const groupMap = new Map<string, UserStatistics[]>();

	for (const student of studentStats) {
		// Extract year from userId (e.g., Y10_S1234 -> Y10)
		const yearMatch = student.userId.match(/^Y(\d+)/);
		if (yearMatch) {
			const year = `Y${yearMatch[1]}`;
			if (!yearLevelMap.has(year)) {
				yearLevelMap.set(year, []);
			}
			yearLevelMap.get(year)!.push(student);
		}

		// Extract group from userId (e.g., G1A_S1234 -> 1A)
		const groupMatch = student.userId.match(/^G([^_]+)/);
		if (groupMatch) {
			const group = groupMatch[1];
			if (!groupMap.has(group)) {
				groupMap.set(group, []);
			}
			groupMap.get(group)!.push(student);
		}
	}

	// Calculate year level statistics
	const yearLevels: YearLevelStatistic[] = Array.from(yearLevelMap.entries()).map(
		([year, students]) => {
			const hoursPerWeek = students.map((s) => s.totalHoursPerCycle);
			const freeDays = students.map((s) => s.numberOfFreeDays);
			const hoursPerDay = students.map((s) => s.maxHoursPerDay);

			return {
				year,
				minHoursPerWeek: Math.min(...hoursPerWeek),
				maxHoursPerWeek: Math.max(...hoursPerWeek),
				minFreeDays: Math.min(...freeDays),
				maxFreeDays: Math.max(...freeDays),
				minHoursPerDay: Math.min(...students.map((s) => s.minHoursPerDay)),
				maxHoursPerDay: Math.max(...hoursPerDay),
				minGapsPerWeek: 0, // Not calculated yet
				maxGapsPerWeek: 0, // Not calculated yet
				minGapsPerDay: 0, // Not calculated yet
				maxGapsPerDay: 0 // Not calculated yet
			};
		}
	);

	// Calculate group statistics
	const groups: GroupStatistic[] = Array.from(groupMap.entries()).map(([group, students]) => {
		const hoursPerWeek = students.map((s) => s.totalHoursPerCycle);
		const freeDays = students.map((s) => s.numberOfFreeDays);
		const hoursPerDay = students.map((s) => s.maxHoursPerDay);

		return {
			group,
			minHoursPerWeek: Math.min(...hoursPerWeek),
			maxHoursPerWeek: Math.max(...hoursPerWeek),
			minFreeDays: Math.min(...freeDays),
			maxFreeDays: Math.max(...freeDays),
			minHoursPerDay: Math.min(...students.map((s) => s.minHoursPerDay)),
			maxHoursPerDay: Math.max(...hoursPerDay),
			minGapsPerWeek: 0, // Not calculated yet
			maxGapsPerWeek: 0, // Not calculated yet
			minGapsPerDay: 0, // Not calculated yet
			maxGapsPerDay: 0 // Not calculated yet
		};
	});

	// For subgroups, treat each student as a subgroup for now
	const subgroups: SubgroupStatistic[] = studentStats.map((s) => ({
		subgroup: s.userId,
		hoursPerWeek: s.totalHoursPerCycle,
		freeDays: s.numberOfFreeDays,
		totalGaps: 0, // Not calculated yet
		minGapsPerDay: 0, // Not calculated yet
		maxGapsPerDay: 0, // Not calculated yet
		minHoursPerDay: s.minHoursPerDay,
		maxHoursPerDay: s.maxHoursPerDay
	}));

	// Create metadata
	const metadata: TimetableMetadata = {
		institutionName: timetableName,
		comments: 'Statistics generated from database',
		generatedWith: 'EDDI Timetabling System',
		generatedAt: statistics.generatedAt.toISOString()
	};

	return {
		metadata,
		overall,
		yearLevels,
		groups,
		subgroups
	};
}

function calculateTeacherOverallStatistics(teachers: TeacherStatistics) {
	if (teachers.length === 0) {
		return {
			sum: { hoursPerWeek: 0, freeDays: 0, gaps: 0 },
			average: { hoursPerWeek: 0, freeDays: 0, gaps: 0 },
			min: { hoursPerWeek: 0, freeDays: 0, gaps: 0, gapsPerDay: 0, hoursPerDay: 0 },
			max: { hoursPerWeek: 0, freeDays: 0, gaps: 0, gapsPerDay: 0, hoursPerDay: 0 }
		};
	}

	const sum = {
		hoursPerWeek: teachers.reduce((acc, t) => acc + t.hoursPerWeek, 0),
		freeDays: teachers.reduce((acc, t) => acc + t.freeDays, 0),
		gaps: teachers.reduce((acc, t) => acc + t.totalGaps, 0)
	};

	const average = {
		hoursPerWeek: sum.hoursPerWeek / teachers.length,
		freeDays: sum.freeDays / teachers.length,
		gaps: sum.gaps / teachers.length
	};

	const min = {
		hoursPerWeek: Math.min(...teachers.map((t) => t.hoursPerWeek)),
		freeDays: Math.min(...teachers.map((t) => t.freeDays)),
		gaps: Math.min(...teachers.map((t) => t.totalGaps)),
		gapsPerDay: Math.min(...teachers.map((t) => t.minGapsPerDay)),
		hoursPerDay: Math.min(...teachers.map((t) => t.minHoursPerDay))
	};

	const max = {
		hoursPerWeek: Math.max(...teachers.map((t) => t.hoursPerWeek)),
		freeDays: Math.max(...teachers.map((t) => t.freeDays)),
		gaps: Math.max(...teachers.map((t) => t.totalGaps)),
		gapsPerDay: Math.max(...teachers.map((t) => t.maxGapsPerDay)),
		hoursPerDay: Math.max(...teachers.map((t) => t.maxHoursPerDay))
	};

	return { sum, average, min, max };
}

function calculateStudentOverallStatistics(students: UserStatistics[]): StudentOverallStatistics {
	if (students.length === 0) {
		return {
			sum: { hoursPerWeek: 0, freeDays: 0, gaps: 0 },
			average: { hoursPerWeek: 0, freeDays: 0, gaps: 0 },
			min: { hoursPerWeek: 0, freeDays: 0, gaps: 0, gapsPerDay: 0, hoursPerDay: 0 },
			max: { hoursPerWeek: 0, freeDays: 0, gaps: 0, gapsPerDay: 0, hoursPerDay: 0 }
		};
	}

	const sum = {
		hoursPerWeek: students.reduce((acc, s) => acc + s.totalHoursPerCycle, 0),
		freeDays: students.reduce((acc, s) => acc + s.numberOfFreeDays, 0),
		gaps: 0 // Not calculated yet
	};

	const average = {
		hoursPerWeek: sum.hoursPerWeek / students.length,
		freeDays: sum.freeDays / students.length,
		gaps: 0 // Not calculated yet
	};

	const min = {
		hoursPerWeek: Math.min(...students.map((s) => s.totalHoursPerCycle)),
		freeDays: Math.min(...students.map((s) => s.numberOfFreeDays)),
		gaps: 0, // Not calculated yet
		gapsPerDay: 0, // Not calculated yet
		hoursPerDay: Math.min(...students.map((s) => s.minHoursPerDay))
	};

	const max = {
		hoursPerWeek: Math.max(...students.map((s) => s.totalHoursPerCycle)),
		freeDays: Math.max(...students.map((s) => s.numberOfFreeDays)),
		gaps: 0, // Not calculated yet
		gapsPerDay: 0, // Not calculated yet
		hoursPerDay: Math.max(...students.map((s) => s.maxHoursPerDay))
	};

	return { sum, average, min, max };
}
