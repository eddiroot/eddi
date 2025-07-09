<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import Plus from 'lucide-svelte/icons/plus';
	import X from 'lucide-svelte/icons/x';
	import Edit from 'lucide-svelte/icons/edit';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Save from 'lucide-svelte/icons/save';
	import BookOpen from 'lucide-svelte/icons/book-open';
	import Clock from 'lucide-svelte/icons/clock';
	import Calendar from 'lucide-svelte/icons/calendar';
	import CurriculumMultiYearView from '../components/CurriculumMultiYearView.svelte';
	import { YEAR_LEVELS, SEMESTER_OPTIONS } from '../curriculum-utils';
	import type { PageData } from './$types';
	import type { CourseMapItem } from '$lib/server/db/schema';

	export let data: PageData;

	let drawerOpen = false;
	let isEditMode = false;
	let selectedCourseMapItem: CourseMapItem | null = null;
	let newItemWeek: number | null = null;
	let newItemTerm: number | null = null;
	// Edit form state
	let editForm = {
		title: '',
		description: '',
		startWeekNumber: 1,
		lengthInWeeks: 1,
		termNumber: 1,
		yearLevel: '',
		color: '#3b82f6', // Default blue color
		learningAreaId: null as number | null
	};

	// Available colors for course map items
	const availableColors = [
		{ value: '#3b82f6', label: 'Blue' },
		{ value: '#10b981', label: 'Green' },
		{ value: '#f59e0b', label: 'Yellow' },
		{ value: '#ef4444', label: 'Red' },
		{ value: '#8b5cf6', label: 'Purple' },
		{ value: '#06b6d4', label: 'Cyan' },
		{ value: '#f97316', label: 'Orange' },
		{ value: '#84cc16', label: 'Lime' }
	];

	// Reactive statement to fetch learning area content when learning area or year level changes
	$: if (editForm.learningAreaId && editForm.yearLevel) {
		// Filter learning area content from the existing data
		filteredLearningAreaContent = data.learningAreaContent.filter((content: any) => 
			content.learningArea.id === editForm.learningAreaId && 
			content.content.yearLevel === editForm.yearLevel
		);
	} else {
		filteredLearningAreaContent = [];
	}

	// Debug logging
	$: console.log('Debug - Learning areas available:', data.learningAreas?.length || 0);
	$: console.log('Debug - Learning areas data:', data.learningAreas);
	$: console.log('Debug - Is edit mode:', isEditMode);
	$: console.log('Debug - Selected course map item:', selectedCourseMapItem?.id || 'none');
	$: console.log('Debug - Drawer open:', drawerOpen);
	$: console.log('Debug - Learning areas type:', typeof data.learningAreas);
	$: console.log('Debug - Learning areas is array:', Array.isArray(data.learningAreas));
	$: console.log('Debug - Selected year level:', selectedYearLevel);
	$: console.log('Debug - View mode:', viewMode);

	// Function to handle course map item click
	function handleCourseMapItemClick(item: CourseMapItem) {
		selectedCourseMapItem = item;
		isEditMode = false;
		drawerOpen = true;
	}

	// Function to handle empty cell click (for creating new items)
	function handleEmptyCellClick(week: number, term: number) {
		selectedCourseMapItem = null;
		newItemWeek = week;
		newItemTerm = term;
		isEditMode = true;
		// Initialize form for new item
		editForm = {
			title: '',
			description: '',
			startWeekNumber: week,
			lengthInWeeks: 1,
			termNumber: term,
			yearLevel: 'F', // Default to Foundation
			color: '#3b82f6',
			learningAreaId: null
		};
		drawerOpen = true;
	}

	// Function to switch to edit mode
	function enterEditMode() {
		if (selectedCourseMapItem) {
			editForm = {
				title: selectedCourseMapItem.title,
				description: selectedCourseMapItem.description || '',
				startWeekNumber: selectedCourseMapItem.startWeekNumber,
				lengthInWeeks: selectedCourseMapItem.lengthInWeeks,
				termNumber: selectedCourseMapItem.termNumber,
				yearLevel: selectedCourseMapItem.yearLevel,
				color: '#3b82f6', // TODO: Get from item when color field is added
				learningAreaId: selectedCourseMapItem.learningAreaId || null
			};
		}
		isEditMode = true;
	}

	// Function to cancel edit mode
	function cancelEdit() {
		isEditMode = false;
		drawerOpen = false;
		selectedCourseMapItem = null;
		newItemWeek = null;
		newItemTerm = null;
	}

	// Function to save course map item (create or update)
	async function saveCourseMapItem() {
		if (selectedCourseMapItem) {
			// Update existing item
			const formData = new FormData();
			formData.append('id', selectedCourseMapItem.id.toString());
			formData.append('title', editForm.title);
			formData.append('description', editForm.description);
			formData.append('yearLevel', editForm.yearLevel);
			formData.append('termNumber', editForm.termNumber.toString());
			formData.append('academicYear', data.academicYear.toString());
			formData.append('startWeekNumber', editForm.startWeekNumber.toString());
			formData.append('lengthInWeeks', editForm.lengthInWeeks.toString());
			if (editForm.learningAreaId) {
				formData.append('learningAreaId', editForm.learningAreaId.toString());
			}

			const response = await fetch('?/update', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				window.location.reload();
			}
		} else {
			// Create new item
			const formData = new FormData();
			formData.append('title', editForm.title);
			formData.append('description', editForm.description);
			formData.append('yearLevel', editForm.yearLevel);
			formData.append('termNumber', editForm.termNumber.toString());
			formData.append('academicYear', data.academicYear.toString());
			formData.append('startWeekNumber', editForm.startWeekNumber.toString());
			formData.append('lengthInWeeks', editForm.lengthInWeeks.toString());
			if (editForm.learningAreaId) {
				formData.append('learningAreaId', editForm.learningAreaId.toString());
			}

			const response = await fetch('?/create', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				window.location.reload();
			}
		}
	}

	// Function to delete course map item
	async function deleteCourseMapItem() {
		if (!selectedCourseMapItem) return;
		
		try {
			const formData = new FormData();
			formData.append('id', selectedCourseMapItem.id.toString());

			const response = await fetch('?/delete', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				drawerOpen = false;
				window.location.reload();
			}
		} catch (error) {
			console.error('Error deleting course map item:', error);
		}
	}

	// Generate week range for display
	function getWeekRange(startWeek: number, length: number) {
		const weeks = [];
		for (let i = startWeek; i < startWeek + length; i++) {
			weeks.push(i);
		}
		return weeks;
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

	// Get year level options for filtering
	$: yearLevelOptions = YEAR_LEVELS;

	// Get lessons for the selected course map item and group by week
	$: lessonsForItem = selectedCourseMapItem 
		? data.lessons.filter((lesson: any) => {
				// Filter lessons that fall within the course map item's week range
				if (!selectedCourseMapItem) return false;
				return lesson.lesson.weekNumber >= selectedCourseMapItem.startWeekNumber &&
					   lesson.lesson.weekNumber < selectedCourseMapItem.startWeekNumber + selectedCourseMapItem.lengthInWeeks;
		  })
		: [];

	$: lessonsByWeek = lessonsForItem.reduce((acc: Record<number, any[]>, lesson: any) => {
		const week = lesson.lesson.weekNumber;
		if (!acc[week]) {
			acc[week] = [];
		}
		acc[week].push(lesson);
		return acc;
	}, {} as Record<number, any[]>);

	// Get area of study content associated with the course map item
	$: areaOfStudyContent = selectedCourseMapItem 
		? data.learningAreaContent.filter((content: any) => {
				// This would need to be based on some relationship between course map items and learning area content
				// For now, we'll show all content for the year level
				return content.content.yearLevel === selectedCourseMapItem?.yearLevel;
		  })
		: [];

	// Create subject slug for URL
	function createSubjectSlug(subjectName: string): string {
		return subjectName.toLowerCase().replace(/\s+/g, '-');
	}

	// Reactive variable for learning area content based on selected learning area and year level
	let filteredLearningAreaContent: any[] = [];
	
	// Reactive statement to fetch learning area content when learning area or year level changes
	$: if (editForm.learningAreaId && editForm.yearLevel) {
		// Filter learning area content from the existing data
		filteredLearningAreaContent = data.learningAreaContent.filter((content: any) => 
			content.learningArea.id === editForm.learningAreaId && 
			content.content.yearLevel === editForm.yearLevel
		);
	} else {
		filteredLearningAreaContent = [];
	}
</script>

<div class="container mx-auto py-6 space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">{data.subject.name} Curriculum Overview</h1>
			{#if data.subject.description}
				<p class="text-muted-foreground mt-1">{data.subject.description}</p>
			{/if}
		</div>
	</div>

	<!-- Year Level Navigation -->
	<Card>
		<CardHeader>
			<CardTitle class="text-lg">Year Level Management</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-6 gap-3 sm:grid-cols-11 lg:grid-cols-11">
				{#each data.availableYearLevels as yearLevel}
					{@const subjectSlug = createSubjectSlug(data.subject.name)}
					<Button 
						variant="outline" 
						size="sm"
						onclick={() => goto(`/curriculum/${subjectSlug}/${yearLevel.toLowerCase()}`)}
						class="justify-center"
					>
						{yearLevel === 'F' ? 'Foundation' : `Year ${yearLevel}`}
					</Button>
				{/each}
			</div>
			<p class="text-sm text-muted-foreground mt-3">
				Click on a year level to manage course map items and detailed planning for that specific year.
			</p>
		</CardContent>
	</Card>

	<!-- View Controls -->
	<Card>
		<CardContent class="p-6">
			<div class="flex items-center gap-6">
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

	<!-- Main Content -->
	<Card>
		<CardHeader>
			<CardTitle>Foundation to Year 10 Overview</CardTitle>
			<p class="text-sm text-muted-foreground">
				View course map items across all year levels. Click on any item to see details, or use the year level buttons above to manage specific year levels.
			</p>
		</CardHeader>
		<CardContent>
			<CurriculumMultiYearView 
				courseMapItems={data.courseMapItems.map((item: any) => ({
					...item,
					createdAt: item.createdAt || new Date().toISOString(),
					updatedAt: item.updatedAt || new Date().toISOString()
				}))}
				onCourseMapItemClick={handleCourseMapItemClick}
				onEmptyCellClick={handleEmptyCellClick}
			/>
		</CardContent>
	</Card>
</div>

<!-- Course Map Item Drawer -->
<Drawer.Root bind:open={drawerOpen} direction="right">
	<Drawer.Content class="!max-w-[1400px] rounded-l-lg">
		<Drawer.Header class="pb-4">
			<div class="flex items-center justify-between">
				<div class="flex flex-col items-center text-center flex-1">
					<Drawer.Title class="text-2xl font-semibold mb-2">
						{#if isEditMode}
							{selectedCourseMapItem ? 'Edit Course Map Item' : 'Create Course Map Item'}
						{:else}
							{selectedCourseMapItem?.title || 'Course Map Item'}
						{/if}
					</Drawer.Title>
					{#if !isEditMode && selectedCourseMapItem?.description}
						<Drawer.Description class="text-lg text-muted-foreground">
							{selectedCourseMapItem.description}
						</Drawer.Description>
					{/if}
				</div>
				<div class="flex items-center gap-2">

				</div>
			</div>
		</Drawer.Header>
		
		<div class="flex-1 overflow-y-auto px-4">
			{#if !isEditMode && selectedCourseMapItem}
				<!-- View Mode -->
				<div class="space-y-6 pb-6">
					<!-- Header Information -->
					<div class="bg-muted/30 rounded-lg p-4 relative">
						<div class="flex items-center gap-6 text-sm">
							<div class="flex items-center gap-1">
								<BookOpen class="h-4 w-4" />
								<span>Year {selectedCourseMapItem.yearLevel}</span>
							</div>
							<div class="flex items-center gap-1">
								<Clock class="h-4 w-4" />
								<span>Semester {selectedCourseMapItem.termNumber}</span>
							</div>
							<div class="flex items-center gap-1">
								<Calendar class="h-4 w-4" />
								<span>Weeks {selectedCourseMapItem.startWeekNumber}–{selectedCourseMapItem.startWeekNumber + selectedCourseMapItem.lengthInWeeks - 1}</span>
							</div>
							<div class="flex items-center gap-1">
								<span>{selectedCourseMapItem.lengthInWeeks} weeks</span>
							</div>
						</div>
						
						<!-- Floating Edit Button -->
						<Button 
							variant="default" 
							size="sm" 
							onclick={enterEditMode}
							class="absolute top-4 right-4"
						>
							<Edit class="h-4 w-4 mr-1" />
							Edit
						</Button>
					</div>

					<!-- Areas of Study -->
					{#if areaOfStudyContent.length > 0}
						<div>
							<h4 class="font-medium mb-3 flex items-center gap-2">
								<BookOpen class="h-4 w-4" />
								Areas of Study Content
							</h4>
							<div class="flex flex-wrap gap-2">
								{#each areaOfStudyContent as content}
									<Badge variant="secondary" class="text-xs">
										{(content as any).learningArea.name}: {(content as any).content.name}
									</Badge>
								{/each}
							</div>
						</div>
					{/if}

					<Separator />

					<!-- Weekly Breakdown -->
					<div>
						<h4 class="font-medium mb-4 flex items-center gap-2">
							<Calendar class="h-4 w-4" />
							Weekly Breakdown
						</h4>
						
						<div class="space-y-4">
							{#each getWeekRange(selectedCourseMapItem.startWeekNumber, selectedCourseMapItem.lengthInWeeks) as week}
								<!-- Week Header (outside card) -->
								<div class="flex items-center justify-between mb-2">
									<h5 class="font-medium text-lg">Week {week}</h5>
								</div>
								
								<!-- Lessons Card -->
								{#if lessonsByWeek[week] && lessonsByWeek[week].length > 0}
									<div class="border rounded-lg p-4 bg-card">
										<div class="space-y-2">
											{#each lessonsByWeek[week] as lesson}
												<div class="bg-muted/50 rounded p-3 text-sm">
													<div class="flex items-start justify-between">
														<div>
															<p class="font-medium">{(lesson as any).lesson.title}</p>
															{#if (lesson as any).lesson.description}
																<p class="text-muted-foreground text-xs mt-1">{(lesson as any).lesson.description}</p>
															{/if}
															{#if (lesson as any).learningAreaContent}
																<Badge variant="outline" class="text-xs mt-2">
																	{(lesson as any).learningArea?.name}: {(lesson as any).learningAreaContent.name}
																</Badge>
															{/if}
														</div>
														<div class="text-xs text-muted-foreground">
															{(lesson as any).lesson.type === 'lesson' ? 'Lesson' : 'Assessment'}
														</div>
													</div>
												</div>
											{/each}
										</div>
									</div>
								{:else}
									<div class="border rounded-lg p-4 bg-muted/10 text-center text-muted-foreground text-sm">
										No lessons scheduled for this week
									</div>
								{/if}
							{/each}
						</div>
					</div>
				</div>
			{/if}

			<!-- Edit Form -->
			{#if isEditMode}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
						<div class="space-y-2 md:col-span-2">
							<Label for="title">Course Map Item Name</Label>
							<Input
								id="title"
								bind:value={editForm.title}
								placeholder="Enter course map item name"
								required
							/>
						</div>

						<!-- Description -->
						<div class="space-y-2 md:col-span-2">
							<Label for="description">Description</Label>
							<Textarea
								id="description"
								bind:value={editForm.description}
								placeholder="Enter description (optional)"
								rows={3}
							/>
						</div>

						<!-- Week and Length -->
						<div class="space-y-2">
							<Label for="startWeek">Start Week</Label>
							<Input
								id="startWeek"
								type="number"
								bind:value={editForm.startWeekNumber}
								min="1"
								max="40"
								required
							/>
						</div>

						<div class="space-y-2">
							<Label for="length">Length (weeks)</Label>
							<Input
								id="length"
								type="number"
								bind:value={editForm.lengthInWeeks}
								min="1"
								max="20"
								required
							/>
						</div>

						<!-- Semester -->
						<div class="space-y-2">
							<Label for="semester">Semester</Label>
							<Select.Root
								type="single"
								value={editForm.termNumber.toString()}
								onValueChange={(value) => editForm.termNumber = parseInt(value)}
							>
								<Select.Trigger id="semester">
									{SEMESTER_OPTIONS.find(s => s.value === editForm.termNumber)?.label || "Select semester"}
								</Select.Trigger>
								<Select.Content>
									{#each SEMESTER_OPTIONS as semester}
										<Select.Item value={semester.value.toString()}>{semester.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>

						<!-- Year Level -->
						<div class="space-y-2">
							<Label for="yearLevel">Year Level</Label>
							<Select.Root
								type="single"
								value={editForm.yearLevel}
								onValueChange={(value) => editForm.yearLevel = value}
							>
								<Select.Trigger id="yearLevel">
									{YEAR_LEVELS.find(y => y.value === editForm.yearLevel)?.label || "Select year level"}
								</Select.Trigger>
								<Select.Content>
									{#each YEAR_LEVELS.filter(y => y.value !== 'all') as yearLevel}
										<Select.Item value={yearLevel.value}>{yearLevel.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>

						<!-- Color -->
						<div class="space-y-2 md:col-span-2">
							<Label for="color">Color</Label>
							<Select.Root
								type="single"
								value={editForm.color}
								onValueChange={(value) => editForm.color = value}
							>
								<Select.Trigger id="color" class="w-full">
									<div class="flex items-center gap-2">
										<div 
											class="w-4 h-4 rounded-full border" 
											style="background-color: {editForm.color}"
										></div>
										{availableColors.find(c => c.value === editForm.color)?.label || "Select color"}
									</div>
								</Select.Trigger>
								<Select.Content>
									{#each availableColors as color}
										<Select.Item value={color.value}>
											<div class="flex items-center gap-2">
												<div 
													class="w-4 h-4 rounded-full border" 
													style="background-color: {color.value}"
												></div>
												{color.label}
											</div>
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>

						<!-- Learning Area Selection -->
						{#if Array.isArray(data.learningAreas) && data.learningAreas.length > 0}
							<div class="space-y-4 md:col-span-2">
								<Label>Learning Area (Optional)</Label>
								<p class="text-sm text-muted-foreground">Select the learning area you want to cover in this course map item</p>
								
								<!-- Learning Area Cards -->
								<div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
									<!-- No Learning Area Option -->
									<button 
										type="button"
										class="border rounded-lg p-4 text-left transition-colors hover:bg-muted/50 {editForm.learningAreaId === null ? 'border-primary bg-primary/10' : 'border-border'}"
										onclick={() => editForm.learningAreaId = null}
									>
										<div class="flex items-start gap-3">
											<div class="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
												<X class="h-6 w-6 text-muted-foreground" />
											</div>
											<div class="flex-1">
												<h4 class="font-medium text-sm">No Learning Area</h4>
												<p class="text-xs text-muted-foreground mt-1">Don't associate with any specific learning area</p>
											</div>
										</div>
									</button>

									<!-- Learning Area Cards -->
									{#each data.learningAreas as learningAreaWrapper}
										{@const learningArea = (learningAreaWrapper as any).learningArea}
										<button 
											type="button"
											class="border rounded-lg p-4 text-left transition-colors hover:bg-muted/50 {editForm.learningAreaId === learningArea.id ? 'border-primary bg-primary/10' : 'border-border'}"
											onclick={() => editForm.learningAreaId = learningArea.id}
										>
											<div class="flex items-start gap-3">
												<!-- Space for VCAA Logo -->
												<div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
													<BookOpen class="h-6 w-6 text-white" />
												</div>
												<div class="flex-1">
													<h4 class="font-medium text-sm">{learningArea.name}</h4>
													{#if learningArea.description}
														<p class="text-xs text-muted-foreground mt-1 overflow-hidden" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
															{learningArea.description}
														</p>
													{/if}
												</div>
											</div>
										</button>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Learning Area Content Display -->
						{#if editForm.learningAreaId && editForm.yearLevel && filteredLearningAreaContent.length > 0}
							<div class="space-y-4 md:col-span-2">
								<div class="flex items-center gap-2">
									<Label>Learning Area Content</Label>
									<Badge variant="secondary" class="text-xs">
										Year {editForm.yearLevel}
									</Badge>
								</div>
								<p class="text-sm text-muted-foreground">Available content descriptions for the selected learning area and year level</p>
								
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
									{#each filteredLearningAreaContent as content}
										<div 
											class="border rounded-lg p-3 bg-background hover:bg-muted/30 transition-colors group"
											title={(content as any).content.description}
										>
											<div class="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
												{(content as any).content.name}
											</div>
											{#if (content as any).content.description}
												<div class="text-xs text-muted-foreground mt-1 overflow-hidden" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
													{(content as any).content.description}
												</div>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
			{/if}
		</div>
		
		<Drawer.Footer class="border-t bg-background">
			<div class="flex gap-2 w-full">
				{#if isEditMode}
					<Button class="flex-1" onclick={saveCourseMapItem}>
						<Save class="h-4 w-4 mr-1" />
						Save Changes
					</Button>
					<Button variant="outline" class="flex-1" onclick={cancelEdit}>
						<X class="h-4 w-4 mr-1" />
						Cancel
					</Button>
				{:else}
					<Drawer.Close class="w-full">
						<Button variant="outline" class="w-full">Close</Button>
					</Drawer.Close>
				{/if}
			</div>
		</Drawer.Footer>
	</Drawer.Content>
</Drawer.Root>
