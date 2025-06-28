<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { formatDate, formatTime, days, addTimeAndDuration, timeToMinutes } from '$lib/utils';

	let { data } = $props();
	let { classTimes } = data;

	function generateTimeslots(startHour = 8, endHour = 17): string[] {
		const slots: string[] = [];
		for (let hour = startHour; hour < endHour; hour++) {
			slots.push(`${hour.toString().padStart(2, '0')}:00`);
			slots.push(`${hour.toString().padStart(2, '0')}:30`);
		}
		return slots;
	}

	let timeslots = generateTimeslots();

	function getClassPosition(startTime: string, duration: string) {
		const startMinutes = timeToMinutes(startTime);
		const startOfDay = 8 * 60; // 8:00 AM in minutes
		const totalSlots = timeslots.length;
		const slotHeight = 100 / totalSlots; // Percentage height per slot

		const slotIndex = (startMinutes - startOfDay) / 30; // Each slot is 30 minutes
		const topPosition = slotIndex * slotHeight;
		const durationInSlots = timeToMinutes(duration) / 30;
		const height = durationInSlots * slotHeight;

		return {
			top: `calc(${topPosition}% + 2px)`,
			height: `calc(${height}% - 4px)`
		};
	}

	function getSubjectColor(subjectName: string): string {
		const colors: Record<string, string> = {
			Maths: 'bg-blue-100 border-blue-300 text-blue-900',
			English: 'bg-red-100 border-red-300 text-red-900',
			Science: 'bg-green-100 border-green-300 text-green-900',
			History: 'bg-amber-100 border-amber-300 text-amber-900',
			Geography: 'bg-purple-100 border-purple-300 text-purple-900'
		};

		return colors[subjectName] || 'bg-gray-100 border-gray-300 text-gray-900';
	}
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
					class="text-muted-foreground text-s flex items-start justify-end pr-4"
					style="height: {100 / timeslots.length}%; transform: translateY(-12px);"
				>
					{#if index % 2 === 0}
						{slot}
					{/if}
				</div>
			{/each}
		</div>

		{#each days as day}
			<div class="border-border/50 relative border-r last:border-r-0">
				<!-- Background timeslot lines -->
				{#each timeslots}
					<div
						class="border-border/80 text-muted-foreground hover:bg-muted/20 flex items-center justify-start border-t pl-2 text-xs transition-colors"
						style="height: {100 / timeslots.length}%;"
					></div>
				{/each}

				<!-- Classes for this day -->
				{#each (classTimes ?? []).filter((c) => c.classTime.dayOfWeek === day.value) as cls}
					{@const position = getClassPosition(cls.classTime.startTime, cls.classTime.duration)}
					{@const colorClasses = getSubjectColor(cls.subject.name)}
					<a
						href="/subjects/{cls.subject.id}/home"
						class="hover:bg-muted/50 block transition-colors"
						style="position: absolute; top: {position.top}; height: {position.height}; right: 4px; left: 4px;"
					>
						<Card.Root class="h-full overflow-hidden px-2 py-0 pt-1 {colorClasses}">
							<Card.Header class="p-2">
								<Card.Title class="overflow-hidden text-base text-ellipsis whitespace-nowrap"
									>{cls.subject.name}</Card.Title
								>
								<Card.Description class="overflow-hidden text-xs text-ellipsis whitespace-nowrap">
									{formatTime(cls.classTime.startTime)} - {formatTime(
										addTimeAndDuration(cls.classTime.startTime, cls.classTime.duration)
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
