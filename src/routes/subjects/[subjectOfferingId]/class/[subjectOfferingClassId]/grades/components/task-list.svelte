<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import ListFilter from '@lucide/svelte/icons/list-filter';
	import { formatTimestampAsDate } from '$lib/utils';

	interface Task {
		id: number;
		name: string;
		type: 'lesson' | 'homework' | 'assessment';
		studentGrade: number | null;
		maxPoints: number;
		weight: number | null;
		dueDate: string;
		submittedDate?: string | null;
		feedback?: string | null;
		status: 'graded' | 'pending';
	}

	let {
		tasks,
		showFeedback = false
	}: {
		tasks: Task[];
		showFeedback?: boolean;
	} = $props();

	let selectedTypeFilter = $state('all');
	let selectedStatusFilter = $state('all');
	let showTypeFilter = $state(false);
	let showStatusFilter = $state(false);
	let typeFilterAnchor = $state<HTMLElement>();
	let statusFilterAnchor = $state<HTMLElement>();

	// Compute a fixed-position style string for a dropdown anchored to a button
	function getDropdownStyleFor(btn?: HTMLElement | null) {
		if (!btn) return '';
		const r = btn.getBoundingClientRect();
		const gap = 4; // space between button and dropdown
		const top = r.bottom + gap;
		const left = r.left;
		// Clamp max height to viewport so it never gets cut off; keep small margin at bottom
		const maxH = Math.max(64, window.innerHeight - top - 8);
		return `top:${top}px;left:${left}px;max-height:${maxH}px;`;
	}
	const getTypeDropdownStyle = () => getDropdownStyleFor(typeFilterAnchor);
	const getStatusDropdownStyle = () => getDropdownStyleFor(statusFilterAnchor);

	let filteredTasks = $derived(() => {
		let filtered = tasks;

		if (selectedTypeFilter !== 'all') {
			filtered = filtered.filter((task) => task.type === selectedTypeFilter);
		}

		if (selectedStatusFilter !== 'all') {
			filtered = filtered.filter((task) => task.status === selectedStatusFilter);
		}

		return filtered;
	});

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.filter-dropdown')) {
			showTypeFilter = false;
			showStatusFilter = false;
		}
	}

	function getTypeColor(type: string): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (type) {
			case 'assessment':
				return 'destructive';
			case 'homework':
				return 'secondary';
			case 'lesson':
				return 'outline';
			default:
				return 'outline';
		}
	}

	function getGradeColor(marks: number | null): string {
		if (marks === null || marks === undefined) return 'text-muted-foreground';
		if (marks < 40) return 'text-red-500';
		return 'text-foreground';
	}

	function getStatusColor(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'graded':
				return 'default';
			case 'pending':
				return 'secondary';
			default:
				return 'outline';
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<Card.Root>
	<Card.Content>
		<div>
			<Table.Root class="w-full table-fixed">
				<Table.Header class="border-b">
					<Table.Row>
						<Table.Head class="w-96">Tasks</Table.Head>
						<Table.Head class="w-28">
							<div class="flex items-center space-x-2">
								<span>Type</span>
								<div class="filter-dropdown relative">
									<span class="inline-block" bind:this={typeFilterAnchor}>
										<Button
											variant="ghost"
											size="sm"
											class="h-6 w-6 p-0"
											onclick={() => {
												showTypeFilter = !showTypeFilter;
												if (showTypeFilter) showStatusFilter = false;
											}}
										>
											<ListFilter class="h-4 w-4" />
										</Button>
									</span>
									{#if showTypeFilter}
										<div
											class="filter-dropdown fixed z-50 min-w-32 overflow-auto rounded-md border border-gray-200 bg-white p-2 shadow-lg"
											style={getTypeDropdownStyle()}
										>
											<div class="space-y-1">
												<button
													class="block w-full rounded px-2 py-1 text-left text-sm hover:bg-gray-100"
													class:bg-blue-100={selectedTypeFilter === 'all'}
													onclick={() => {
														selectedTypeFilter = 'all';
														showTypeFilter = false;
													}}
												>
													All tasks
												</button>
												<button
													class="block w-full rounded px-2 py-1 text-left text-sm hover:bg-gray-100"
													class:bg-blue-100={selectedTypeFilter === 'lesson'}
													onclick={() => {
														selectedTypeFilter = 'lesson';
														showTypeFilter = false;
													}}
												>
													Lessons
												</button>
												<button
													class="block w-full rounded px-2 py-1 text-left text-sm hover:bg-gray-100"
													class:bg-blue-100={selectedTypeFilter === 'homework'}
													onclick={() => {
														selectedTypeFilter = 'homework';
														showTypeFilter = false;
													}}
												>
													Homework
												</button>
												<button
													class="block w-full rounded px-2 py-1 text-left text-sm hover:bg-gray-100"
													class:bg-blue-100={selectedTypeFilter === 'assessment'}
													onclick={() => {
														selectedTypeFilter = 'assessment';
														showTypeFilter = false;
													}}
												>
													Assessments
												</button>
											</div>
										</div>
									{/if}
								</div>
							</div>
						</Table.Head>
						<Table.Head class="w-32">Grade</Table.Head>
						<Table.Head class="w-20">Weight</Table.Head>
						<Table.Head class="w-28">
							<div class="flex items-center space-x-2">
								<span>Status</span>
								<div class="filter-dropdown relative">
									<span class="inline-block" bind:this={statusFilterAnchor}>
										<Button
											variant="ghost"
											size="sm"
											class="h-6 w-6 p-0"
											onclick={() => {
												showStatusFilter = !showStatusFilter;
												if (showStatusFilter) showTypeFilter = false;
											}}
										>
											<ListFilter class="h-4 w-4" />
										</Button>
									</span>
									{#if showStatusFilter}
										<div
											class="filter-dropdown fixed z-50 min-w-32 overflow-auto rounded-md border border-gray-200 bg-white p-2 shadow-lg"
											style={getStatusDropdownStyle()}
										>
											<div class="space-y-1">
												<button
													class="block w-full rounded px-2 py-1 text-left text-sm hover:bg-gray-100"
													class:bg-blue-100={selectedStatusFilter === 'all'}
													onclick={() => {
														selectedStatusFilter = 'all';
														showStatusFilter = false;
													}}
												>
													All
												</button>
												<button
													class="block w-full rounded px-2 py-1 text-left text-sm hover:bg-gray-100"
													class:bg-blue-100={selectedStatusFilter === 'graded'}
													onclick={() => {
														selectedStatusFilter = 'graded';
														showStatusFilter = false;
													}}
												>
													Graded
												</button>
												<button
													class="block w-full rounded px-2 py-1 text-left text-sm hover:bg-gray-100"
													class:bg-blue-100={selectedStatusFilter === 'pending'}
													onclick={() => {
														selectedStatusFilter = 'pending';
														showStatusFilter = false;
													}}
												>
													Pending
												</button>
											</div>
										</div>
									{/if}
								</div>
							</div>
						</Table.Head>
						<Table.Head class="w-32">Due Date</Table.Head>
						{#if showFeedback}
							<Table.Head>Feedback</Table.Head>
						{/if}
					</Table.Row>
				</Table.Header>
			</Table.Root>
		</div>
		<div class="h-76 overflow-y-auto [scrollbar-gutter:stable]">
			<Table.Root class="w-full table-fixed">
				<Table.Body>
					{#each filteredTasks() as task}
						<Table.Row>
							<Table.Cell class="w-96 font-medium">
								<span class="block truncate">{task.name}</span>
							</Table.Cell>
							<Table.Cell class="w-28">
								<Badge variant={getTypeColor(task.type)}>
									{task.type}
								</Badge>
							</Table.Cell>
							<Table.Cell class="w-32">
								{#if task.studentGrade !== null}
									<span class={getGradeColor((task.studentGrade / task.maxPoints) * 100)}>
										{task.studentGrade}/{task.maxPoints}
									</span>
									<span class="text-muted-foreground ml-2 text-sm">
										({Math.round((task.studentGrade / task.maxPoints) * 100)}%)
									</span>
								{:else}
									<span class="text-muted-foreground">Not graded</span>
								{/if}
							</Table.Cell>
							<Table.Cell class="w-20">
								{#if task.weight !== null}
									<span class="text-sm">{task.weight}%</span>
								{:else}
									<span class="text-muted-foreground text-sm">—</span>
								{/if}
							</Table.Cell>
							<Table.Cell class="w-28">
								<Badge variant={getStatusColor(task.status)}>
									{task.status}
								</Badge>
							</Table.Cell>
							<Table.Cell class="w-32">
								{formatTimestampAsDate(new Date(task.dueDate))}
							</Table.Cell>
							{#if showFeedback}
								<Table.Cell class="max-w-108">
									<span class="text-muted-foreground block truncate text-sm">
										{task.feedback || 'No feedback'}
									</span>
								</Table.Cell>
							{/if}
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
		<div class="mt-2 flex justify-end">
			<div class="text-muted-foreground text-sm">
				Showing {filteredTasks().length} of {tasks.length} tasks
			</div>
		</div>
	</Card.Content>
</Card.Root>
