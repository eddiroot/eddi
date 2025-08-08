<script lang="ts">
	import TimetableCard from '$lib/components/timetable-card.svelte';
	import { days } from '$lib/utils';
	import { generateTimeslots, getClassPosition } from './utils.js';
	import * as Button from '$lib/components/ui/button';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { page } from '$app/stores';

	let { data } = $props();
	let { classAllocation: classTimes, currentWeekStart } = data;

	let timeslots = generateTimeslots(8, 17);

	// Format the current week display
	function formatWeekDisplay(weekStart: string): string {
		const startDate = new Date(weekStart);
		const endDate = new Date(startDate);
		endDate.setDate(startDate.getDate() + 6); // Add 6 days to get Sunday

		const formatOptions: Intl.DateTimeFormatOptions = {
			month: 'short',
			day: 'numeric'
		};

		const startFormatted = startDate.toLocaleDateString('en-AU', formatOptions);
		const endFormatted = endDate.toLocaleDateString('en-AU', formatOptions);

		return `${startFormatted} - ${endFormatted}, ${startDate.getFullYear()}`;
	}

	// Calculate the Monday of any given date
	function getMondayOfWeek(date: Date): Date {
		const dayOfWeek = date.getDay();
		const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
		const monday = new Date(date);
		monday.setDate(date.getDate() + mondayOffset);
		return monday;
	}

	function navigateWeek(direction: 'previous' | 'next') {
		const currentWeek = new Date(currentWeekStart);
		const offset = direction === 'next' ? 7 : -7;
		currentWeek.setDate(currentWeek.getDate() + offset);

		const newWeekStart = getMondayOfWeek(currentWeek);
		const weekParam = newWeekStart.toISOString().split('T')[0];

		// Force a full page reload by using window.location instead of SvelteKit navigation
		window.location.href = `${$page.url.pathname}?week=${weekParam}`;
	}
</script>

<div class="h-full space-y-4 p-8">
	<!-- Week Navigation -->
	<div class="flex items-center justify-between">
		<Button.Root variant="outline" size="sm" onclick={() => navigateWeek('previous')}>
			<ChevronLeft class="h-4 w-4" />
			Previous Week
		</Button.Root>
		<div class="text-center text-lg font-semibold">
			Week of {formatWeekDisplay(currentWeekStart)}
		</div>
		<Button.Root variant="outline" size="sm" onclick={() => navigateWeek('next')}>
			Next Week
			<ChevronRight class="h-4 w-4" />
		</Button.Root>
	</div>

	<!-- Day titles -->
	<div class="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr]">
		<div class="text-center text-base font-semibold text-transparent">Time</div>
		{#each days as day}
			<div class="border-primary/20 text-foreground text-center text-base font-semibold">
				{day.name}
			</div>
		{/each}
	</div>

	<!-- Timetable grid -->
	<div
		class="overflow-hidden-3 relative grid h-[calc(100%-60px)] grid-cols-[80px_1fr_1fr_1fr_1fr_1fr] pt-3"
	>
		<!-- Time legend column -->
		<div class="bg-background relative">
			{#each timeslots as slot}
				<div
					class="text-muted-foreground flex items-start justify-end pr-4 text-xs"
					style="height: {100 / timeslots.length}%; transform: translateY(-8px);"
				>
					{slot}
				</div>
			{/each}
		</div>

		{#each days as day}
			<div class="border-border relative border-r last:border-r-0">
				<!-- Background timeslot lines -->
				{#each timeslots}
					<div class="border-border border-t" style="height: {100 / timeslots.length}%;"></div>
				{/each}

				<!-- Classes for this day -->
				{#each (classTimes ?? []).filter((c) => {
					const dayOfWeek = c.classAllocation.startTimestamp.getDay();
					const dayIndex = dayOfWeek === 0 ? -1 : dayOfWeek - 1;
					return dayIndex >= 0 && dayIndex < days.length && days[dayIndex].value === day.value;
				}) as cls}
					{@const position = getClassPosition(
						8,
						cls.classAllocation.startTimestamp,
						cls.classAllocation.endTimestamp,
						timeslots
					)}
					<div
						style="position: absolute; top: {position.top}; height: {position.height}; right: 4px; left: 4px;"
					>
						<TimetableCard {cls} href="/subjects/{cls.subjectOffering.id}" />
					</div>
				{/each}
			</div>
		{/each}
	</div>
</div>
