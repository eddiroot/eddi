<script lang="ts">
	import { enhance } from '$app/forms';
	import { Badge } from '$lib/components/ui/badge';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import CheckCircleIcon from '@lucide/svelte/icons/circle-check';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
	import AlertTriangleIcon from '@lucide/svelte/icons/triangle-alert';
	import UserIcon from '@lucide/svelte/icons/user';
	import UsersIcon from '@lucide/svelte/icons/users';
	import type { TeacherStatistics, TimetableMetadata } from './timetable';

	// Receive data from the server
	let { data, form } = $props();

	// Extract data from server response or form action response
	let teacherStatisticsReport = $state(
		form?.teacherStatisticsReport || data.teacherStatisticsReport
	);
	let studentStatisticsReport = $state(
		form?.studentStatisticsReport || data.studentStatisticsReport
	);
	let completedDrafts = $state(form?.completedDrafts || data.completedDrafts);
	let selectedDraftId = $state(form?.selectedDraftId || data.selectedDraftId);

	// Derived values
	const timetableData: TimetableMetadata = $derived(teacherStatisticsReport.metadata);
	const teacherStatistics: TeacherStatistics = $derived(teacherStatisticsReport.teachers);

	// Parse student statistics from server data (if available)
	const parsedStudentStatistics = $derived(
		studentStatisticsReport
			? {
					metadata: studentStatisticsReport.metadata,
					overall: studentStatisticsReport.overall,
					yearLevels: studentStatisticsReport.yearLevels,
					groups: studentStatisticsReport.groups,
					subgroups: studentStatisticsReport.subgroups
				}
			: null
	);

	const brokenConstraints = [
		{
			type: 'Hard Constraint',
			description: 'Teacher T007 has overlapping classes',
			severity: 'high'
		},
		{
			type: 'Soft Constraint',
			description: 'Room R101 over-utilized during Period 3',
			severity: 'medium'
		},
		{
			type: 'Soft Constraint',
			description: 'Teacher T015 has 4 consecutive periods',
			severity: 'low'
		}
	];

	// Current selected view
	let selectedView = $state('teacher-statistics');
	let showConfirmDialog = $state(false);

	const viewOptions = [
		{ id: 'student-statistics', label: 'Student Statistics', icon: GraduationCapIcon },
		{ id: 'teacher-statistics', label: 'Teacher Statistics', icon: UserIcon },
		{ id: 'broken-constraints', label: 'View Broken Constraints', icon: AlertTriangleIcon },
		{ id: 'user-timetable', label: 'View Timetable for a given User', icon: UsersIcon },
		{ id: 'space-timetable', label: 'View Timetable for a given Space', icon: CalendarIcon }
	];

	function handleConfirmTimetable() {
		// Handle timetable confirmation logic here
		// This could submit to a server action or redirect to another page
		showConfirmDialog = false;
	}

	function formatDate(date: Date | string) {
		return new Date(date).toLocaleString();
	}
</script>

