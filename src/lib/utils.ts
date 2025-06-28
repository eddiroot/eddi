import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
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
