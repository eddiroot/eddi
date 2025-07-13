import { dayOfWeekEnum } from '../schema';

export function getTableDayOfWeek(today: Date = new Date()) {
	const todayDayOfWeek = today.getDay();
	const dayOfWeekKeys = [
		'sunday',
		'monday',
		'tuesday',
		'wednesday',
		'thursday',
		'friday',
		'saturday'
	] as const;

	return dayOfWeekEnum[dayOfWeekKeys[todayDayOfWeek]];
}
