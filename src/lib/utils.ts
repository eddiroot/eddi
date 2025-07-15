import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
	viewAttendance = 'view_attendance'
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
				userPermissions.viewAttendance
			];
		case 'principal':
			return [
				userPermissions.manageTeachers,
				userPermissions.viewAnalytics,
				userPermissions.viewTimetable,
				userPermissions.viewDashboard,
				userPermissions.viewAttendance
			];
		case 'guardian':
			return [
				userPermissions.viewChildGrades,
				userPermissions.viewLessons,
				userPermissions.viewTimetable,
				userPermissions.viewDashboard
			];
		case 'schoolAdmin':
			return [
				userPermissions.viewAdmin,
				userPermissions.viewDashboard,
				userPermissions.viewTimetable,
				userPermissions.viewAnalytics,
				userPermissions.manageTeachers,
				userPermissions.viewLessons,
				userPermissions.viewAttendance
			];
		case 'systemAdmin':
			return [
				userPermissions.viewAdmin,
				userPermissions.viewDashboard,
				userPermissions.viewTimetable,
				userPermissions.viewAnalytics,
				userPermissions.manageTeachers,
				userPermissions.viewLessons,
				userPermissions.viewAttendance
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
	{ name: 'Monday', value: 'monday' },
	{ name: 'Tuesday', value: 'tuesday' },
	{ name: 'Wednesday', value: 'wednesday' },
	{ name: 'Thursday', value: 'thursday' },
	{ name: 'Friday', value: 'friday' }
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

// --- Verification Code Utilities ---

export async function handleVerificationCodeInput(
	verificationCode: string[],
	index: number,
	event: Event,
	tick: () => Promise<void>
): Promise<string[]> {
	const target = event.target as HTMLInputElement;
	let value = target.value.replace(/\D/g, '');
	const updated = [...verificationCode];

	if (value.length > 1) {
		const chars = value.split('');
		for (let i = 0; i < chars.length && index + i < 6; i++) {
			updated[index + i] = chars[i];
		}
		await tick();
		let nextIndex = Math.min(index + value.length, 5);
		const nextInput = document.getElementById(`code-${nextIndex}`) as HTMLInputElement;
		if (nextInput) {
			nextInput.focus();
			nextInput.select();
		}
	} else if (value.length === 1) {
		updated[index] = value;
		await tick();
		if (index < 5) {
			const nextInput = document.getElementById(`code-${index + 1}`) as HTMLInputElement;
			if (nextInput) {
				nextInput.focus();
				nextInput.select();
			}
		}
	} else {
		updated[index] = '';
	}
	return updated;
}

export async function handleKeydown(
	verificationCode: string[],
	index: number,
	event: KeyboardEvent,
	tick: () => Promise<void>
): Promise<string[]> {
	const updated = [...verificationCode];
	if (event.key === 'Backspace') {
		if (!updated[index] && index > 0) {
			event.preventDefault();
			const prevInput = document.getElementById(`code-${index - 1}`) as HTMLInputElement;
			if (prevInput) {
				updated[index - 1] = '';
				await tick();
				prevInput.focus();
				prevInput.select();
			}
		}
	} else if (event.key === 'ArrowLeft' && index > 0) {
		const prevInput = document.getElementById(`code-${index - 1}`) as HTMLInputElement;
		if (prevInput) {
			prevInput.focus();
			prevInput.select();
		}
	} else if (event.key === 'ArrowRight' && index < 5) {
		const nextInput = document.getElementById(`code-${index + 1}`) as HTMLInputElement;
		if (nextInput) {
			nextInput.focus();
			nextInput.select();
		}
	}
	return updated;
}

export async function handlePaste(
	verificationCode: string[],
	event: ClipboardEvent,
	tick: () => Promise<void>
): Promise<string[]> {
	event.preventDefault();
	const paste = event.clipboardData?.getData('text') || '';
	const digits = paste.replace(/\D/g, '').slice(0, 6);
	const updated = [...verificationCode];

	if (digits.length > 0) {
		for (let i = 0; i < digits.length && i < 6; i++) {
			updated[i] = digits[i];
		}
		await tick();
		const nextIndex = Math.min(digits.length, 5);
		const nextInput = document.getElementById(`code-${nextIndex}`) as HTMLInputElement;
		if (nextInput) {
			nextInput.focus();
			nextInput.select();
		}
	}
	return updated;
}
