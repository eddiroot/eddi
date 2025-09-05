<script lang="ts">
	import TimetableCard from '$lib/components/timetable-card.svelte';
	import EventCard from '$lib/components/event-card.svelte';
	import { days } from '$lib/utils';
	import { generateTimeslots, getClassPosition, getEventPosition } from './utils.js';
	import * as Button from '$lib/components/ui/button';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let classAllocation = $state(form?.classAllocation || data.classAllocation);
	let schoolEvents = $state(form?.schoolEvents || data.schoolEvents || []);
	let campusEvents = $state(form?.campusEvents || data.campusEvents || []);
	let subjectOfferingEvents = $state(
		form?.subjectOfferingEvents || data.subjectOfferingEvents || []
	);
	let subjectOfferingClassEvents = $state(
		form?.subjectOfferingClassEvents || data.subjectOfferingClassEvents || []
	);
	let currentWeekStart = $state(form?.currentWeekStart || data.currentWeekStart);

	let timeslots = generateTimeslots(8, 17);
	const slotHeightPx = 60; // Static height for each time slot

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

	function getMondayOfWeek(date: Date): Date {
		const dayOfWeek = date.getDay();
		const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
		const monday = new Date(date);
		monday.setDate(date.getDate() + mondayOffset);
		return monday;
	}

	// Helper function to get events for a specific day
	function getEventsForDay(dayValue: string) {
		const allEvents = [
			...schoolEvents.map((e) => ({
				...e.event,
				type: 'school' as const,
				subject: undefined,
				subjectOfferingId: undefined as number | undefined
			})),
			...campusEvents.map((e) => ({
				...e.event,
				type: 'campus' as const,
				subject: undefined,
				subjectOfferingId: undefined as number | undefined
			})),
			...subjectOfferingEvents.map((e) => ({
				...e.event,
				type: 'subject' as const,
				subject: { name: e.subject.name, className: undefined },
				subjectOfferingId: e.subjectOffering.id
			})),
			...subjectOfferingClassEvents.map((e) => ({
				...e.event,
				type: 'class' as const,
				subject: { name: e.subject.name, className: e.subjectOfferingClass.name },
				subjectOfferingId: e.subjectOffering.id
			}))
		];

		return allEvents.filter((event) => {
			const dayOfWeek = event.startTimestamp.getDay();
			const dayIndex = dayOfWeek === 0 ? -1 : dayOfWeek - 1;
			return dayIndex >= 0 && dayIndex < days.length && days[dayIndex].value === dayValue;
		});
	}

	// Helper function to get subject color by subject offering ID
	function getSubjectColor(subjectOfferingId?: number): number | undefined {
		if (!subjectOfferingId || !classAllocation) return undefined;

		const allocation = classAllocation.find((c) => c.subjectOffering.id === subjectOfferingId);
		return allocation?.userSubjectOffering.color;
	}
</script>

