import { CalendarDate, getLocalTimeZone, type DateValue } from '@internationalized/date';

export function dateValueToCalendarDate(date: Date): CalendarDate {
	return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function isDateInFuture(date: DateValue | undefined): boolean {
	if (!date) return false;
	const selectedDate = date.toDate(getLocalTimeZone());
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	selectedDate.setHours(0, 0, 0, 0);
	return selectedDate > today;
}

export function isDateToday(date: DateValue | undefined): boolean {
	if (!date) return false;
	const selectedDate = date.toDate(getLocalTimeZone());
	const today = new Date();
	return (
		selectedDate.getFullYear() === today.getFullYear() &&
		selectedDate.getMonth() === today.getMonth() &&
		selectedDate.getDate() === today.getDate()
	);
}
