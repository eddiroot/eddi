import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { yearLevelEnum } from './enums';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export enum userPermissions {
	viewLessons = 'view_lessons',
	createTasks = 'create_tasks',
	viewAnalytics = 'view_analytics',
	manageTeachers = 'manage_teachers',
	viewChildGrades = 'view_child_grades',
	viewDashboard = 'view_dashboard',
	viewAdmin = 'view_admin',
	viewTimetable = 'view_timetable',
	viewClassAttendance = 'view_class_attendance',
	viewGuardianAttendance = 'view_guardian_attendance'
}

export function getPermissions(userType: string): string[] {
	switch (userType) {
		case 'student':
			return [
				userPermissions.viewLessons,
				userPermissions.viewDashboard,
				userPermissions.viewTimetable
			];
		case 'teacher':
			return [
				userPermissions.viewLessons,
				userPermissions.createTasks,
				userPermissions.viewAnalytics,
				userPermissions.viewTimetable,
				userPermissions.viewDashboard,
				userPermissions.viewClassAttendance
			];
		case 'guardian':
			return [
				userPermissions.viewChildGrades,
				userPermissions.viewLessons,
				userPermissions.viewTimetable,
				userPermissions.viewDashboard,
				userPermissions.viewGuardianAttendance
			];
		case 'principal':
			return [
				userPermissions.manageTeachers,
				userPermissions.viewAnalytics,
				userPermissions.viewTimetable,
				userPermissions.viewDashboard,
				userPermissions.viewClassAttendance
			];
		case 'schoolAdmin':
			return [
				userPermissions.viewAdmin,
				userPermissions.viewDashboard,
				userPermissions.viewTimetable,
				userPermissions.viewAnalytics,
				userPermissions.manageTeachers,
				userPermissions.viewLessons,
				userPermissions.viewClassAttendance
			];
		case 'systemAdmin':
			return [
				userPermissions.viewAdmin,
				userPermissions.viewDashboard,
				userPermissions.viewTimetable,
				userPermissions.viewAnalytics,
				userPermissions.manageTeachers,
				userPermissions.viewLessons,
				userPermissions.viewClassAttendance
			];
		default:
			return [];
	}
}

export function convertToFullName(
	firstName: string | null | undefined,
	middleName: string | null | undefined,
	lastName: string | null | undefined
): string {
	const parts: string[] = [];
	if (firstName) {
		parts.push(firstName);
	}
	if (middleName) {
		parts.push(middleName);
	}
	if (lastName) {
		parts.push(lastName);
	}

	return parts.join(' ').trim();
}

export function yearLevelToLabel(yearLevel: string): string {
	switch (yearLevel) {
		case yearLevelEnum.foundation:
			return 'Foundation';
		case yearLevelEnum.year1:
			return 'Year 1';
		case yearLevelEnum.year2:
			return 'Year 2';
		case yearLevelEnum.year3:
			return 'Year 3';
		case yearLevelEnum.year4:
			return 'Year 4';
		case yearLevelEnum.year5:
			return 'Year 5';
		case yearLevelEnum.year6:
			return 'Year 6';
		case yearLevelEnum.year7:
			return 'Year 7';
		case yearLevelEnum.year8:
			return 'Year 8';
		case yearLevelEnum.year9:
			return 'Year 9';
		case yearLevelEnum.year10:
			return 'Year 10';
		case yearLevelEnum.year10A:
			return 'Year 10A';
		case yearLevelEnum.year11:
			return 'Year 11';
		case yearLevelEnum.year12:
			return 'Year 12';
		case yearLevelEnum.year13:
			return 'Year 13';
		case yearLevelEnum.none:
			return 'No Year Level';
		default:
			return yearLevel;
	}
}

export function formatTime(time: string): string {
	const [hours, minutes] = time.split(':').map(Number);
	const period = hours >= 12 ? 'pm' : 'am';
	const displayHours = hours % 12 || 12;
	return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
}

export function formatTimestamp(timestamp: Date): string {
	return timestamp
		.toLocaleDateString('en-AU', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		})
		.replace(/\s(?=am|pm)/g, '');
}

export function formatTimestampAsDate(timestamp: Date): string {
	return timestamp.toLocaleDateString('en-AU', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});
}

export function formatTimestampAsTime(timestamp: Date): string {
	return timestamp
		.toLocaleTimeString('en-AU', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		})
		.replace(/\s/g, '');
}

export const days = [
	{ name: 'Monday', value: 'monday', number: 1 },
	{ name: 'Tuesday', value: 'tuesday', number: 2 },
	{ name: 'Wednesday', value: 'wednesday', number: 3 },
	{ name: 'Thursday', value: 'thursday', number: 4 },
	{ name: 'Friday', value: 'friday', number: 5 }
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

// CSV utilities
export function parseCSVHeaders(csvText: string): string[] {
	const lines = csvText.split('\n');
	if (lines.length === 0) return [];
	const headerLine = lines[0].trim();
	return headerLine.split(',').map((header) => header.trim().replace(/['"]/g, ''));
}

export interface CSVValidationResult {
	isValid: boolean;
	foundColumns: string[];
	missingColumns: string[];
	extraColumns: string[];
}

export async function validateCSVFile(
	file: File,
	requiredColumns: string[],
	optionalColumns: string[] = []
): Promise<CSVValidationResult> {
	try {
		const text = await file.text();
		const foundColumns = parseCSVHeaders(text);

		const missingColumns = requiredColumns.filter(
			(col) => !foundColumns.some((found) => found.toLowerCase() === col.toLowerCase())
		);

		const extraColumns = foundColumns.filter(
			(col) =>
				!requiredColumns.some((req) => req.toLowerCase() === col.toLowerCase()) &&
				!optionalColumns.some((opt) => opt.toLowerCase() === col.toLowerCase())
		);

		return {
			isValid: missingColumns.length === 0,
			foundColumns,
			missingColumns,
			extraColumns
		};
	} catch (error) {
		console.error('Error validating CSV:', error);
		return {
			isValid: false,
			foundColumns: [],
			missingColumns: requiredColumns,
			extraColumns: []
		};
	}
}

// CSV parsing utilities
export function parseCSVRow(row: string): string[] {
	const values: string[] = [];
	let current = '';
	let inQuotes = false;
	let i = 0;

	while (i < row.length) {
		const char = row[i];
		const nextChar = row[i + 1];

		if (char === '"') {
			if (inQuotes && nextChar === '"') {
				// Escaped quote
				current += '"';
				i += 2;
			} else {
				// Toggle quote state
				inQuotes = !inQuotes;
				i++;
			}
		} else if (char === ',' && !inQuotes) {
			// End of field
			values.push(current.trim());
			current = '';
			i++;
		} else {
			current += char;
			i++;
		}
	}

	// Add the last field
	values.push(current.trim());
	return values;
}

export function parseCSVData(csvText: string): Array<Record<string, string>> {
	const lines = csvText.split('\n').filter((line) => line.trim());
	if (lines.length <= 1) return [];

	const headers = parseCSVRow(lines[0]).map((h) => h.toLowerCase());
	const data: Array<Record<string, string>> = [];

	for (let i = 1; i < lines.length; i++) {
		const values = parseCSVRow(lines[i]);
		if (values.length >= headers.length && values.some((v) => v.trim())) {
			const rowData: Record<string, string> = {};
			headers.forEach((header, index) => {
				rowData[header] = values[index] || '';
			});
			data.push(rowData);
		}
	}

	return data;
}

export enum ViewMode {
	EDIT = 'edit',
	VIEW = 'view',
	PRESENT = 'present'
}
