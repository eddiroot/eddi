<script lang="ts">
	import * as Card from '$lib/components/ui/card';
  
	let { data } = $props();
	let { classTimes } = data;

	const days = [
		{ name: 'Monday', value: 'monday' },
		{ name: 'Tuesday', value: 'tuesday' },
		{ name: 'Wednesday', value: 'wednesday' },
		{ name: 'Thursday', value: 'thursday' },
		{ name: 'Friday', value: 'friday' }
	];

	function generateTimeslots(startHour = 8, endHour = 18): string[] {
		const slots: string[] = [];
		for (let hour = startHour; hour < endHour; hour++) {
			slots.push(`${hour.toString().padStart(2, '0')}:00`);
			slots.push(`${hour.toString().padStart(2, '0')}:30`);
		}
		return slots;
	}

	let timeslots = generateTimeslots();

	function timeToMinutes(time: string): number {
		const [hours, minutes] = time.split(':').map(Number);
		return hours * 60 + minutes;
	}

	function getClassPosition(startTime: string, duration: string) {
		const startMinutes = timeToMinutes(startTime);
		const startOfDay = 8 * 60; // 8:00 AM in minutes
		const totalSlots = timeslots.length;
		const slotHeight = 100 / totalSlots; // Percentage height per slot

		const slotIndex = (startMinutes - startOfDay) / 30; // Each slot is 30 minutes
		const topPosition = slotIndex * slotHeight;
		const durationInSlots = timeToMinutes(duration) / 30;
		const height = durationInSlots * slotHeight;

		return { top: `${topPosition}%`, height: `${height}%` };
	}

  function formatTime(time: string): string {
    // If already in hh:mm format, return as is
    if (time.includes(':')) {
      const [hours, minutes] = time.split(':');
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }
    // If in other format, convert to hh:mm
    return time;
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
		class="relative grid h-[calc(100%-60px)] grid-cols-[80px_1fr_1fr_1fr_1fr_1fr] overflow-hidden"
	>
		<!-- Time legend column -->
		<div class="bg-background relative">
			{#each timeslots as slot, index}
				<div
					class="text-muted-foreground flex items-start justify-end pr-4 text-xs"
					style="height: {100 / timeslots.length}%;"
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
					<Card.Root
						class="absolute right-1 left-1 py-0 pt-3"
						style="top: {position.top}; height: {position.height};"
					>
						<Card.Header>
							<Card.Title>{cls.subject.name}</Card.Title>
							<Card.Description>{formatTime(cls.classTime.startTime)}</Card.Description>
						</Card.Header>
					</Card.Root>
				{/each}
			</div>
		{/each}
	</div>
</div>
