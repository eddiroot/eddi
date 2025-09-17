<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import UserIcon from '@lucide/svelte/icons/user';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto space-y-8 p-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold tracking-tight">My Interview Slots</h1>
	</div>
	{#if !data.config || !data.config.isActive}
		<Card.Root class="border-yellow-200 bg-yellow-50">
			<Card.Header>
				<div class="flex items-center gap-2">
					<CalendarDaysIcon class="h-4 w-4 text-yellow-600" />
					<Card.Title class="text-yellow-800">Interviews Not Active</Card.Title>
				</div>
			</Card.Header>
			<Card.Content>
				<p class="text-yellow-700">
					Parent-teacher interviews have not been activated by the administration yet. You'll be
					able to manage your interview slots once they're activated.
				</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root>
			<Card.Header>
				<Card.Title>Interview Configuration</Card.Title>
			</Card.Header>
			<Card.Content class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div class="space-y-2">
					<div class="flex items-center gap-2">
						<ClockIcon class="text-muted-foreground h-4 w-4" />
						<span class="text-sm font-medium">Duration</span>
					</div>
					<p class="text-muted-foreground text-sm">
						{data.config.durationMinutes} minutes per interview
					</p>
				</div>
				<div class="space-y-2">
					<div class="flex items-center gap-2">
						<CalendarDaysIcon class="text-muted-foreground h-4 w-4" />
						<span class="text-sm font-medium">Interview Dates</span>
					</div>
					<p class="text-muted-foreground text-sm">
						{Array.isArray(data.config.interviewDates) ? data.config.interviewDates.length : 0} date{(Array.isArray(
							data.config.interviewDates
						)
							? data.config.interviewDates.length
							: 0) !== 1
							? 's'
							: ''} configured
					</p>
				</div>
				<div class="space-y-2">
					<div class="flex items-center gap-2">
						<UserIcon class="text-muted-foreground h-4 w-4" />
						<span class="text-sm font-medium">My Slots</span>
					</div>
					<p class="text-muted-foreground text-sm">
						{data.teacherSlots.length} slot{data.teacherSlots.length !== 1 ? 's' : ''} total
					</p>
				</div>
			</Card.Content>
		</Card.Root>
		{#if data.stats}
			<Card.Root>
				<Card.Header>
					<Card.Title>Slot Statistics</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="grid gap-4 md:grid-cols-4">
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
						<div class="text-center">
							<div class="text-2xl font-bold text-orange-600">{data.stats.blockedSlots}</div>
							<p class="text-muted-foreground text-sm">Blocked</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		{/if}

		{#if data.groupedSlots && data.groupedSlots.length > 0}
			<div class="space-y-4">
				{#each data.groupedSlots as group}
					<Card.Root>
						<Card.Header>
							<div class="flex items-center justify-between">
								<Card.Title class="text-lg">{group.className}</Card.Title>
								<Badge variant="outline">{group.slots.length} slots</Badge>
							</div>
						</Card.Header>
						<Card.Content>
							<div class="grid gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
								{#each group.slots as slot}
									<div class="space-y-1 rounded border p-2 text-center">
										<div class="text-xs font-medium">{slot.date}</div>
										<div class="text-muted-foreground text-xs">
											{slot.startTime}-{slot.endTime}
										</div>
										{#if slot.status !== 'available'}
											<Badge
												variant={slot.status === 'booked' ? 'secondary' : 'destructive'}
												class="px-1 py-0 text-xs"
											>
												{slot.status}
											</Badge>
										{/if}
										{#if slot.status !== 'booked'}
											<form method="POST" action="?/toggleSlotStatus" class="mt-1">
												<input type="hidden" name="slotId" value={slot.id} />
												<input type="hidden" name="currentStatus" value={slot.status} />
												<Button
													type="submit"
													variant="outline"
													size="sm"
													class="h-6 w-full py-1 text-xs"
												>
													{#if slot.status === 'available'}
														<EyeOffIcon class="mr-1 h-2 w-2" />
														Block
													{:else}
														<EyeIcon class="mr-1 h-2 w-2" />
														Unblock
													{/if}
												</Button>
											</form>
										{/if}
									</div>
								{/each}
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		{:else if data.config}
			<Card.Root class="border-blue-200 bg-blue-50">
				<Card.Header>
					<div class="flex items-center gap-2">
						<UserIcon class="h-4 w-4 text-blue-600" />
						<Card.Title class="text-blue-800">No Slots Generated</Card.Title>
					</div>
				</Card.Header>
				<Card.Content>
					<p class="text-blue-700">
						No interview slots have been generated for you yet. Please contact the administration if
						you should have interview slots.
					</p>
				</Card.Content>
			</Card.Root>
		{/if}
	{/if}
</div>