<div class="h-full space-y-4 p-8">
	<!-- Week Navigation -->
	<div class="flex items-center justify-between">
		<form
			method="POST"
			action="?/changeWeek"
			use:enhance={({ formData, submitter }) => {
				const currentWeek = new Date(currentWeekStart);
				currentWeek.setDate(currentWeek.getDate() - 7);
				const newWeekStart = getMondayOfWeek(currentWeek);
				const weekParam = newWeekStart.toISOString().split('T')[0];
				formData.set('week', weekParam);

				return async ({ result }) => {
					if (
						result.type === 'success' &&
						result.data &&
						typeof result.data === 'object' &&
						'classAllocation' in result.data &&
						'currentWeekStart' in result.data
					) {
						classAllocation = result.data.classAllocation as typeof classAllocation;
						schoolEvents = (result.data.schoolEvents as typeof schoolEvents) || [];
						subjectOfferingEvents =
							(result.data.subjectOfferingEvents as typeof subjectOfferingEvents) || [];
						subjectOfferingClassEvents =
							(result.data.subjectOfferingClassEvents as typeof subjectOfferingClassEvents) || [];
						currentWeekStart = result.data.currentWeekStart as string;
					}
				};
			}}
		>
			<Button.Root variant="outline" size="sm" type="submit">
				<ChevronLeft />
				Previous Week
			</Button.Root>
		</form>

		<div class="text-center text-lg font-semibold">
			Week of {formatWeekDisplay(currentWeekStart)}
		</div>

		<form
			method="POST"
			action="?/changeWeek"
			use:enhance={({ formData, submitter }) => {
				const currentWeek = new Date(currentWeekStart);
				currentWeek.setDate(currentWeek.getDate() + 7);
				const newWeekStart = getMondayOfWeek(currentWeek);
				const weekParam = newWeekStart.toISOString().split('T')[0];
				formData.set('week', weekParam);

				return async ({ result }) => {
					if (
						result.type === 'success' &&
						result.data &&
						typeof result.data === 'object' &&
						'classAllocation' in result.data &&
						'currentWeekStart' in result.data
					) {
						classAllocation = result.data.classAllocation as typeof classAllocation;
						schoolEvents = (result.data.schoolEvents as typeof schoolEvents) || [];
						subjectOfferingEvents =
							(result.data.subjectOfferingEvents as typeof subjectOfferingEvents) || [];
						subjectOfferingClassEvents =
							(result.data.subjectOfferingClassEvents as typeof subjectOfferingClassEvents) || [];
						currentWeekStart = result.data.currentWeekStart as string;
					}
				};
			}}
		>
			<Button.Root variant="outline" size="sm" type="submit">
				Next Week
				<ChevronRight />
			</Button.Root>
		</form>
	</div>

	<!-- Day titles -->
	<div class="grid grid-cols-[50px_1fr_1fr_1fr_1fr_1fr]">
		<div class="text-center text-base font-semibold text-transparent">Time</div>
		{#each days as day}
			<div
				class="border-primary/20 text-foreground hidden text-center text-base font-semibold md:block"
			>
				{day.name}
			</div>
			<div class="border-primary/20 text-foreground text-center text-base font-semibold md:hidden">
				{day.shortName}
			</div>
		{/each}
	</div>

	<!-- Timetable grid -->
	<div
		class="relative grid grid-cols-[50px_1fr_1fr_1fr_1fr_1fr] overflow-auto pt-3"
		style="height: {timeslots.length * slotHeightPx + 12}px;"
	>
		<!-- Time legend column -->
		<div class="bg-background relative">
			{#each timeslots as slot}
				<div
					class="text-muted-foreground flex items-start justify-start pr-4 text-xs"
					style="height: {slotHeightPx}px; transform: translateY(-8px);"
				>
					{slot}
				</div>
			{/each}
		</div>

		{#each days as day}
			<div class="border-border relative border-r last:border-r-0">
				<!-- Background timeslot lines -->
				{#each timeslots}
					<div class="border-border border-t" style="height: {slotHeightPx}px;"></div>
				{/each}

				<!-- Classes for this day -->
				{#each (classAllocation ?? []).filter((c) => {
					const dayOfWeek = c.classAllocation.startTimestamp.getDay();
					const dayIndex = dayOfWeek === 0 ? -1 : dayOfWeek - 1;
					return dayIndex >= 0 && dayIndex < days.length && days[dayIndex].value === day.value;
				}) as cls}
					{@const position = getClassPosition(
						8,
						cls.classAllocation.startTimestamp,
						cls.classAllocation.endTimestamp,
						60
					)}
					<div
						style="position: absolute; top: {position.top}; height: {position.height}; left: 4px; right: 4px; z-index: 20;"
					>
						<TimetableCard {cls} href="/subjects/{cls.subjectOffering.id}" />
					</div>
				{/each}

				<!-- Events for this day -->
				{#each getEventsForDay(day.value) as event, eventIndex}
					{@const position = getEventPosition(
						8,
						event.startTimestamp,
						event.endTimestamp,
						eventIndex,
						60
					)}
					<div
						style="position: absolute; top: {position.top}; height: {position.height}; left: 60%; right: 4px; z-index: 30;"
					>
						<EventCard
							{event}
							eventType={event.type}
							subjectInfo={event.subject}
							subjectColor={getSubjectColor(event.subjectOfferingId)}
						/>
					</div>
				{/each}
			</div>
		{/each}
	</div>
</div>
