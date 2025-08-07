<script lang="ts">
	import TimetableCard from '$lib/components/timetable-card.svelte';
	import { days } from '$lib/utils';
	import { generateTimeslots, getClassPosition } from './utils.js';

	let { data } = $props();
	let { classAllocation: classTimes } = data;

	let timeslots = generateTimeslots(8, 17);
</script>

<div class="h-full space-y-4 p-8">
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
