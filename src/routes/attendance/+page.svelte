<script lang="ts">
	import { getLocalTimeZone, today, CalendarDate } from '@internationalized/date';
	import { Calendar, Day } from '$lib/components/ui/calendar/index.js';

	let { data } = $props();
	let value = $state(today(getLocalTimeZone()));

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
		{#each Object.values(data.attendancesByUserId) as attendances}
			<Calendar
				type="single"
				bind:value
				class="rounded-md border shadow-sm"
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
		{/each}
	{:else}
		<div class="text-muted-foreground">No attendance data available.</div>
	{/if}
</div>
