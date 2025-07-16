<script lang="ts">
	import { getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import { Calendar, Day } from '$lib/components/ui/calendar/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as ScrollArea from '$lib/components/ui/scroll-area/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import XCircleIcon from '@lucide/svelte/icons/x-circle';
	import { convertToFullName } from '$lib/utils';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { markAbsentSchema } from './schema.js';
	import {
		getRecordsForDate,
		hasClassesOnDate,
		getAttendanceStatusForDay,
		getAttendanceStyleClasses,
		type ScheduleWithAttendanceRecord,
		isDateInFuture,
		isDateToday
	} from './utils.js';
	import ClassCard from './components/ClassCard.svelte';
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

	function getStudentName(records: ScheduleWithAttendanceRecord[]): string {
		const student = records[0]?.user;
		if (!student) return 'Unknown Student';

		return convertToFullName(student.firstName, student.middleName, student.lastName);
	}

	function openAbsenceDialog(studentId: string): void {
		$form.studentId = studentId;
		$form.date = selectedDate.toDate(getLocalTimeZone());
		$form.note = '';
		showAbsenceDialog = true;
	}

	function isDateDisabled(date: DateValue, records: ScheduleWithAttendanceRecord[]): boolean {
		const jsDate = date.toDate(getLocalTimeZone());
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		jsDate.setHours(0, 0, 0, 0);

		// Enable today and future dates
		if (jsDate >= today) return false;

		// For past dates, only enable if they have attendance or schedule records
		return !records.some((record) => {
			const recordDate = record.subjectClassAllocation.startTimestamp;
			const recordDateOnly = new Date(
				recordDate.getFullYear(),
				recordDate.getMonth(),
				recordDate.getDate()
			);
			return jsDate.getTime() === recordDateOnly.getTime();
		});
	}

	function isDateUnavailable(date: DateValue): boolean {
		const dayOfWeek = date.toDate(getLocalTimeZone()).getDay();
		return dayOfWeek === 0 || dayOfWeek === 6; // Weekend
	}

	function getAttendanceStyleForDay(
		records: ScheduleWithAttendanceRecord[],
		day: DateValue
	): string {
		const status = getAttendanceStatusForDay(records, day);
		return getAttendanceStyleClasses(status);
	}

	function shouldShowMarkAbsentButton(records: ScheduleWithAttendanceRecord[]): boolean {
		const recordsForDate = getRecordsForDate(records, selectedDate);
		const hasAttendanceRecords = recordsForDate.some((record) => record.attendance !== null);

		return (
			(isDateInFuture(selectedDate) || isDateToday(selectedDate)) &&
			hasClassesOnDate(records, selectedDate) &&
			!hasAttendanceRecords
		);
	}

	function getStudentId(records: ScheduleWithAttendanceRecord[]): string {
		return records[0]?.user.id || '';
	}
</script>

<div class="flex h-full gap-4 overflow-x-auto p-8">
	{#each Object.entries(data.recordsByUserId) as [_, records]}
		<Card.Root class="flex h-full flex-col gap-0 pb-0">
			<Card.Header>
				<Card.Title class="text-lg">
					{getStudentName(records)}
				</Card.Title>
			</Card.Header>

			<Card.Content>
				<Calendar
					type="single"
					bind:value={selectedDate}
					preventDeselect
					class="[--cell-size:--spacing(11)] md:[--cell-size:--spacing(12)]"
					captionLayout="label"
					isDateDisabled={(date) => isDateDisabled(date, records)}
					{isDateUnavailable}
				>
					{#snippet day({ day })}
						<Day class={getAttendanceStyleForDay(records, day)}>
							{day.day}
						</Day>
					{/snippet}
				</Calendar>
			</Card.Content>

			<Card.Footer class="flex min-h-0 flex-1 flex-col border-t">
				<ScrollArea.Root class="min-h-20 w-full">
					<div class="mb-4 flex flex-col gap-2">
						<!-- Mark Absent Button -->
						{#if shouldShowMarkAbsentButton(records)}
							<Button
								onclick={() => openAbsenceDialog(getStudentId(records))}
								variant="destructive"
								size="sm"
								class="w-full"
							>
								<XCircleIcon class="mr-2" />
								Mark Absent
							</Button>
						{/if}

						<!-- Scrollable Records List -->

						{#each getRecordsForDate(records, selectedDate) as record (record.subjectClassAllocation.id)}
							<ClassCard {record} />
						{/each}

						{#if !hasClassesOnDate(records, selectedDate)}
							<div class="text-muted-foreground">No classes scheduled for this date</div>
						{/if}
					</div>
					<ScrollArea.Scrollbar orientation="vertical" />
				</ScrollArea.Root>
			</Card.Footer>
		</Card.Root>
	{/each}
</div>

<AbsenceDialog
	bind:open={showAbsenceDialog}
	{selectedDate}
	{form}
	{enhance}
	{errors}
	onMarkAbsent={openAbsenceDialog}
/>
