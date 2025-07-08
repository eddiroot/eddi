<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import * as Drawer from '$lib/components/ui/drawer';
	import Plus from 'lucide-svelte/icons/plus';
	import X from 'lucide-svelte/icons/x';
	import CurriculumSingleYearView from '../components/CurriculumSingleYearView.svelte';
	import CurriculumMultiYearView from '../components/CurriculumMultiYearView.svelte';
	import { YEAR_LEVELS } from '../curriculum-utils';
	import type { PageData } from './$types';
	import type { CourseMapItem } from '$lib/server/db/schema';

	export let data: PageData;

	let showAddDialog = false;
	let drawerOpen = false;
	let selectedCourseMapItem: CourseMapItem | null = null;

	// Function to handle course map item click
	function handleCourseMapItemClick(item: CourseMapItem) {
		selectedCourseMapItem = item;
		drawerOpen = true;
	}

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
	{#if viewMode === 'single'}
		<CurriculumSingleYearView 
			courseMapItems={filteredCourseMapItems}
			yearLevel={selectedYearLevel}
			bind:showAddDialog
			onCourseMapItemClick={handleCourseMapItemClick}
		/>
	{:else}
		<CurriculumMultiYearView 
			courseMapItems={data.courseMapItems}
			bind:showAddDialog
			onCourseMapItemClick={handleCourseMapItemClick}
		/>
	{/if}
</div>

<!-- Course Map Item Drawer -->
<Drawer.Root bind:open={drawerOpen} direction="right">
	<Drawer.Content class="!max-w-[1400px]">
			<Drawer.Header>
				<Drawer.Title>{selectedCourseMapItem?.title || 'Course Map Item'}</Drawer.Title>
				<Drawer.Description>View and manage course map item details</Drawer.Description>
			</Drawer.Header>
			
			<div class="p-4 pb-0">
				{#if selectedCourseMapItem}
					<div class="space-y-4">
						<div>
							<h3 class="font-medium text-sm text-muted-foreground mb-1">Title</h3>
							<p class="text-sm">{selectedCourseMapItem.title}</p>
						</div>
						
						{#if selectedCourseMapItem.description}
							<div>
								<h3 class="font-medium text-sm text-muted-foreground mb-1">Description</h3>
								<p class="text-sm">{selectedCourseMapItem.description}</p>
							</div>
						{/if}
						
						<div class="grid grid-cols-2 gap-4">
							<div>
								<h3 class="font-medium text-sm text-muted-foreground mb-1">Year Level</h3>
								<p class="text-sm">{selectedCourseMapItem.yearLevel}</p>
							</div>
							
							<div>
								<h3 class="font-medium text-sm text-muted-foreground mb-1">Duration</h3>
								<p class="text-sm">{selectedCourseMapItem.lengthInWeeks} weeks</p>
							</div>
						</div>
						
						<div class="grid grid-cols-2 gap-4">
							<div>
								<h3 class="font-medium text-sm text-muted-foreground mb-1">Start Week</h3>
								<p class="text-sm">Week {selectedCourseMapItem.startWeekNumber}</p>
							</div>
							
							<div>
								<h3 class="font-medium text-sm text-muted-foreground mb-1">Semester</h3>
								<p class="text-sm">Semester {selectedCourseMapItem.termNumber}</p>
							</div>
						</div>
					</div>
				{/if}
			</div>
			
			<Drawer.Footer>
				<div class="flex gap-2 w-full">
					<Button variant="outline" class="flex-1">Edit</Button>
					<Button variant="destructive" class="flex-1">Delete</Button>
				</div>
				<Drawer.Close class="w-full">
					<Button variant="outline" class="w-full">Close</Button>
				</Drawer.Close>
			</Drawer.Footer>
	
	</Drawer.Content>
</Drawer.Root>
