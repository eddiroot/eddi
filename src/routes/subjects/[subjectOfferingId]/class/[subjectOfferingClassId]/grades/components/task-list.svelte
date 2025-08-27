<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuLabel,
		DropdownMenuSeparator
	} from '$lib/components/ui/dropdown-menu';
	import ListFilter from '@lucide/svelte/icons/list-filter';
	import Check from '@lucide/svelte/icons/check';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import { formatTimestampAsDate } from '$lib/utils';
	import { page } from '$app/state';

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
		status: 'graded' | 'submitted' | 'pending';
	}

	let {
		tasks,
		showFeedback = false,
		heightClass = 'h-72'
	}: {
		tasks: Task[];
		showFeedback?: boolean;
		heightClass?: string;
	} = $props();

	// Multi-select filters (empty set means All)
	const typeOptions = ['lesson', 'homework', 'assessment'] as const;
	const statusOptions = ['graded', 'submitted', 'pending'] as const;
	let selectedTypeFilters = $state(new Set<(typeof typeOptions)[number]>());
	let selectedStatusFilters = $state(new Set<(typeof statusOptions)[number]>());

	function toggleTypeFilter(type: (typeof typeOptions)[number]) {
		const s = new Set(selectedTypeFilters);
		if (s.has(type)) s.delete(type);
		else s.add(type);
		selectedTypeFilters = s;
	}
	function clearTypeFilters() {
		selectedTypeFilters = new Set();
	}
	function toggleStatusFilter(st: (typeof statusOptions)[number]) {
		const s = new Set(selectedStatusFilters);
		if (s.has(st)) s.delete(st);
		else s.add(st);
		selectedStatusFilters = s;
	}
	function clearStatusFilters() {
		selectedStatusFilters = new Set();
	}

	// Sorting
	type SortKey = 'name' | 'dueDate' | 'grade' | 'weight';
	type SortDir = 'asc' | 'desc';
	let sortKey = $state<SortKey>('dueDate');
	let sortDir = $state<SortDir>('asc');

	function setSort(k: SortKey, d: SortDir) {
		sortKey = k;
		sortDir = d;
	}

	function toggleSort(k: SortKey, initialDir: SortDir = 'asc') {
		if (sortKey === k) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = k;
			sortDir = initialDir;
		}
	}

	function taskGradePct(t: Task): number | null {
		if (t.studentGrade === null || !t.maxPoints) return null;
		return (t.studentGrade / t.maxPoints) * 100;
	}

	let filteredTasks = $derived(() => {
		let filtered = tasks;
		// Filter by types
		if (selectedTypeFilters.size > 0) {
			filtered = filtered.filter((task) => selectedTypeFilters.has(task.type));
		}
		// Filter by status
		if (selectedStatusFilters.size > 0) {
			filtered = filtered.filter((task) => selectedStatusFilters.has(task.status));
		}
		// Sort
		const dir = sortDir === 'asc' ? 1 : -1;
		const sorted = [...filtered].sort((a, b) => {
			switch (sortKey) {
				case 'name': {
					const av = a.name.toLowerCase();
					const bv = b.name.toLowerCase();
					return av === bv ? 0 : (av < bv ? -1 : 1) * dir;
				}
				case 'dueDate': {
					const av = new Date(a.dueDate).getTime();
					const bv = new Date(b.dueDate).getTime();
					return av === bv ? 0 : (av < bv ? -1 : 1) * dir;
				}
				case 'weight': {
					const av = a.weight ?? null;
					const bv = b.weight ?? null;
					if (av === null && bv === null) return 0;
					if (av === null) return 1 * dir; // nulls last
					if (bv === null) return -1 * dir;
					return av === bv ? 0 : (av < bv ? -1 : 1) * dir;
				}
				case 'grade': {
					const ag = taskGradePct(a);
					const bg = taskGradePct(b);
					if (ag === null && bg === null) return 0;
					if (ag === null) return 1 * dir; // nulls last
					if (bg === null) return -1 * dir;
					return ag === bg ? 0 : (ag < bg ? -1 : 1) * dir;
				}
			}
		});
		return sorted;
	});

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
			case 'submitted':
				return 'outline';
			case 'pending':
				return 'secondary';
			default:
				return 'outline';
		}
	}

	function taskHref(id: number) {
		// Current path ends with /grades. Replace that segment with /tasks/{id}
		const base = page.url.pathname.replace(/\/grades\/?$/, '');
		return `${base}/tasks/${id}`;
	}
