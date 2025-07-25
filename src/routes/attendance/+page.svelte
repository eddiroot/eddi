<script lang="ts">
	import { getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import { Calendar, Day } from '$lib/components/ui/calendar/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as ScrollArea from '$lib/components/ui/scroll-area/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import XCircleIcon from '@lucide/svelte/icons/x-circle';
	import { convertToFullName } from '$lib/utils';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { markAbsentSchema } from './schema.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Textarea } from '$lib/components/ui/textarea';
	import { formatTimestampAsDate } from '$lib/utils';
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

	let { data } = $props();
	let selectedDate = $state<DateValue>(today(getLocalTimeZone()));
	let showAbsenceDialog = $state(false);

	const form = superForm(data.form, {
		validators: zod4(markAbsentSchema),
		onResult: ({ result }) => {
			if (result.type === 'success') {
				showAbsenceDialog = false;
			}
		}
	});

	const { form: formData, enhance } = form;

	function getStudentName(records: ScheduleWithAttendanceRecord[]): string {
		const student = records[0]?.user;
		if (!student) return 'Unknown Student';

		return convertToFullName(student.firstName, student.middleName, student.lastName);
	}

	function openAbsenceDialog(studentId: string): void {
		$formData.studentId = studentId;
		$formData.date = selectedDate.toDate(getLocalTimeZone());
		$formData.attendanceNote = '';
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

			<Card.Footer class="flex min-h-0 flex-1 flex-col border-t p-0 [.border-t]:pt-0">
				<ScrollArea.Root class="min-h-20 w-full px-4" type="always">
					<div class="mb-4 flex flex-col gap-2">
						{#if shouldShowMarkAbsentButton(records)}
							<div class="bg-background sticky top-0 z-10 pt-4 pb-2">
								<Button
									onclick={() => openAbsenceDialog(getStudentId(records))}
									variant="destructive"
									size="sm"
									class="w-full"
								>
									<XCircleIcon class="mr-2" />
									Mark Absent
								</Button>
							</div>
						{:else}
							<div class="bg-background sticky top-0 z-10 h-2"></div>
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

<Dialog.Root open={showAbsenceDialog} onOpenChange={(open) => (showAbsenceDialog = open)}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Mark Student Absent</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to mark this student as absent for {formatTimestampAsDate(
					selectedDate.toDate(getLocalTimeZone())
				)}?
			</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/markAbsence" use:enhance class="space-y-4">
			<input type="hidden" name="studentId" bind:value={$formData.studentId} />
			<input type="hidden" name="date" bind:value={$formData.date} />
			<Form.Field {form} name="attendanceNote">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Note</Form.Label>
						<Textarea
							{...props}
							placeholder="Reason for absence..."
							class="min-h-[80px]"
							bind:value={$formData.attendanceNote}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (showAbsenceDialog = false)}
					>Cancel</Button
				>
				<Button type="submit" variant="destructive">Mark Absent</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
