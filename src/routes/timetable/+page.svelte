<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { formatTime, days, addTimeAndDuration } from '$lib/utils';
	import { generateSubjectColors, generateTimeslots, getClassPosition } from './utils.js';

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
			{#each timeslots as slot, index}
				<div
					class="text-muted-foreground flex items-start justify-end pr-4 text-xs"
					style="height: {100 / timeslots.length}%; transform: translateY(-8px);"
				>
					{slot}
				</div>
			{/each}
		</div>

		{#each days as day}
			<div class="border-border relative border-r-2 last:border-r-0">
				<!-- Background timeslot lines -->
				{#each timeslots}
					<div class="border-border border-t" style="height: {100 / timeslots.length}%;"></div>
				{/each}

				<!-- Classes for this day -->
				{#each (classTimes ?? []).filter((c) => c.classAllocation.dayOfWeek === day.value) as cls}
					{@const position = getClassPosition(
						8,
						cls.classAllocation.startTime,
						cls.classAllocation.duration,
						timeslots
					)}
					{@const colors = generateSubjectColors(cls.userSubjectOffering.color)}
					<a
						href="/subjects/{cls.subjectOffering.id}"
						class="transition-opacity duration-200 hover:opacity-75"
						style="position: absolute; top: {position.top}; height: {position.height}; right: 4px; left: 4px;"
					>
						<Card.Root
							class="h-full overflow-hidden border-0 border-t-4 px-2 pt-0 shadow-lg"
							style="border-top-color: {colors.border}; color: {colors.text};"
						>
							<Card.Header class="p-1">
								<Card.Title class="overflow-hidden text-base text-ellipsis whitespace-nowrap">
									{cls.subject.name}
								</Card.Title>
								<Card.Description class="overflow-hidden text-xs text-ellipsis whitespace-nowrap">
									{formatTime(cls.classAllocation.startTime)} - {formatTime(
										addTimeAndDuration(cls.classAllocation.startTime, cls.classAllocation.duration)
									)}
									{cls.schoolLocation.name}
								</Card.Description>
							</Card.Header>
						</Card.Root>
					</a>
				{/each}
			</div>
		{/each}
	</div>
</div>