</script>

<Card.Root>
	<Card.Content>
		<div>
			<Table.Root class="w-full table-fixed">
				<Table.Header class="border-b">
					<Table.Row>
						<Table.Head class="w-64">
							<div class="flex items-center gap-1">
								<span>Tasks</span>
								<Button
									variant="ghost"
									size="sm"
									class="h-5 w-5 p-0"
									aria-label="Sort by task name"
									onclick={() => toggleSort('name', 'asc')}
								>
									{#if sortKey === 'name'}{#if sortDir === 'asc'}<ArrowUp
												class="h-4 w-4"
											/>{:else}<ArrowDown class="h-4 w-4" />{/if}{:else}<ArrowUpDown
											class="h-4 w-4"
										/>{/if}
								</Button>
							</div>
						</Table.Head>
						<Table.Head class="w-28">
							<div class="flex items-center gap-2">
								<span>Type</span>
								<DropdownMenu>
									<DropdownMenuTrigger>
										<Button
											variant="ghost"
											size="sm"
											class="h-6 w-6 p-0"
											aria-label="Filter by type"
										>
											<ListFilter />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="start" class="min-w-40">
										<DropdownMenuLabel>Filter</DropdownMenuLabel>
										<DropdownMenuSeparator />
										<DropdownMenuItem onclick={clearTypeFilters}>
											<div class="flex w-full items-center justify-between">
												<span>All tasks</span>
												{#if selectedTypeFilters.size === 0}
													<Check class="h-4 w-4" />
												{/if}
											</div>
										</DropdownMenuItem>
										<DropdownMenuItem onclick={() => toggleTypeFilter('lesson')}>
											<div class="flex w-full items-center justify-between">
												<span>Lessons</span>
												{#if selectedTypeFilters.has('lesson')}<Check class="h-4 w-4" />{/if}
											</div>
										</DropdownMenuItem>
										<DropdownMenuItem onclick={() => toggleTypeFilter('homework')}>
											<div class="flex w-full items-center justify-between">
												<span>Homework</span>
												{#if selectedTypeFilters.has('homework')}<Check class="h-4 w-4" />{/if}
											</div>
										</DropdownMenuItem>
										<DropdownMenuItem onclick={() => toggleTypeFilter('assessment')}>
											<div class="flex w-full items-center justify-between">
												<span>Assessments</span>
												{#if selectedTypeFilters.has('assessment')}<Check class="h-4 w-4" />{/if}
											</div>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</Table.Head>
						<Table.Head class="w-28">
							<div class="flex items-center gap-1">
								<span>Grade</span>
								<Button
									variant="ghost"
									size="sm"
									class="h-5 w-5 p-0"
									aria-label="Sort by grade"
									onclick={() => toggleSort('grade', 'desc')}
								>
									{#if sortKey === 'grade'}{#if sortDir === 'asc'}<ArrowUp
												class="h-4 w-4"
											/>{:else}<ArrowDown class="h-4 w-4" />{/if}{:else}<ArrowUpDown
											class="h-4 w-4"
										/>{/if}
								</Button>
							</div>
						</Table.Head>
						<Table.Head class="w-22">
							<div class="flex items-center gap-1">
								<span>Weight</span>
								<Button
									variant="ghost"
									size="sm"
									class="h-5 w-5 p-0"
									aria-label="Sort by weight"
									onclick={() => toggleSort('weight', 'desc')}
								>
									{#if sortKey === 'weight'}{#if sortDir === 'asc'}<ArrowUp
												class="h-4 w-4"
											/>{:else}<ArrowDown class="h-4 w-4" />{/if}{:else}<ArrowUpDown
											class="h-4 w-4"
										/>{/if}
								</Button>
							</div>
						</Table.Head>
						<Table.Head class="w-24">
							<div class="flex items-center gap-2">
								<span>Status</span>
								<DropdownMenu>
									<DropdownMenuTrigger>
										<Button
											variant="ghost"
											size="sm"
											class="h-6 w-6 p-0"
											aria-label="Filter by status"
										>
											<ListFilter />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="start" class="min-w-40">
										<DropdownMenuLabel>Filter</DropdownMenuLabel>
										<DropdownMenuSeparator />
										<DropdownMenuItem onclick={clearStatusFilters}>
											<div class="flex w-full items-center justify-between">
												<span>All</span>
												{#if selectedStatusFilters.size === 0}
													<Check class="h-4 w-4" />
												{/if}
											</div>
										</DropdownMenuItem>
										<DropdownMenuItem onclick={() => toggleStatusFilter('graded')}>
											<div class="flex w-full items-center justify-between">
												<span>Graded</span>
												{#if selectedStatusFilters.has('graded')}<Check class="h-4 w-4" />{/if}
											</div>
										</DropdownMenuItem>
										<DropdownMenuItem onclick={() => toggleStatusFilter('submitted')}>
											<div class="flex w-full items-center justify-between">
												<span>Submitted</span>
												{#if selectedStatusFilters.has('submitted')}<Check class="h-4 w-4" />{/if}
											</div>
										</DropdownMenuItem>
										<DropdownMenuItem onclick={() => toggleStatusFilter('pending')}>
											<div class="flex w-full items-center justify-between">
												<span>Pending</span>
												{#if selectedStatusFilters.has('pending')}<Check class="h-4 w-4" />{/if}
											</div>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</Table.Head>
						<Table.Head class="w-28">
							<div class="flex items-center gap-1">
								<span>Due Date</span>
								<Button
									variant="ghost"
									size="sm"
									class="h-5 w-5 p-0"
									aria-label="Sort by due date"
									onclick={() => toggleSort('dueDate', 'asc')}
								>
									{#if sortKey === 'dueDate'}{#if sortDir === 'asc'}<ArrowUp
												class="h-4 w-4"
											/>{:else}<ArrowDown class="h-4 w-4" />{/if}{:else}<ArrowUpDown
											class="h-4 w-4"
										/>{/if}
								</Button>
							</div>
						</Table.Head>
						{#if showFeedback}
							<Table.Head>Feedback</Table.Head>
						{/if}
						<Table.Head class="w-12 text-right"></Table.Head>
					</Table.Row>
				</Table.Header>
			</Table.Root>
		</div>
		<div class="overflow-y-auto [scrollbar-gutter:stable] {heightClass}">
			<Table.Root class="w-full table-fixed">
				<Table.Body>
					{#each filteredTasks() as task}
						<Table.Row>
							<Table.Cell class="w-64 font-medium">
								<a
									href={taskHref(task.id)}
									aria-label={`Open task ${task.name}`}
									class="text-primary focus-visible:ring-primary/40 block truncate rounded font-medium outline-none hover:underline focus:underline focus-visible:ring-1"
								>
									{task.name}
								</a>
							</Table.Cell>
							<Table.Cell class="w-28">
								<Badge variant={getTypeColor(task.type)}>
									{task.type}
								</Badge>
							</Table.Cell>
							<Table.Cell class="w-28">
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
							<Table.Cell class="w-22">
								{#if task.weight !== null}
									<span class="text-sm">{task.weight}%</span>
								{:else}
									<span class="text-muted-foreground text-sm">—</span>
								{/if}
							</Table.Cell>
							<Table.Cell class="w-24">
								<Badge variant={getStatusColor(task.status)}>
									{task.status}
								</Badge>
							</Table.Cell>
							<Table.Cell class="w-28">
								{formatTimestampAsDate(new Date(task.dueDate))}
							</Table.Cell>
							{#if showFeedback}
								<Table.Cell>
									<span class="text-muted-foreground block truncate text-sm">
										{task.feedback || 'No feedback'}
									</span>
								</Table.Cell>
							{/if}
							<Table.Cell class="w-12 text-right"></Table.Cell>
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
