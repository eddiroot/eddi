<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Plus, BookOpen, Calendar } from 'lucide-svelte';
	import CurriculumSingleYearView from '../components/CurriculumSingleYearView.svelte';
	import CurriculumMultiYearView from '../components/CurriculumMultiYearView.svelte';
	import AddCourseMapItemDialog from '../components/AddCourseMapItemDialog.svelte';
	import { YEAR_LEVELS } from '../curriculum-utils';
	import type { PageData } from './$types';

	export let data: PageData;

	let showAddDialog = false;

	// Reactive URL parameters
	$: selectedYearLevel = data.selectedYearLevel;
	$: viewMode = data.viewMode;
	$: academicYear = data.academicYear;

	function updateURL(params: Record<string, string | null>) {
		const url = new URL($page.url);
		Object.entries(params).forEach(([key, value]) => {
			if (value) {
				url.searchParams.set(key, value);
			} else {
				url.searchParams.delete(key);
			}
		});
		goto(url, { replaceState: true, noScroll: true });
	}

	function handleYearLevelChange(value: string) {
		updateURL({ year: value });
	}

	function handleViewModeChange(value: string) {
		updateURL({ view: value });
	}

	// Get year level options for filtering
	$: yearLevelOptions = YEAR_LEVELS;

	// Filter course map items by year level for single year view
	$: filteredCourseMapItems = viewMode === 'single' 
		? data.courseMapItems.filter(item => selectedYearLevel === 'all' || item.yearLevel === selectedYearLevel)
		: data.courseMapItems;

	// Create subject slug for URL
	function createSubjectSlug(subjectName: string): string {
		return subjectName.toLowerCase().replace(/\s+/g, '-');
	}
</script>

<div class="container mx-auto py-6 space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">{data.subject.name} Curriculum Map</h1>
			{#if data.subject.description}
				<p class="text-muted-foreground mt-1">{data.subject.description}</p>
			{/if}
		</div>
		<Button onclick={() => showAddDialog = true} class="gap-2">
			<Plus class="h-4 w-4" />
			Add Course Map Item
		</Button>
	</div>

	<!-- Controls -->
	<Card>
		<CardContent class="p-6">
			<div class="flex items-center gap-6">
				<!-- Year Level Filter (only for single year view) -->
				{#if viewMode === 'single'}
					<div class="space-y-2">
						<label for="year-level-select" class="text-sm font-medium">Year Level</label>
						<Select.Root
							type="single"
							value={selectedYearLevel}
							onValueChange={handleYearLevelChange}
						>
							<Select.Trigger id="year-level-select" class="w-[180px]">
								{yearLevelOptions.find(o => o.value === selectedYearLevel)?.label || "Select year level"}
							</Select.Trigger>
							<Select.Content>
								{#each yearLevelOptions as option}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				{/if}

				<!-- View Mode -->
				<div class="space-y-2">
					<span class="text-sm font-medium">View Mode</span>
					<Tabs value={viewMode} onValueChange={handleViewModeChange} class="w-full" aria-label="Curriculum view mode">
						<TabsList class="grid w-[400px] grid-cols-2">
							<TabsTrigger value="single">Single Year</TabsTrigger>
							<TabsTrigger value="multi">F-10 Overview</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>

				<!-- Academic Year -->
				<div class="space-y-2">
					<label for="academic-year-select" class="text-sm font-medium">Academic Year</label>
					<Select.Root
						type="single"
						value={academicYear.toString()}
						onValueChange={(value) => updateURL({ academicYear: value })}
					>
						<Select.Trigger id="academic-year-select" class="w-[120px]">
							{academicYear}
						</Select.Trigger>
						<Select.Content>
							{#each Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i) as year}
								<Select.Item value={year.toString()}>{year}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Content -->
	{#if data.courseMapItems.length === 0}
		<Card>
			<CardContent class="text-center py-12">
				<BookOpen class="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
				<h3 class="text-lg font-semibold mb-2">No Course Map Items</h3>
				<p class="text-muted-foreground mb-4">
					Start building your curriculum map for {data.subject.name} by adding course map items.
				</p>
				<Button onclick={() => showAddDialog = true} class="gap-2">
					<Plus class="h-4 w-4" />
					Add First Item
				</Button>
			</CardContent>
		</Card>
	{:else if viewMode === 'single'}
		<CurriculumSingleYearView 
			courseMapItems={filteredCourseMapItems}
			yearLevel={selectedYearLevel}
			bind:showAddDialog
		/>
	{:else}
		<CurriculumMultiYearView 
			courseMapItems={data.courseMapItems}
			bind:showAddDialog
		/>
	{/if}
</div>

<!-- Add Course Map Item Dialog -->
<AddCourseMapItemDialog 
	subjectId={data.subject.id}
	bind:open={showAddDialog}
/>
