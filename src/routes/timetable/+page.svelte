<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

	//let { data } = $props();

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

	const classTimes = [
		{ subject: 'Math', startTime: '08:00', duration: '01:00', dayOfWeek: 'monday' },
		{ subject: 'English', startTime: '09:00', duration: '01:30', dayOfWeek: 'monday' },
		{ subject: 'Science', startTime: '10:30', duration: '01:00', dayOfWeek: 'monday' },
		{ subject: 'History', startTime: '11:30', duration: '01:00', dayOfWeek: 'monday' },
		{ subject: 'Art', startTime: '13:00', duration: '02:00', dayOfWeek: 'monday' },
		{ subject: 'PE', startTime: '15:00', duration: '01:00', dayOfWeek: 'monday' }
	];

	let timeslots = generateTimeslots();

	function timeToMinutes(time: string): number {
		const [hours, minutes] = time.split(':').map(Number);
		return hours * 60 + minutes;
	}

	function durationToMinutes(duration: string): number {
		const [hours, minutes] = duration.split(':').map(Number);
		return hours * 60 + minutes;
	}

	function getClassPosition(startTime: string, duration: string) {
		const startMinutes = timeToMinutes(startTime);
		const startOfDay = 8 * 60; // 8:00 AM in minutes
		const totalSlots = timeslots.length;
		const slotHeight = 100 / totalSlots; // Percentage height per slot

		const slotIndex = (startMinutes - startOfDay) / 30; // Each slot is 30 minutes
		const topPosition = slotIndex * slotHeight;
		const durationInSlots = durationToMinutes(duration) / 30;
		const height = durationInSlots * slotHeight;

		return { top: `${topPosition}%`, height: `${height}%` };
	}
</script>

<div class="h-full space-y-4 p-8">
	<h1 class="text-xl">Weekly Timetable</h1>
	<!-- Day titles -->
	<div class="mb-4 grid grid-cols-5 gap-4">
		{#each days as day}
			<div
				class="border-primary/20 text-foreground border-b-2 pb-3 text-center text-base font-semibold"
			>
				{day.name}
			</div>
		{/each}
	</div>

	<!-- Timetable grid -->
	<div
		class="bg-muted/10 relative grid h-[calc(100%-60px)] grid-cols-5 overflow-hidden rounded-lg border"
	>
		{#each days as day}
			<div class="border-border/50 relative border-r last:border-r-0">
				<!-- Background timeslot lines -->
				{#each timeslots as time, index}
					<div
						class="border-border/30 text-muted-foreground hover:bg-muted/20 flex items-center justify-start border-t pl-2 text-xs transition-colors"
						style="height: {100 / timeslots.length}%;"
					></div>
				{/each}

				<!-- Classes for this day -->
				{#each classTimes.filter((c) => c.dayOfWeek === day.value) as cls}
					{@const position = getClassPosition(cls.startTime, cls.duration)}
					<div
						class="from-primary to-primary/80 text-primary-foreground border-primary/20 absolute right-2 left-2 flex flex-col justify-center rounded-lg border bg-gradient-to-br p-3 text-sm font-medium shadow-lg transition-shadow hover:shadow-xl"
						style="top: {position.top}; height: {position.height};"
					>
						<div class="text-sm font-semibold">{cls.subject}</div>
						<div class="mt-1 text-xs opacity-90">{cls.startTime}</div>
					</div>
				{/each}
			</div>
		{/each}
	</div>
</div>
