import { type DateValue } from '@internationalized/date';
import { dateValueToCalendarDate } from './utils.js';

export type AttendanceRecord = {
	attendance: { id: number; didAttend: boolean };
	subjectClassAllocation: { id: number; startTimestamp: Date };
	subject: { name: string };
	subjectOfferingClass: { name: string };
	user: { id: string; firstName: string; middleName?: string | null; lastName: string };
};

export type ScheduleRecord = {
	subjectClassAllocation: { id: number; startTimestamp: Date };
	subject: { name: string };
	subjectOfferingClass: { name: string };
	user: { id: string; firstName: string; middleName?: string | null; lastName: string };
};

export function getRecordsForDate<T extends { subjectClassAllocation: { startTimestamp: Date } }>(
	records: T[],
	selectedDate: DateValue | undefined
): T[] {
	if (!selectedDate || !records?.length) return [];

	return records.filter((record) => {
		const recordDate = dateValueToCalendarDate(record.subjectClassAllocation.startTimestamp);
		return selectedDate.compare(recordDate) === 0;
	});
}

export function hasClassesOnDate(
	attendances: AttendanceRecord[],
	schedules: ScheduleRecord[],
	selectedDate: DateValue | undefined
): boolean {
	return (
		getRecordsForDate(attendances, selectedDate).length > 0 ||
		getRecordsForDate(schedules, selectedDate).length > 0
	);
}

export type AttendanceStatus = 'all-present' | 'all-absent' | 'mixed' | 'none';

export function getAttendanceStatusForDay(
	attendances: AttendanceRecord[],
	day: DateValue
): AttendanceStatus {
	const attendanceForDay = getRecordsForDate(attendances, day);

	if (!attendanceForDay.length) return 'none';

	const allPresent = attendanceForDay.every((att) => att.attendance.didAttend);
	const allAbsent = attendanceForDay.every((att) => !att.attendance.didAttend);

	if (allPresent) return 'all-present';
	if (allAbsent) return 'all-absent';
	return 'mixed';
}

export function getAttendanceStyleClasses(status: AttendanceStatus): string {
	const statusStyles = {
		'all-present':
			'!bg-success hover:!bg-success !text-success-foreground hover:!text-success-foreground',
		'all-absent':
			'!bg-destructive hover:!bg-destructive !text-destructive-foreground hover:!text-destructive-foreground',
		mixed: '!bg-primary hover:!bg-primary !text-primary-foreground hover:!text-primary-foreground',
		none: ''
	};

	return statusStyles[status];
}
