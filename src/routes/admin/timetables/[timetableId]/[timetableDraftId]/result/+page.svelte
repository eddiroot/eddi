<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import type { PageData } from './$types';
	import StudentDataTable from './student-data-table.svelte';
	import { studentColumns } from './student-columns.js';
	import type { UserStatistics } from '../../../../../../scripts/process/statistics';

	let { data }: { data: PageData } = $props();

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

	// Get student statistics from the statistics report
	// We need to extract from the raw statistics data passed to transform function
	// For now, we'll need to add this to the page data in +page.server.ts
	const studentData = $derived(
		(data.studentStatistics || []) as UserStatistics[]
	);
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
					<Card.Description>
						Detailed statistics for all students in the timetable
					</Card.Description>
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
				</Card.Header>
				<Card.Content>
					<p>This is the Teacher Statistics page</p>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="student-timetable" class="space-y-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>Student Timetable</Card.Title>
				</Card.Header>
				<Card.Content>
					<p>This is the Student Timetable page</p>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="room-timetable" class="space-y-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>Room Timetable</Card.Title>
				</Card.Header>
				<Card.Content>
					<p>This is the Room Timetable page</p>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</div>
