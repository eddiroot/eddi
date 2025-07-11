import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { userTypeEnum } from './server/db/schema';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export enum userPermissions {
	viewLessons = 'view_lessons',
	createLessons = 'create_lessons',
	viewAnalytics = 'view_analytics',
	manageTeachers = 'manage_teachers',
	viewChildGrades = 'view_child_grades',
	viewDashboard = 'view_dashboard',
	viewAdmin = 'view_admin',
	viewTimeTable = 'view_time_table',
	etc = 'etc'
}

export function getPermissions(userType: userTypeEnum): string[] {
	switch (userType) {
		case userTypeEnum.student:
			return [userPermissions.viewLessons];
		case 'teacher':
			return [
				userPermissions.viewLessons,
				userPermissions.createLessons,
				userPermissions.viewAnalytics,
				userPermissions.viewTimeTable,
				userPermissions.viewDashboard
			];
		case userTypeEnum.principal:
			return [
				userPermissions.manageTeachers,
				userPermissions.viewAnalytics,
				userPermissions.viewTimeTable,
				userPermissions.viewDashboard
			];
		case userTypeEnum.guardian:
			return [
				userPermissions.viewChildGrades,
				userPermissions.viewLessons,
				userPermissions.viewTimeTable,
				userPermissions.viewDashboard
			];
		case userTypeEnum.schoolAdmin:
			return [
				userPermissions.viewAdmin,
				userPermissions.viewDashboard,
				userPermissions.viewTimeTable,
				userPermissions.viewAnalytics,
				userPermissions.manageTeachers,
				userPermissions.viewLessons
			];
		case userTypeEnum.systemAdmin:
			return [
				userPermissions.viewAdmin,
				userPermissions.viewDashboard,
				userPermissions.viewTimeTable,
				userPermissions.viewAnalytics,
				userPermissions.manageTeachers,
				userPermissions.viewLessons,
				userPermissions.etc
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

export function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString('en-AU', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function formatTime(time: string): string {
	// If already in hh:mm format, return as is
	if (time.includes(':')) {
		const [hours, minutes] = time.split(':');
		return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
	}
	// If in other format, convert to hh:mm
	return time;
}

export const days = [
	{ name: 'Monday', value: 'monday' },
	{ name: 'Tuesday', value: 'tuesday' },
	{ name: 'Wednesday', value: 'wednesday' },
	{ name: 'Thursday', value: 'thursday' },
	{ name: 'Friday', value: 'friday' }
];

export function getDayIndex(day: string): number {
	const dayLower = day.toLowerCase();
	return days.findIndex((d) => d.value === dayLower);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

/**
 * Adds a duration (in interval format) to a start time
 * @param startTime - Time in HH:MM format (e.g., "09:00")
 * @param duration - Duration in interval format (e.g., "01:30:00" for 1 hour 30 minutes)
 * @returns End time in HH:MM format
 */
export function addTimeAndDuration(startTime: string, duration: string): string {
	// Parse start time
	const [startHours, startMinutes] = startTime.split(':').map(Number);

	// Parse duration - handle formats like "01:30:00" or "1:30:00" or "01:30"
	const durationParts = duration.split(':');
	const durationHours = parseInt(durationParts[0]) || 0;
	const durationMinutes = parseInt(durationParts[1]) || 0;
	const durationSeconds = parseInt(durationParts[2]) || 0;

	// Convert everything to minutes for easier calculation
	const startTotalMinutes = startHours * 60 + startMinutes;
	const durationTotalMinutes =
		durationHours * 60 + durationMinutes + Math.round(durationSeconds / 60);

	// Add duration to start time
	const endTotalMinutes = startTotalMinutes + durationTotalMinutes;

	// Convert back to hours and minutes
	const endHours = Math.floor(endTotalMinutes / 60);
	const endMinutes = endTotalMinutes % 60;

	// Format as HH:MM
	return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

export function timeToMinutes(time: string): number {
	const [hours, minutes] = time.split(':').map(Number);
	return hours * 60 + minutes;
}

/**
 * Calculate the duration between two times in minutes
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @returns Duration in minutes
 */
export function getTimeDifferenceInMinutes(startTime: string, endTime: string): number {
	const startMinutes = timeToMinutes(startTime);
	const endMinutes = timeToMinutes(endTime);
	return endMinutes - startMinutes;
}

/**
 * Convert interval string to minutes
 * @param duration - Duration in interval format (e.g., "01:30:00")
 * @returns Duration in minutes
 */
export function intervalToMinutes(duration: string): number {
	const parts = duration.split(':');
	const hours = parseInt(parts[0]) || 0;
	const minutes = parseInt(parts[1]) || 0;
	const seconds = parseInt(parts[2]) || 0;

	return hours * 60 + minutes + Math.round(seconds / 60);
}

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
