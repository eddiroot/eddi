<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import UsersIcon from '@lucide/svelte/icons/users';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold tracking-tight">Parent-Teacher Interviews</h1>
		<div class="flex gap-2">
			<Button variant="outline" href="/admin/interviews/setup">Edit Configuration</Button>
			<Button variant="outline" href="/admin/interviews/notify">Notify Teachers</Button>
		</div>
	</div>

	<!-- Active Configuration Summary -->
	<Card.Root>
		<Card.Header>
			<div class="flex items-center gap-3">
				<div class="rounded-lg bg-green-600 p-2">
					<CheckCircleIcon class="text-white" />
				</div>
				<div class="flex-1">
					<Card.Title class="text-lg font-semibold">Active Configuration</Card.Title>
					<Card.Description
						>Parent-teacher interviews are currently active and available to teachers.</Card.Description
					>
				</div>
				<Badge variant="default" class="bg-green-600">Active</Badge>
			</div>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<div class="space-y-2">
					<div class="flex items-center gap-2">
						<UsersIcon class="text-muted-foreground" />
						<span class="text-sm font-medium">Scope</span>
					</div>
					<p class="text-muted-foreground text-sm">
						{data.config.wholeSchool
							? 'Whole School'
							: `Year Levels: ${Array.isArray(data.config.yearLevels) ? data.config.yearLevels.join(', ') : 'None'}`}
					</p>
				</div>
				<div class="space-y-2">
					<div class="flex items-center gap-2">
						<ClockIcon class="text-muted-foreground" />
						<span class="text-sm font-medium">Duration</span>
					</div>
					<p class="text-muted-foreground text-sm">{data.config.durationMinutes} minutes</p>
				</div>
				<div class="space-y-2">
					<div class="flex items-center gap-2">
						<CalendarDaysIcon class="text-muted-foreground" />
						<span class="text-sm font-medium">Dates</span>
					</div>
					<p class="text-muted-foreground text-sm">
						{Array.isArray(data.config.interviewDates) ? data.config.interviewDates.length : 0} date(s)
					</p>
				</div>
			</div>
			{#if Array.isArray(data.config.interviewDates) && data.config.interviewDates.length > 0}
				<div class="space-y-2">
					<h4 class="font-medium">Interview Dates</h4>
					<div class="flex flex-wrap gap-2">
						{#each data.config.interviewDates as date}
							<Badge variant="outline">{date}</Badge>
						{/each}
					</div>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Statistics -->
	{#if data.stats}
		<Card.Root>
			<Card.Header>
				<Card.Title>Statistics</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="grid gap-4 md:grid-cols-3">
					<div class="text-center">
						<div class="text-primary text-2xl font-bold">{data.stats.totalSlots}</div>
						<p class="text-muted-foreground text-sm">Total Slots</p>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-green-600">{data.stats.availableSlots}</div>
						<p class="text-muted-foreground text-sm">Available</p>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-blue-600">{data.stats.bookedSlots}</div>
						<p class="text-muted-foreground text-sm">Booked</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
