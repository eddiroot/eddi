import type { CourseMapItem, Subject, LearningArea } from '$lib/server/db/schema';

export interface CurriculumViewData {
	subjects: Subject[];
	courseMapItems: CourseMapItem[];
	learningAreas: LearningArea[];
	selectedSubjectId: number | null;
	selectedYearLevel: string;
	viewMode: 'single' | 'multi';
	academicYear: number;
}

export interface YearLevelOption {
	value: string;
	label: string;
}

export interface TermOption {
	value: number;
	label: string;
	startWeek: number;
	endWeek: number;
}

// Standard academic terms organized by semesters
export const ACADEMIC_TERMS: TermOption[] = [
	{ value: 1, label: 'Term 1', startWeek: 1, endWeek: 9 },
	{ value: 2, label: 'Term 2', startWeek: 10, endWeek: 18 },
	{ value: 3, label: 'Term 3', startWeek: 1, endWeek: 9 },
	{ value: 4, label: 'Term 4', startWeek: 10, endWeek: 18 }
];

export const SEMESTERS = [
	{
		id: 1,
		name: 'Semester 1',
		terms: [1, 2],
		weeks: 18
	},
	{
		id: 2,
		name: 'Semester 2',
		terms: [3, 4],
		weeks: 18
	}
] as const;

export const YEAR_LEVELS: YearLevelOption[] = [
	{ value: 'all', label: 'All Years' },
	{ value: 'F', label: 'Foundation' },
	{ value: '1', label: 'Year 1' },
	{ value: '2', label: 'Year 2' },
	{ value: '3', label: 'Year 3' },
	{ value: '4', label: 'Year 4' },
	{ value: '5', label: 'Year 5' },
	{ value: '6', label: 'Year 6' },
	{ value: '7', label: 'Year 7' },
	{ value: '8', label: 'Year 8' },
	{ value: '9', label: 'Year 9' },
	{ value: '10', label: 'Year 10' }
];

export const F10_YEAR_LEVELS = YEAR_LEVELS.slice(1); // Exclude 'all'

export function getYearLevelLabel(value: string): string {
	const yearLevel = YEAR_LEVELS.find((yl) => yl.value === value);
	return yearLevel?.label || value;
}

export function getYearLevelColor(yearLevel: string): string {
	const colors = {
		F: 'bg-red-100 text-red-800 border-red-200',
		'1': 'bg-orange-100 text-orange-800 border-orange-200',
		'2': 'bg-amber-100 text-amber-800 border-amber-200',
		'3': 'bg-yellow-100 text-yellow-800 border-yellow-200',
		'4': 'bg-lime-100 text-lime-800 border-lime-200',
		'5': 'bg-green-100 text-green-800 border-green-200',
		'6': 'bg-emerald-100 text-emerald-800 border-emerald-200',
		'7': 'bg-teal-100 text-teal-800 border-teal-200',
		'8': 'bg-cyan-100 text-cyan-800 border-cyan-200',
		'9': 'bg-blue-100 text-blue-800 border-blue-200',
		'10': 'bg-indigo-100 text-indigo-800 border-indigo-200'
	} as const;

	return colors[yearLevel as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function formatWeekRange(startWeek: number, length: number): string {
	if (length === 1) {
		return `Week ${startWeek}`;
	}
	return `Weeks ${startWeek}-${startWeek + length - 1}`;
}

export function formatDuration(weeks: number): string {
	if (weeks === 1) {
		return '1 week';
	}
	return `${weeks} weeks`;
}

export function getTermWeeks(termNumber: number): number[] {
	const term = ACADEMIC_TERMS.find((t) => t.value === termNumber);
	if (!term) return [];

	const weekCount = term.endWeek - term.startWeek + 1;
	return Array.from({ length: weekCount }, (_, i) => term.startWeek + i);
}

export function getTermByWeek(weekNumber: number): TermOption | null {
	return (
		ACADEMIC_TERMS.find((term) => weekNumber >= term.startWeek && weekNumber <= term.endWeek) ||
		null
	);
}

export function getTotalWeeksInYear(): number {
	return Math.max(...ACADEMIC_TERMS.map((t) => t.endWeek));
}

export function isWeekInRange(week: number, item: CourseMapItem): boolean {
	return week >= item.startWeekNumber && week < item.startWeekNumber + item.lengthInWeeks;
}

export function getItemPosition(
	item: CourseMapItem,
	totalWeeks: number
): {
	left: string;
	width: string;
} {
	const startPercent = ((item.startWeekNumber - 1) / totalWeeks) * 100;
	const widthPercent = (item.lengthInWeeks / totalWeeks) * 100;

	return {
		left: `${startPercent}%`,
		width: `${widthPercent}%`
	};
}

export function checkCourseMapItemConflict(
	items: CourseMapItem[],
	newItem: {
		yearLevel: string;
		termNumber: number;
		startWeekNumber: number;
		lengthInWeeks: number;
		academicYear: number;
	},
	excludeItemId?: number
): boolean {
	return items.some((item) => {
		// Skip if it's the same item being updated
		if (excludeItemId && item.id === excludeItemId) {
			return false;
		}

		// Only check items in the same year level, term, and academic year
		if (
			item.yearLevel !== newItem.yearLevel ||
			item.termNumber !== newItem.termNumber ||
			item.academicYear !== newItem.academicYear
		) {
			return false;
		}

		// Check for week overlap
		const itemEnd = item.startWeekNumber + item.lengthInWeeks - 1;
		const newItemEnd = newItem.startWeekNumber + newItem.lengthInWeeks - 1;

		return (
			(newItem.startWeekNumber >= item.startWeekNumber && newItem.startWeekNumber <= itemEnd) ||
			(newItemEnd >= item.startWeekNumber && newItemEnd <= itemEnd) ||
			(newItem.startWeekNumber <= item.startWeekNumber && newItemEnd >= itemEnd)
		);
	});
}
