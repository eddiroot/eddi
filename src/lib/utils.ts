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
