<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import UsersIcon from '@lucide/svelte/icons/users';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold tracking-tight">Interview Overview</h1>
		<div class="flex gap-2">
			<Button variant="outline" href="/admin/interviews/setup">Edit Configuration</Button>
			{#if data.config && !data.config.isActive}
				<form method="POST" action="?/activate">
					<Button type="submit" class="bg-green-600 hover:bg-green-700">Activate Interviews</Button>
				</form>
			{:else if data.config && data.config.isActive}
				<form method="POST" action="?/deactivate">
					<Button type="submit" variant="destructive">Deactivate Interviews</Button>
				</form>
			{/if}
		</div>
	</div>
	{#if !data.config}
		<Card.Root class="border-red-200 bg-red-50">
			<Card.Header>
				<div class="flex items-center gap-2">
					<CalendarDaysIcon class="text-red-600" />
					<Card.Title class="text-red-800">No Configuration Found</Card.Title>
				</div>
			</Card.Header>
			<Card.Content>
				<p class="text-red-700">
					You need to set up your interview configuration first.
					<Button variant="link" href="/admin/interviews/setup" class="p-0 h-auto text-red-600 underline">Go to setup</Button>
				</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root>
			<Card.Header>
				<div class="flex items-center gap-3">
					<div class="bg-primary rounded-lg p-2">
						<CalendarDaysIcon class="text-primary-foreground" />
					</div>
					<div class="flex-1">
						<Card.Title class="text-lg font-semibold">Configuration Summary</Card.Title>
					</div>
					{#if data.config.isActive}
						<Badge variant="default" class="bg-green-600">Active</Badge>
					{:else}
						<Badge variant="secondary">Draft</Badge>
					{/if}
				</div>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<div class="space-y-2">
						<div class="flex items-center gap-2">
							<UsersIcon class="text-muted-foreground" />
							<span class="text-sm font-medium">Scope</span>
						</div>
						<p class="text-sm text-muted-foreground">
							{data.config.wholeSchool ? 'Whole School' : `Year Levels: ${Array.isArray(data.config.yearLevels) ? data.config.yearLevels.join(', ') : 'None'}`}
						</p>
					</div>
					<div class="space-y-2">
						<div class="flex items-center gap-2">
							<ClockIcon class="text-muted-foreground" />
							<span class="text-sm font-medium">Duration</span>
						</div>
						<p class="text-sm text-muted-foreground">{data.config.durationMinutes} minutes</p>
					</div>
					<div class="space-y-2">
						<div class="flex items-center gap-2">
							<CalendarDaysIcon class="text-muted-foreground" />
							<span class="text-sm font-medium">Dates</span>
						</div>
						<p class="text-sm text-muted-foreground">{Array.isArray(data.config.interviewDates) ? data.config.interviewDates.length : 0} date(s)</p>
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
		{#if data.stats}
			<Card.Root>
				<Card.Header>
					<Card.Title>Statistics</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="grid gap-4 md:grid-cols-3">
						<div class="text-center">
							<div class="text-2xl font-bold text-primary">{data.stats.totalSlots}</div>
							<p class="text-sm text-muted-foreground">Total Slots</p>
						</div>
						<div class="text-center">
							<div class="text-2xl font-bold text-green-600">{data.stats.availableSlots}</div>
							<p class="text-sm text-muted-foreground">Available</p>
						</div>
						<div class="text-center">
							<div class="text-2xl font-bold text-blue-600">{data.stats.bookedSlots}</div>
							<p class="text-sm text-muted-foreground">Booked</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		{/if}
		
		{#if data.teacherSlots && data.teacherSlots.length > 0}
			<Card.Root>
				<Card.Header>
					<Card.Title>Generated Slots by Date</Card.Title>
					<Card.Description>
						Interview slots organized by date and teacher 
						{#if data.teacherSlots}
							({data.teacherSlots.length} date{data.teacherSlots.length !== 1 ? 's' : ''})
						{/if}
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="space-y-6">
						{#each data.teacherSlots as dateGroup}
							<div class="space-y-3">
								<h3 class="text-lg font-semibold text-primary border-b pb-2">
									{new Date(dateGroup.date).toLocaleDateString('en-AU', { 
										weekday: 'long', 
										year: 'numeric', 
										month: 'long', 
										day: 'numeric' 
									})}
								</h3>
								<div class="space-y-4">
									{#each dateGroup.teachers as teacherGroup}
										<div class="border rounded-lg p-4 bg-gray-50">
											<div class="flex items-center justify-between mb-3">
												<div>
													<h4 class="font-medium text-gray-900">{teacherGroup.teacher.name}</h4>
													<p class="text-sm text-gray-600">{teacherGroup.teacher.email}</p>
												</div>
												<Badge variant="outline">{teacherGroup.slots.length} slots</Badge>
											</div>
											<div class="grid gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
												{#each teacherGroup.slots as slot}
													<div class="text-xs p-2 border rounded bg-white shadow-sm text-center">
														<div class="font-medium text-gray-900">
															{slot.startTime}-{slot.endTime}
														</div>
														{#if slot.classId}
															<div class="text-xs text-blue-600 mt-1">
																C{slot.classId}
															</div>
														{/if}
														{#if slot.status !== 'available'}
															<div class="mt-1">
																<Badge variant="secondary" class="text-xs px-1 py-0">
																	{slot.status}
																</Badge>
															</div>
														{/if}
													</div>
												{/each}
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>
		{/if}
	{/if}
</div>
