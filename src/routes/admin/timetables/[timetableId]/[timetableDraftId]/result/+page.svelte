<script lang="ts">
	import { enhance } from '$app/forms';
	import Autocomplete from '$lib/components/autocomplete.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import { days } from '$lib/utils.js';
	import type { UserStatistics } from '../../../../../../scripts/process/statistics';
	import type { ActionData, PageData } from './$types';
	import { studentColumns } from './student-columns.js';
	import StudentDataTable from './student-data-table.svelte';
	import { teacherColumns } from './teacher-columns.js';
	import TeacherDataTable from './teacher-data-table.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Current active section
	let activeSection = $state<string>('overall');

	// Navigation items - typed for better type safety
	const navItems = [
		{ id: 'overall' as const, label: 'Overall Statistics', icon: '📊' },
		{ id: 'students' as const, label: 'Student Statistics', icon: '👨‍🎓' },
		{ id: 'teachers' as const, label: 'Teacher Statistics', icon: '👨‍🏫' },
		{ id: 'student-timetable' as const, label: 'Student Timetable', icon: '📅' },
		{ id: 'room-timetable' as const, label: 'Room Timetable', icon: '🏫' }
	] as const;

	// Get student and teacher statistics from the page data
	const studentData = $derived((data.studentStatistics || []) as UserStatistics[]);
	const teacherData = $derived((data.teacherStatistics || []) as UserStatistics[]);

	// User search state for student timetable
	let selectedUserId = $state<string | undefined>(form?.selectedUserId);
	let searchForm: HTMLFormElement | null = $state(null);

	// Space search state for room timetable
	let selectedSpaceId = $state<number | undefined>(form?.selectedSpaceId);
	let spaceSearchForm: HTMLFormElement | null = $state(null);

	// Prepare user options for autocomplete
	const userOptions = $derived(
		data.allUsers.map((user) => ({
			value: user.id,
			label: `${user.firstName} ${user.lastName} (${user.email}) - ${user.type}`
		}))
	);

	// Prepare space options for autocomplete
	const spaceOptions = $derived(
		data.allSpaces.map((space) => ({
			value: space.id,
			label: `${space.name} (${space.type}${space.capacity ? ` - Capacity: ${space.capacity}` : ''})`
		}))
	);

	// Get the selected user for display
	const selectedUser = $derived(
		selectedUserId ? data.allUsers.find((u) => u.id === selectedUserId) : null
	);

	// Get the selected space for display
	const selectedSpace = $derived(
		selectedSpaceId ? data.allSpaces.find((s) => s.id === selectedSpaceId) : null
	);

	// Handle user selection
	function handleUserSelect(option: { value: string | number; label: string }) {
		console.log('User selected:', option);
		selectedUserId = option.value as string;
		// Use setTimeout to ensure the DOM updates before submitting
		setTimeout(() => {
			if (selectedUserId && searchForm) {
				console.log('Submitting form with userId:', selectedUserId);
				searchForm.requestSubmit();
			} else {
				console.error('Cannot submit: selectedUserId or searchForm is missing', {
					selectedUserId,
					searchForm
				});
			}
		}, 0);
	}

	// Handle space selection
	function handleSpaceSelect(option: { value: string | number; label: string }) {
		console.log('Space selected:', option);
		selectedSpaceId = option.value as number;
		// Use setTimeout to ensure the DOM updates before submitting
		setTimeout(() => {
			if (selectedSpaceId && spaceSearchForm) {
				console.log('Submitting form with spaceId:', selectedSpaceId);
				spaceSearchForm.requestSubmit();
			} else {
				console.error('Cannot submit: selectedSpaceId or spaceSearchForm is missing', {
					selectedSpaceId,
					spaceSearchForm
				});
			}
		}, 0);
	}

	// Helper to get day name from day number
	function getDayName(dayNumber: number): string {
		const day = days.find((d) => d.number === dayNumber);
		return day?.name || `Day ${dayNumber}`;
	}

	// Format time for display
	function formatTime(timeString: string): string {
		if (!timeString) return '';
		// timeString is in HH:MM:SS format, we want HH:MM
		return timeString.slice(0, 5);
	}

	// Group activities by day
	const activitiesByDay = $derived(() => {
		if (!form?.userActivities) return new Map();

		const grouped = new Map<number, typeof form.userActivities>();

		form.userActivities.forEach((activity) => {
			if (!grouped.has(activity.day)) {
				grouped.set(activity.day, []);
			}
			grouped.get(activity.day)!.push(activity);
		});

		// Sort activities within each day by period
		grouped.forEach((activities) => {
			activities.sort((a, b) => a.period - b.period);
		});

		return grouped;
	});

	// Group space activities by day
	const spaceActivitiesByDay = $derived(() => {
		if (!form?.spaceActivities) return new Map();

		const grouped = new Map<number, typeof form.spaceActivities>();

		form.spaceActivities.forEach((activity) => {
			if (!grouped.has(activity.day)) {
				grouped.set(activity.day, []);
			}
			grouped.get(activity.day)!.push(activity);
		});

		// Sort activities within each day by period
		grouped.forEach((activities) => {
			activities.sort((a, b) => a.period - b.period);
		});

		return grouped;
	});

	// Get period time for an activity
	function getPeriodTime(periodId: number): { start: string; end: string } | null {
		if (!form?.timetablePeriods) return null;
		const period = form.timetablePeriods.find((p) => p.id === periodId);
		if (!period) return null;
		return {
			start: formatTime(period.startTime),
			end: formatTime(period.endTime)
		};
	}
