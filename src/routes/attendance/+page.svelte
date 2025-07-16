<script lang="ts">
	import { getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import { Calendar, Day } from '$lib/components/ui/calendar/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import XCircleIcon from '@lucide/svelte/icons/x-circle';
	import { convertToFullName, formatTimestampAsDate } from '$lib/utils';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { markAbsentSchema } from './schema.js';
	import {
		getRecordsForDate,
		hasClassesOnDate,
		getAttendanceStatusForDay,
		getAttendanceStyleClasses,
		type AttendanceRecord,
		type ScheduleRecord
	} from './attendance-helpers.js';
	import { isDateInFuture, isDateToday } from './utils.js';
	import AttendanceCard from './components/AttendanceCard.svelte';
	import ScheduleCard from './components/ScheduleCard.svelte';
	import AbsenceDialog from './components/AbsenceDialog.svelte';

	let { data } = $props();
	let selectedDate = $state<DateValue>(today(getLocalTimeZone()));
	let showAbsenceDialog = $state(false);

	const { form, enhance, message, errors } = superForm(data.form, {
		validators: zodClient(markAbsentSchema),
		onResult: ({ result }) => {
			if (result.type === 'success') {
				showAbsenceDialog = false;
			}
		}
	});

	function getStudentName(attendances: AttendanceRecord[], schedules: ScheduleRecord[]): string {
		const student = attendances[0]?.user || schedules[0]?.user;
		if (!student) return 'Unknown Student';

		return convertToFullName(student.firstName, student.middleName, student.lastName);
	}

	function openAbsenceDialog(studentId: string): void {
		$form.studentId = studentId;
		$form.date = selectedDate.toDate(getLocalTimeZone());
		$form.note = '';
		showAbsenceDialog = true;
	}

	function isDateDisabled(date: DateValue, attendances: AttendanceRecord[]): boolean {
		const jsDate = date.toDate(getLocalTimeZone());
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		jsDate.setHours(0, 0, 0, 0);

		// Enable today and future dates
		if (jsDate >= today) return false;

		// For past dates, only enable if they have attendance records
		return !attendances.some((att) => {
			const attDate = att.subjectClassAllocation.startTimestamp;
			const attDateOnly = new Date(attDate.getFullYear(), attDate.getMonth(), attDate.getDate());
			return jsDate.getTime() === attDateOnly.getTime();
		});
	}

	function isDateUnavailable(date: DateValue): boolean {
		const dayOfWeek = date.toDate(getLocalTimeZone()).getDay();
		return dayOfWeek === 0 || dayOfWeek === 6; // Weekend
	}

	function getAttendanceStyleForDay(attendances: AttendanceRecord[], day: DateValue): string {
		const status = getAttendanceStatusForDay(attendances, day);
		return getAttendanceStyleClasses(status);
	}

	function shouldShowMarkAbsentButton(
		attendances: AttendanceRecord[],
		schedules: ScheduleRecord[]
	): boolean {
		return (
			(isDateInFuture(selectedDate) || isDateToday(selectedDate)) &&
			hasClassesOnDate(attendances, schedules, selectedDate) &&
			getRecordsForDate(attendances, selectedDate).length === 0
		);
	}

	function getStudentId(attendances: AttendanceRecord[], schedules: ScheduleRecord[]): string {
		return attendances[0]?.user.id || schedules[0]?.user.id || '';
	}
</script>

<div class="flex gap-4 overflow-x-auto p-8">
	{#if data.attendancesByUserId && Object.keys(data.attendancesByUserId).length > 0}
		{#each Object.entries(data.attendancesByUserId) as [userId, attendances]}
			{@const schedules = data.schedulesByUserId?.[userId] || []}
			<Card.Root class="w-fit gap-0">
				<Card.Header>
					<Card.Title class="text-lg">
						{getStudentName(attendances, schedules)}
					</Card.Title>
				</Card.Header>

				<Card.Content class="px-4">
					<Calendar
						type="single"
						bind:value={selectedDate}
						preventDeselect
						captionLayout="label"
						isDateDisabled={(date) => isDateDisabled(date, attendances)}
						{isDateUnavailable}
					>
						{#snippet day({ day })}
							<Day class={getAttendanceStyleForDay(attendances, day)}>
								{day.day}
							</Day>
						{/snippet}
					</Calendar>
				</Card.Content>

				<Card.Footer class="flex flex-col items-start gap-3 border-t px-4 !pt-4">
					<div class="text-sm font-medium">
						{formatTimestampAsDate(selectedDate.toDate(getLocalTimeZone()))}
					</div>

					<!-- Mark Absent Button -->
					{#if shouldShowMarkAbsentButton(attendances, schedules)}
						<Button
							onclick={() => openAbsenceDialog(getStudentId(attendances, schedules))}
							variant="outline"
							size="sm"
							class="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground w-full"
						>
							<XCircleIcon class="mr-2 h-4 w-4" />
							Mark Absent
						</Button>
					{/if}

					<!-- Success Message -->
					{#if $message}
						<div class="text-sm font-medium text-green-600">{$message}</div>
					{/if}

					<!-- Records List -->
					<div class="flex w-full flex-col gap-2">
						<!-- Attendance Records -->
						{#each getRecordsForDate(attendances, selectedDate) as attendance (attendance.attendance.id)}
							<AttendanceCard {attendance} />
						{/each}

						<!-- Scheduled Classes without Attendance -->
						{#each getRecordsForDate(schedules, selectedDate) as schedule (schedule.subjectClassAllocation.id)}
							{@const hasAttendance = getRecordsForDate(attendances, selectedDate).some(
								(att) => att.subjectClassAllocation.id === schedule.subjectClassAllocation.id
							)}
							{#if !hasAttendance}
								<ScheduleCard {schedule} />
							{/if}
						{/each}

						<!-- No Classes Message -->
						{#if !hasClassesOnDate(attendances, schedules, selectedDate)}
							<div class="text-muted-foreground px-1 text-xs">
								No classes scheduled for this date
							</div>
						{/if}
					</div>
				</Card.Footer>
			</Card.Root>
		{/each}
	{:else}
		<div class="text-muted-foreground">No attendance data available.</div>
	{/if}
</div>

<!-- Absence Dialog -->
<AbsenceDialog
	bind:open={showAbsenceDialog}
	{selectedDate}
	{form}
	{enhance}
	{errors}
	onMarkAbsent={openAbsenceDialog}
/>
