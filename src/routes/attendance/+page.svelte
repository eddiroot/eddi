<script lang="ts">
	import { getLocalTimeZone, today, CalendarDate, type DateValue } from '@internationalized/date';
	import { Calendar, Day } from '$lib/components/ui/calendar/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';
	import { convertToFullName } from '$lib/utils';

	let { data } = $props();
	let value = $state<DateValue | undefined>(today(getLocalTimeZone()));

	function getAttendanceForDate(
		attendances: (typeof data.attendancesByUserId)[number],
		selectedDate: DateValue | undefined
	) {
		if (!selectedDate || !attendances?.length) return [];

		return attendances.filter((att) => {
			const attDate = new CalendarDate(
				att.subjectClassAllocation.startTimestamp.getFullYear(),
				att.subjectClassAllocation.startTimestamp.getMonth() + 1,
				att.subjectClassAllocation.startTimestamp.getDate()
			);
			return selectedDate.compare(attDate) === 0;
		});
	}

	function getAttendanceStyleForDay(
		attendances: (typeof data.attendancesByUserId)[number],
		day: any
	) {
		if (!day || !attendances?.length) return '';

		const attendanceForDay = attendances.find((att) => {
			const attDate = new CalendarDate(
				att.subjectClassAllocation.startTimestamp.getFullYear(),
				att.subjectClassAllocation.startTimestamp.getMonth() + 1,
				att.subjectClassAllocation.startTimestamp.getDate()
			);
			return day.compare(attDate) === 0;
		});

		if (!attendanceForDay) return '';

		return attendanceForDay.attendance.didAttend
			? '!bg-primary hover:!bg-primary !text-primary-foreground hover:!text-primary-foreground'
			: '!bg-destructive hover:!bg-destructive !text-destructive-foreground hover:!text-destructive-foreground';
	}
</script>

<div class="flex gap-4 overflow-x-auto p-8">
	{#if data.attendancesByUserId && Object.keys(data.attendancesByUserId).length > 0}
		{#each Object.entries(data.attendancesByUserId) as [userId, attendances]}
			<Card.Root class="w-fit gap-0">
				<Card.Header>
					<Card.Title class="text-lg">
						{#if attendances.length > 0}
							{convertToFullName(
								attendances[0].user.firstName,
								attendances[0].user.middleName,
								attendances[0].user.lastName
							)}
						{:else}
							Student {userId}
						{/if}
					</Card.Title>
				</Card.Header>
				<Card.Content class="px-4">
					<Calendar
						type="single"
						bind:value
						preventDeselect
						captionLayout="label"
						isDateDisabled={(date) => {
							return !attendances.some((att) => {
								const attDate = new CalendarDate(
									att.subjectClassAllocation.startTimestamp.getFullYear(),
									att.subjectClassAllocation.startTimestamp.getMonth() + 1,
									att.subjectClassAllocation.startTimestamp.getDate()
								);
								return date.compare(attDate) === 0;
							});
						}}
						isDateUnavailable={(date) => {
							const dayOfWeek = date.toDate(getLocalTimeZone()).getDay();
							return dayOfWeek === 0 || dayOfWeek === 6;
						}}
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
						{value?.toDate(getLocalTimeZone()).toLocaleDateString('en-US', {
							day: 'numeric',
							month: 'long',
							year: 'numeric'
						})}
					</div>
					<div class="flex w-full flex-col gap-2">
						{#each getAttendanceForDate(attendances, value) as attendance (attendance.subjectOfferingClass.id)}
							<Card.Root
								class="relative p-0 {attendance.attendance.didAttend
									? 'bg-primary/10 border-primary/20'
									: 'bg-destructive/10 border-destructive/20'}"
							>
								<Card.Content class="p-3 pl-6">
									<div
										class="absolute inset-y-2 left-2 w-1 rounded-full {attendance.attendance
											.didAttend
											? 'bg-primary'
											: 'bg-destructive'}"
									></div>
									<div class="mb-1 flex items-center gap-2">
										<div class="text-sm font-medium">
											{attendance.subject.name} - {attendance.subjectOfferingClass.name}
										</div>
										{#if attendance.attendance.didAttend}
											<CheckIcon class="text-primary h-4 w-4" />
										{:else}
											<XIcon class="text-destructive h-4 w-4" />
										{/if}
									</div>
									<div
										class="text-xs {attendance.attendance.didAttend
											? 'text-primary/70'
											: 'text-destructive/70'}"
									>
										{attendance.attendance.didAttend ? 'Present' : 'Absent'}
										- {attendance.subjectClassAllocation.startTimestamp.toLocaleTimeString(
											'en-US',
											{
												hour: '2-digit',
												minute: '2-digit'
											}
										)}
									</div>
								</Card.Content>
							</Card.Root>
						{/each}
						{#if getAttendanceForDate(attendances, value).length === 0}
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