</script>

<div class="container mx-auto space-y-6 p-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">Timetable Results</h1>
	</div>

	<Tabs.Root bind:value={activeSection}>
		<Tabs.List class="grid w-full grid-cols-5">
			{#each navItems as item (item.id)}
				<Tabs.Trigger value={item.id} class="flex items-center gap-2">
					<span>{item.icon}</span>
					<span class="hidden sm:inline">{item.label}</span>
				</Tabs.Trigger>
			{/each}
		</Tabs.List>

		<Tabs.Content value="overall" class="space-y-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>Overall Statistics</Card.Title>
				</Card.Header>
				<Card.Content>
					<p>This is the Overall Statistics page</p>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="students" class="space-y-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>Student Statistics</Card.Title>
					<Card.Description>Detailed statistics for all students in the timetable</Card.Description>
				</Card.Header>
				<Card.Content>
					<StudentDataTable data={studentData} columns={studentColumns} />
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="teachers" class="space-y-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>Teacher Statistics</Card.Title>
					<Card.Description>Detailed statistics for all teachers in the timetable</Card.Description>
				</Card.Header>
				<Card.Content>
					<TeacherDataTable data={teacherData} columns={teacherColumns} />
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="student-timetable" class="space-y-4">
			<!-- User Search Card -->
			<Card.Root>
				<Card.Header>
					<Card.Title>View Student Timetable</Card.Title>
					<Card.Description>Search by first name, last name, or email address</Card.Description>
				</Card.Header>
				<Card.Content>
					<form
						bind:this={searchForm}
						method="POST"
						action="?/getUserTimetable"
						use:enhance
						class="space-y-4"
					>
						<input type="hidden" name="userId" value={selectedUserId || ''} />

						<div class="space-y-2">
							<label for="user-select" class="text-sm font-medium">Student or Teacher</label>
							<Autocomplete
								options={userOptions}
								bind:value={selectedUserId}
								placeholder="Select a user..."
								searchPlaceholder="Search users..."
								emptyText="No users found"
								onselect={handleUserSelect}
							/>
						</div>
					</form>
				</Card.Content>
			</Card.Root>

			<!-- Selected User Display -->
			{#if selectedUser}
				<Card.Root>
					<Card.Header>
						<Card.Title>
							Timetable for {selectedUser.firstName}
							{selectedUser.lastName}
						</Card.Title>
						<Card.Description>
							{selectedUser.email} • {selectedUser.type}
						</Card.Description>
					</Card.Header>
				</Card.Root>
			{/if}

			<!-- Activities Display -->
			{#if form?.userActivities && form.userActivities.length > 0}
				<Card.Root>
					<Card.Header>
						<Card.Title>Weekly Schedule</Card.Title>
						<Card.Description>
							{form.userActivities.length} total activities across the week
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
							{#each Array.from(activitiesByDay()).sort((a, b) => a[0] - b[0]) as [dayNumber, activities]}
								<div class="space-y-3">
									<div class="bg-background sticky top-0 z-10 pb-2">
										<h3 class="flex items-center gap-2 text-lg font-semibold">
											<span>📅</span>
											{getDayName(dayNumber)}
										</h3>
										<p class="text-muted-foreground text-sm">{activities.length} activities</p>
									</div>
									<div class="space-y-2">
										{#each activities as activity}
											{@const periodTime = getPeriodTime(activity.period)}
											<div
												class="hover:bg-muted/50 bg-card rounded-lg border p-3 transition-colors"
											>
												<div class="space-y-2">
													<Badge variant="secondary" class="w-fit text-xs">
														{#if periodTime}
															{periodTime.start} - {periodTime.end}
														{:else}
															Period {activity.period}
														{/if}
													</Badge>
													<div class="text-sm font-semibold">{activity.subjectName}</div>
													<div class="text-muted-foreground space-y-1 text-xs">
														{#if activity.spaceName}
															<div class="flex items-center gap-1">
																<span>🏫</span>
																<span class="truncate">{activity.spaceName}</span>
															</div>
														{/if}
														{#if activity.duration > 1}
															<div class="flex items-center gap-1">
																<span>⏱️</span>
																{activity.duration} periods
															</div>
														{/if}
													</div>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</Card.Content>
				</Card.Root>
			{:else if selectedUserId && form !== null}
				<Card.Root>
					<Card.Content class="py-8">
						<div class="text-muted-foreground text-center">
							<p class="text-lg">No activities found for this user</p>
							<p class="mt-2 text-sm">
								This user may not have any scheduled activities in the current timetable.
							</p>
						</div>
					</Card.Content>
				</Card.Root>
			{/if}
		</Tabs.Content>

		<Tabs.Content value="room-timetable" class="space-y-4">
			<!-- Space Search Card -->
			<Card.Root>
				<Card.Header>
					<Card.Title>View Room Timetable</Card.Title>
					<Card.Description>Search by room/space name or type</Card.Description>
				</Card.Header>
				<Card.Content>
					<form
						bind:this={spaceSearchForm}
						method="POST"
						action="?/getSpaceTimetable"
						use:enhance
						class="space-y-4"
					>
						<input type="hidden" name="spaceId" value={selectedSpaceId || ''} />

						<div class="space-y-2">
							<label for="space-select" class="text-sm font-medium">Room/Space</label>
							<Autocomplete
								options={spaceOptions}
								bind:value={selectedSpaceId}
								placeholder="Select a room..."
								searchPlaceholder="Search rooms..."
								emptyText="No rooms found"
								onselect={handleSpaceSelect}
							/>
						</div>
					</form>
				</Card.Content>
			</Card.Root>

			<!-- Selected Space Display -->
			{#if selectedSpace}
				<Card.Root>
					<Card.Header>
						<Card.Title>
							Timetable for {selectedSpace.name}
						</Card.Title>
						<Card.Description>
							{selectedSpace.type}{selectedSpace.capacity
								? ` • Capacity: ${selectedSpace.capacity}`
								: ''}
						</Card.Description>
					</Card.Header>
				</Card.Root>
			{/if}

			<!-- Space Activities Display -->
			{#if form?.spaceActivities && form.spaceActivities.length > 0}
				<Card.Root>
					<Card.Header>
						<Card.Title>Weekly Schedule</Card.Title>
						<Card.Description>
							{form.spaceActivities.length} total bookings across the week
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
							{#each Array.from(spaceActivitiesByDay()).sort((a, b) => a[0] - b[0]) as [dayNumber, activities]}
								<div class="space-y-3">
									<div class="bg-background sticky top-0 z-10 pb-2">
										<h3 class="flex items-center gap-2 text-lg font-semibold">
											<span>📅</span>
											{getDayName(dayNumber)}
										</h3>
										<p class="text-muted-foreground text-sm">{activities.length} bookings</p>
									</div>
									<div class="space-y-2">
										{#each activities as activity}
											{@const periodTime = getPeriodTime(activity.period)}
											<div
												class="hover:bg-muted/50 bg-card rounded-lg border p-3 transition-colors"
											>
												<div class="space-y-2">
													<Badge variant="secondary" class="w-fit text-xs">
														{#if periodTime}
															{periodTime.start} - {periodTime.end}
														{:else}
															Period {activity.period}
														{/if}
													</Badge>
													<div class="text-sm font-semibold">{activity.subjectName}</div>
													<div class="text-muted-foreground space-y-1 text-xs">
														{#if activity.duration > 1}
															<div class="flex items-center gap-1">
																<span>⏱️</span>
																{activity.duration} periods
															</div>
														{/if}
													</div>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</Card.Content>
				</Card.Root>
			{:else if selectedSpaceId && form !== null}
				<Card.Root>
					<Card.Content class="py-8">
						<div class="text-muted-foreground text-center">
							<p class="text-lg">No bookings found for this room</p>
							<p class="mt-2 text-sm">
								This room may not have any scheduled activities in the current timetable.
							</p>
						</div>
					</Card.Content>
				</Card.Root>
			{/if}
		</Tabs.Content>
	</Tabs.Root>
</div>