{#snippet iconComponent(IconComponent: any)}
	<IconComponent class="text-primary h-6 w-6" />
{/snippet}

<div class="space-y-8">
	<!-- Header Section -->
	<div class="flex items-center justify-between">
		<div class="space-y-2">
			<div class="flex items-center gap-3">
				<div class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
					<CheckCircleIcon class="h-6 w-6 text-green-600" />
				</div>
				<div>
					<h1 class="text-3xl font-bold">Timetable Generation Results!</h1>
					<p class="text-muted-foreground">
						{timetableData.institutionName} • Generated on {timetableData.generatedAt}
					</p>
				</div>
			</div>
		</div>
		<div class="flex items-center gap-4">
			<!-- Draft Selector -->
			{#if completedDrafts && completedDrafts.length > 1}
				<form
					method="POST"
					action="?/changeDraft"
					use:enhance={() => {
						return async ({ result }) => {
							if (
								result.type === 'success' &&
								result.data &&
								typeof result.data === 'object' &&
								'teacherStatisticsReport' in result.data &&
								'studentStatisticsReport' in result.data
							) {
								teacherStatisticsReport = result.data
									.teacherStatisticsReport as typeof teacherStatisticsReport;
								studentStatisticsReport = result.data
									.studentStatisticsReport as typeof studentStatisticsReport;
								completedDrafts = result.data.completedDrafts as typeof completedDrafts;
								selectedDraftId = result.data.selectedDraftId as number;
							}
						};
					}}
				>
					<div class="flex items-center gap-2">
						<span class="text-muted-foreground text-sm font-medium">Draft:</span>
						<select
							name="timetableDraftId"
							class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-10 w-[200px] items-center justify-between rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
							onchange={(e) => {
								e.currentTarget.form?.requestSubmit();
							}}
						>
							{#each completedDrafts as draft}
								<option
									value={draft.timetableDraftId.toString()}
									selected={draft.timetableDraftId === selectedDraftId}
								>
									Draft #{draft.timetableDraftId} ({formatDate(draft.createdAt)})
								</option>
							{/each}
						</select>
					</div>
				</form>
			{/if}
			<Button size="lg" class="gap-2">
				<DownloadIcon />
				Download Timetable
			</Button>
		</div>
	</div>

	<!-- Navigation Cards -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
		{#each viewOptions as option}
			<Card.Root
				class="cursor-pointer transition-all hover:shadow-md {selectedView === option.id
					? 'ring-primary bg-primary/5 ring-2'
					: ''}"
				onclick={() => (selectedView = option.id)}
			>
				<Card.Content class="flex flex-col items-center gap-3 p-0 text-center">
					<div class="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
						{@render iconComponent(option.icon)}
					</div>
					<p class="leading-tight font-medium">{option.label}</p>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>

	<!-- Main Content Area -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				{#if selectedView === 'teacher-statistics'}
					<UserIcon class="h-5 w-5" />
					Teacher Statistics
				{:else if selectedView === 'student-statistics'}
					<GraduationCapIcon class="h-5 w-5" />
					Student Statistics
				{:else if selectedView === 'broken-constraints'}
					<AlertTriangleIcon class="h-5 w-5" />
					Broken Constraints
				{:else if selectedView === 'user-timetable'}
					<UsersIcon class="h-5 w-5" />
					User Timetable
				{:else if selectedView === 'space-timetable'}
					<CalendarIcon class="h-5 w-5" />
					Space Timetable
				{/if}
			</Card.Title>
		</Card.Header>

		<Card.Content>
			{#if selectedView === 'teacher-statistics'}
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<p class="text-muted-foreground">
							Statistics for {teacherStatistics.length} teachers
						</p>
						<Badge variant="secondary">{timetableData.institutionName}</Badge>
					</div>

					<div class="rounded-lg border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Teacher</TableHead>
									<TableHead class="text-center">Hours per week</TableHead>
									<TableHead class="text-center">Free days</TableHead>
									<TableHead class="text-center">Total gaps</TableHead>
									<TableHead class="text-center">Min gaps per day</TableHead>
									<TableHead class="text-center">Max gaps per day</TableHead>
									<TableHead class="text-center">Min hours per day</TableHead>
									<TableHead class="text-center">Max hours per day</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each teacherStatistics as teacher}
									<TableRow>
										<TableCell class="font-medium">{teacher.id}</TableCell>
										<TableCell class="text-center">{teacher.hoursPerWeek}</TableCell>
										<TableCell class="text-center">{teacher.freeDays}</TableCell>
										<TableCell class="text-center">{teacher.totalGaps}</TableCell>
										<TableCell class="text-center">{teacher.minGapsPerDay}</TableCell>
										<TableCell class="text-center">{teacher.maxGapsPerDay}</TableCell>
										<TableCell class="text-center">{teacher.minHoursPerDay}</TableCell>
										<TableCell class="text-center">{teacher.maxHoursPerDay}</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					</div>
				</div>
			{:else if selectedView === 'student-statistics'}
				{#if parsedStudentStatistics}
					<div class="space-y-6">
						<!-- Overview Cards -->
						<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
							<Card.Root>
								<Card.Content class="flex items-center gap-4 p-6">
									<div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
										<UsersIcon class="h-6 w-6 text-blue-600" />
									</div>
									<div>
										<p class="text-2xl font-bold">{parsedStudentStatistics.yearLevels.length}</p>
										<p class="text-muted-foreground text-sm">Year Levels</p>
									</div>
								</Card.Content>
							</Card.Root>

							<Card.Root>
								<Card.Content class="flex items-center gap-4 p-6">
									<div class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
										<GraduationCapIcon class="h-6 w-6 text-green-600" />
									</div>
									<div>
										<p class="text-2xl font-bold">{parsedStudentStatistics.groups.length}</p>
										<p class="text-muted-foreground text-sm">Groups</p>
									</div>
								</Card.Content>
							</Card.Root>

							<Card.Root>
								<Card.Content class="flex items-center gap-4 p-6">
									<div
										class="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100"
									>
										<UsersIcon class="h-6 w-6 text-purple-600" />
									</div>
									<div>
										<p class="text-2xl font-bold">{parsedStudentStatistics.subgroups.length}</p>
										<p class="text-muted-foreground text-sm">Subgroups</p>
									</div>
								</Card.Content>
							</Card.Root>

							<Card.Root>
								<Card.Content class="flex items-center gap-4 p-6">
									<div
										class="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100"
									>
										<CalendarIcon class="h-6 w-6 text-orange-600" />
									</div>
									<div>
										<p class="text-2xl font-bold">
											{parsedStudentStatistics.overall.sum.hoursPerWeek}
										</p>
										<p class="text-muted-foreground text-sm">Total Hours/Week</p>
									</div>
								</Card.Content>
							</Card.Root>
						</div>

						<!-- Overall Statistics -->
						<div class="space-y-4">
							<h3 class="text-lg font-semibold">Overall Statistics</h3>
							<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
								<Card.Root>
									<Card.Header class="pb-2">
										<Card.Title class="text-sm font-medium">Average Per Student</Card.Title>
									</Card.Header>
									<Card.Content class="space-y-2">
										<div class="flex justify-between">
											<span class="text-muted-foreground text-sm">Hours/Week:</span>
											<span class="font-medium"
												>{parsedStudentStatistics.overall.average.hoursPerWeek.toFixed(1)}</span
											>
										</div>
										<div class="flex justify-between">
											<span class="text-muted-foreground text-sm">Free Days:</span>
											<span class="font-medium"
												>{parsedStudentStatistics.overall.average.freeDays.toFixed(1)}</span
											>
										</div>
										<div class="flex justify-between">
											<span class="text-muted-foreground text-sm">Gaps:</span>
											<span class="font-medium"
												>{parsedStudentStatistics.overall.average.gaps.toFixed(1)}</span
											>
										</div>
									</Card.Content>
								</Card.Root>

								<Card.Root>
									<Card.Header class="pb-2">
										<Card.Title class="text-sm font-medium">Minimum Values</Card.Title>
									</Card.Header>
									<Card.Content class="space-y-2">
										<div class="flex justify-between">
											<span class="text-muted-foreground text-sm">Hours/Week:</span>
											<span class="font-medium"
												>{parsedStudentStatistics.overall.min.hoursPerWeek}</span
											>
										</div>
										<div class="flex justify-between">
											<span class="text-muted-foreground text-sm">Hours/Day:</span>
											<span class="font-medium"
												>{parsedStudentStatistics.overall.min.hoursPerDay}</span
											>
										</div>
										<div class="flex justify-between">
											<span class="text-muted-foreground text-sm">Gaps/Day:</span>
											<span class="font-medium"
												>{parsedStudentStatistics.overall.min.gapsPerDay}</span
											>
										</div>
									</Card.Content>
								</Card.Root>

								<Card.Root>
									<Card.Header class="pb-2">
										<Card.Title class="text-sm font-medium">Maximum Values</Card.Title>
									</Card.Header>
									<Card.Content class="space-y-2">
										<div class="flex justify-between">
											<span class="text-muted-foreground text-sm">Hours/Week:</span>
											<span class="font-medium"
												>{parsedStudentStatistics.overall.max.hoursPerWeek}</span
											>
										</div>
										<div class="flex justify-between">
											<span class="text-muted-foreground text-sm">Hours/Day:</span>
											<span class="font-medium"
												>{parsedStudentStatistics.overall.max.hoursPerDay}</span
											>
										</div>
										<div class="flex justify-between">
											<span class="text-muted-foreground text-sm">Gaps/Day:</span>
											<span class="font-medium"
												>{parsedStudentStatistics.overall.max.gapsPerDay}</span
											>
										</div>
									</Card.Content>
								</Card.Root>
							</div>
						</div>

						<!-- Year Level Statistics -->
						<div class="space-y-4">
							<h3 class="text-lg font-semibold">Year Level Statistics</h3>
							<div class="rounded-lg border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Year Level</TableHead>
											<TableHead class="text-center">Min Hours/Week</TableHead>
											<TableHead class="text-center">Max Hours/Week</TableHead>
											<TableHead class="text-center">Min Free Days</TableHead>
											<TableHead class="text-center">Max Free Days</TableHead>
											<TableHead class="text-center">Min Hours/Day</TableHead>
											<TableHead class="text-center">Max Hours/Day</TableHead>
											<TableHead class="text-center">Max Gaps/Day</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{#each parsedStudentStatistics.yearLevels as yearLevel}
											<TableRow>
												<TableCell class="font-medium">{yearLevel.year}</TableCell>
												<TableCell class="text-center">{yearLevel.minHoursPerWeek}</TableCell>
												<TableCell class="text-center">{yearLevel.maxHoursPerWeek}</TableCell>
												<TableCell class="text-center">{yearLevel.minFreeDays}</TableCell>
												<TableCell class="text-center">{yearLevel.maxFreeDays}</TableCell>
												<TableCell class="text-center">{yearLevel.minHoursPerDay}</TableCell>
												<TableCell class="text-center">{yearLevel.maxHoursPerDay}</TableCell>
												<TableCell class="text-center">{yearLevel.maxGapsPerDay}</TableCell>
											</TableRow>
										{/each}
									</TableBody>
								</Table>
							</div>
						</div>

						<!-- Groups Section -->
						{#if parsedStudentStatistics.groups.length > 0}
							<div class="space-y-4">
								<h3 class="text-lg font-semibold">
									Group Statistics ({parsedStudentStatistics.groups.length} groups)
								</h3>
								<div class="max-h-96 overflow-y-auto rounded-lg border">
									<Table>
										<TableHeader class="bg-background sticky top-0">
											<TableRow>
												<TableHead>Group</TableHead>
												<TableHead class="text-center">Hours/Week Range</TableHead>
												<TableHead class="text-center">Free Days Range</TableHead>
												<TableHead class="text-center">Hours/Day Range</TableHead>
												<TableHead class="text-center">Max Gaps/Day</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{#each parsedStudentStatistics.groups as group}
												<TableRow>
													<TableCell class="font-medium">{group.group}</TableCell>
													<TableCell class="text-center"
														>{group.minHoursPerWeek} - {group.maxHoursPerWeek}</TableCell
													>
													<TableCell class="text-center"
														>{group.minFreeDays} - {group.maxFreeDays}</TableCell
													>
													<TableCell class="text-center"
														>{group.minHoursPerDay} - {group.maxHoursPerDay}</TableCell
													>
													<TableCell class="text-center">{group.maxGapsPerDay}</TableCell>
												</TableRow>
											{/each}
										</TableBody>
									</Table>
								</div>
							</div>
						{/if}

						<!-- Subgroups Section -->
						{#if parsedStudentStatistics.subgroups.length > 0}
							<div class="space-y-4">
								<h3 class="text-lg font-semibold">
									Subgroup Statistics ({parsedStudentStatistics.subgroups.length} subgroups)
								</h3>
								<div class="max-h-96 overflow-y-auto rounded-lg border">
									<Table>
										<TableHeader class="bg-background sticky top-0">
											<TableRow>
												<TableHead>Subgroup</TableHead>
												<TableHead class="text-center">Hours/Week</TableHead>
												<TableHead class="text-center">Free Days</TableHead>
												<TableHead class="text-center">Total Gaps</TableHead>
												<TableHead class="text-center">Min Hours/Day</TableHead>
												<TableHead class="text-center">Max Hours/Day</TableHead>
												<TableHead class="text-center">Max Gaps/Day</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{#each parsedStudentStatistics.subgroups as subgroup}
												<TableRow>
													<TableCell class="font-medium">{subgroup.subgroup}</TableCell>
													<TableCell class="text-center">{subgroup.hoursPerWeek}</TableCell>
													<TableCell class="text-center">{subgroup.freeDays}</TableCell>
													<TableCell class="text-center">{subgroup.totalGaps}</TableCell>
													<TableCell class="text-center">{subgroup.minHoursPerDay}</TableCell>
													<TableCell class="text-center">{subgroup.maxHoursPerDay}</TableCell>
													<TableCell class="text-center">{subgroup.maxGapsPerDay}</TableCell>
												</TableRow>
											{/each}
										</TableBody>
									</Table>
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<div class="py-8 text-center">
						<GraduationCapIcon class="text-muted-foreground mx-auto mb-4 h-12 w-12" />
						<h3 class="text-lg font-semibold">No Student Statistics Available</h3>
						<p class="text-muted-foreground">
							Student statistics data could not be loaded or parsed.
						</p>
					</div>
				{/if}
			{:else if selectedView === 'broken-constraints'}
				<div class="space-y-4">
					{#if brokenConstraints.length === 0}
						<div class="py-8 text-center">
							<CheckCircleIcon class="mx-auto mb-4 h-12 w-12 text-green-600" />
							<h3 class="text-lg font-semibold text-green-800">No Broken Constraints</h3>
							<p class="text-muted-foreground">
								All constraints have been satisfied in this timetable.
							</p>
						</div>
					{:else}
						<div class="space-y-3">
							{#each brokenConstraints as constraint}
								<div
									class="flex items-start gap-3 rounded-lg border p-4 {constraint.severity ===
									'high'
										? 'bg-red-50'
										: constraint.severity === 'medium'
											? 'bg-yellow-50'
											: 'bg-blue-50'}"
								>
									<AlertTriangleIcon
										class="mt-0.5 h-5 w-5 flex-shrink-0 {constraint.severity === 'high'
											? 'text-red-600'
											: constraint.severity === 'medium'
												? 'text-yellow-600'
												: 'text-blue-600'}"
									/>
									<div class="space-y-1">
										<p class="font-medium">{constraint.type}</p>
										<p class="text-muted-foreground text-sm">{constraint.description}</p>
									</div>
									<Badge
										variant="outline"
										class="ml-auto {constraint.severity === 'high'
											? 'border-red-200'
											: constraint.severity === 'medium'
												? 'border-yellow-200'
												: 'border-blue-200'}"
									>
										{constraint.severity}
									</Badge>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{:else if selectedView === 'space-timetable'}
				<div class="py-8 text-center">
					<CalendarIcon class="text-muted-foreground mx-auto mb-4 h-12 w-12" />
					<h3 class="text-lg font-semibold">Space Timetable</h3>
					<p class="text-muted-foreground">Timetable for a selected room.</p>
				</div>
			{:else if selectedView === 'user-timetable'}
				<div class="py-8 text-center">
					<UsersIcon class="text-muted-foreground mx-auto mb-4 h-12 w-12" />
					<h3 class="text-lg font-semibold">User Timetable</h3>
					<p class="text-muted-foreground">
						Individual user timetable view will be implemented here.
					</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Confirm Timetable Button -->
	<div class="flex justify-center">
		<Button size="lg" class="px-8 py-3" onclick={() => (showConfirmDialog = true)}>
			<CheckCircleIcon class="mr-2 h-4 w-4" />
			CONFIRM TIMETABLE
		</Button>
	</div>
</div>

<!-- Confirmation Dialog -->
<Dialog.Root bind:open={showConfirmDialog}>
	<Dialog.Content class="sm:max-w-md">
		<div class="space-y-6 p-6">
			<div class="space-y-4 text-center">
				<p class="text-lg leading-relaxed">
					Please note that confirming this timetable will allocate classes to all pertaining user
					timetables and further modifications of the timetable must be manual. Continue?
				</p>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<Button variant="outline" size="lg" onclick={() => (showConfirmDialog = false)}>
					NO, GO BACK
				</Button>
				<Button size="lg" onclick={() => handleConfirmTimetable()}>YES</Button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
