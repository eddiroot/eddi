<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import {
		Table,
		TableHead,
		TableBody,
		TableCell,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import * as Dialog from '$lib/components/ui/dialog';
	import {
		CheckCircleIcon,
		DownloadIcon,
		CalendarIcon,
		UsersIcon,
		GraduationCapIcon,
		UserIcon,
		AlertTriangleIcon,
		ClockIcon
	} from '@lucide/svelte';
	import type { TeacherStatistics, TimetableMetadata } from './timetable';
	import type { PageData } from './$types';

	// Receive data from the server
	let { data }: { data: PageData } = $props();

	// Extract data from server response
	const timetableData: TimetableMetadata = data.teacherStatisticsReport.metadata;
	const teacherStatistics: TeacherStatistics = data.teacherStatisticsReport.teachers;

	const studentStatistics = {
		totalStudents: 450,
		yearLevels: [
			{ yearLevel: 'Year 7', count: 75, groups: 3 },
			{ yearLevel: 'Year 8', count: 72, groups: 3 },
			{ yearLevel: 'Year 9', count: 68, groups: 3 },
			{ yearLevel: 'Year 10', count: 70, groups: 3 },
			{ yearLevel: 'Year 11', count: 82, groups: 4 },
			{ yearLevel: 'Year 12', count: 83, groups: 4 }
		]
	};

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
		{ id: 'entire-timetable', label: 'View Entire Timetable', icon: CalendarIcon },
		{ id: 'student-statistics', label: 'Student Statistics', icon: GraduationCapIcon },
		{ id: 'teacher-statistics', label: 'Teacher Statistics', icon: UserIcon },
		{ id: 'broken-constraints', label: 'View Broken Constraints', icon: AlertTriangleIcon },
		{ id: 'user-timetable', label: 'View Timetable for a given User', icon: UsersIcon }
	];

	function handleConfirmTimetable() {
		// Handle timetable confirmation logic here
		// This could submit to a server action or redirect to another page
		showConfirmDialog = false;
		// For now, just log the confirmation
		console.log('Timetable confirmed!');
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
					<h1 class="text-3xl font-bold">Timetable Generation Complete!</h1>
					<p class="text-muted-foreground">
						{timetableData.institutionName} • Generated on {timetableData.generatedAt}
					</p>
				</div>
			</div>
		</div>
		<Button size="lg" class="gap-2">
			<DownloadIcon class="h-4 w-4" />
			Download Timetable
		</Button>
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
				{:else if selectedView === 'entire-timetable'}
					<CalendarIcon class="h-5 w-5" />
					Entire Timetable
				{:else if selectedView === 'broken-constraints'}
					<AlertTriangleIcon class="h-5 w-5" />
					Broken Constraints
				{:else if selectedView === 'user-timetable'}
					<UsersIcon class="h-5 w-5" />
					User Timetable
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
				<div class="space-y-6">
					<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
						<Card.Root>
							<Card.Content class="flex items-center gap-4 p-6">
								<div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
									<UsersIcon class="h-6 w-6 text-blue-600" />
								</div>
								<div>
									<p class="text-2xl font-bold">{studentStatistics.totalStudents}</p>
									<p class="text-muted-foreground text-sm">Total Students</p>
								</div>
							</Card.Content>
						</Card.Root>

						<Card.Root>
							<Card.Content class="flex items-center gap-4 p-6">
								<div class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
									<GraduationCapIcon class="h-6 w-6 text-green-600" />
								</div>
								<div>
									<p class="text-2xl font-bold">{studentStatistics.yearLevels.length}</p>
									<p class="text-muted-foreground text-sm">Year Levels</p>
								</div>
							</Card.Content>
						</Card.Root>

						<Card.Root>
							<Card.Content class="flex items-center gap-4 p-6">
								<div class="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
									<UsersIcon class="h-6 w-6 text-purple-600" />
								</div>
								<div>
									<p class="text-2xl font-bold">
										{studentStatistics.yearLevels.reduce((sum, yl) => sum + yl.groups, 0)}
									</p>
									<p class="text-muted-foreground text-sm">Total Groups</p>
								</div>
							</Card.Content>
						</Card.Root>
					</div>

					<div class="space-y-4">
						<h3 class="text-lg font-semibold">Year Level Breakdown</h3>
						<div class="rounded-lg border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Year Level</TableHead>
										<TableHead class="text-center">Students</TableHead>
										<TableHead class="text-center">Groups</TableHead>
										<TableHead class="text-center">Avg. Group Size</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{#each studentStatistics.yearLevels as yearLevel}
										<TableRow>
											<TableCell class="font-medium">{yearLevel.yearLevel}</TableCell>
											<TableCell class="text-center">{yearLevel.count}</TableCell>
											<TableCell class="text-center">{yearLevel.groups}</TableCell>
											<TableCell class="text-center"
												>{Math.round(yearLevel.count / yearLevel.groups)}</TableCell
											>
										</TableRow>
									{/each}
								</TableBody>
							</Table>
						</div>
					</div>
				</div>
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
			{:else if selectedView === 'entire-timetable'}
				<div class="py-8 text-center">
					<CalendarIcon class="text-muted-foreground mx-auto mb-4 h-12 w-12" />
					<h3 class="text-lg font-semibold">Timetable View</h3>
					<p class="text-muted-foreground">Full timetable view will be implemented here.</p>
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
