<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
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
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import CurriculumSingleYearView from '../../components/CurriculumSingleYearView.svelte';
	import { SEMESTER_OPTIONS } from '../../curriculum-utils';
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
			content.learningArea?.id === editForm.learningAreaId && 
			content.content?.yearLevel === editForm.yearLevel
		);
	} else {
		filteredLearningAreaContent = [];
	}

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
			yearLevel: data.selectedYearLevel,
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

	// Create subject slug for URL
	function createSubjectSlug(subjectName: string): string {
		return subjectName.toLowerCase().replace(/\s+/g, '-');
	}

	// Reactive variable for learning area content based on selected learning area and year level
	let filteredLearningAreaContent: any[] = [];
	
	// Get lessons for the selected course map item and group by week
	$: lessonsForItem = [];
	$: lessonsByWeek = {};

	// Get area of study content associated with the course map item
	$: areaOfStudyContent = selectedCourseMapItem 
		? data.learningAreaContent.filter((content: any) => {
				// This would need to be based on some relationship between course map items and learning area content
				// For now, we'll show all content for the year level
				return content.content?.yearLevel === selectedCourseMapItem?.yearLevel;
		  })
		: [];

	// Function to navigate back to core subject view
	function goBackToCoreSubject() {
		const coreSubjectSlug = createSubjectSlug(data.coreSubject.name);
		goto(`/curriculum/${coreSubjectSlug}`);
	}

	// Function to update URL parameters
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
</script>

<svelte:head>
	<title>{data.subject.name} - Curriculum - Eddi</title>
</svelte:head>

<div class="container mx-auto p-6 space-y-6">
	<!-- Header with back button -->
	<div class="flex items-center gap-4 mb-6">
		<Button variant="ghost" size="icon" onclick={goBackToCoreSubject}>
			<ArrowLeft class="h-4 w-4" />
		</Button>
		<div>
			<h1 class="text-3xl font-bold">{data.subject.name}</h1>
			<p class="text-muted-foreground">{data.subject.description}</p>
		</div>
	</div>

	<!-- Course Map -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Calendar class="h-5 w-5" />
				Course Map - Year {data.selectedYearLevel}
			</CardTitle>
		</CardHeader>
		<CardContent>
			<CurriculumSingleYearView
				courseMapItems={data.courseMapItems}
				yearLevel={data.selectedYearLevel}
				onCourseMapItemClick={handleCourseMapItemClick}
				onEmptyCellClick={handleEmptyCellClick}
			/>
		</CardContent>
	</Card>
</div>

<!-- Course Map Item Drawer -->
<Drawer.Root bind:open={drawerOpen}>
	<Drawer.Content class="h-[80vh]">
		<div class="mx-auto w-full max-w-sm p-4 overflow-y-auto">
			<Drawer.Header>
				<Drawer.Title>
					{isEditMode
						? selectedCourseMapItem
							? 'Edit Course Map Item'
							: 'Create Course Map Item'
						: selectedCourseMapItem?.title || 'Course Map Item'}
				</Drawer.Title>
			</Drawer.Header>

			{#if isEditMode}
				<!-- Edit/Create Form -->
				<div class="space-y-4">
					<div>
						<Label for="title">Title</Label>
						<Input id="title" bind:value={editForm.title} placeholder="Enter title..." />
					</div>

					<div>
						<Label for="description">Description</Label>
						<Textarea
							id="description"
							bind:value={editForm.description}
							placeholder="Enter description..."
							rows={3}
						/>
					</div>

					<div class="grid grid-cols-2 gap-2">
						<div>
							<Label for="start-week">Start Week</Label>
							<Input
								id="start-week"
								type="number"
								min="1"
								max="52"
								bind:value={editForm.startWeekNumber}
							/>
						</div>
						<div>
							<Label for="length">Length (weeks)</Label>
							<Input
								id="length"
								type="number"
								min="1"
								max="20"
								bind:value={editForm.lengthInWeeks}
							/>
						</div>
					</div>

					<div>
						<Label for="term">Term</Label>
						<Select.Root
							type="single"
							value={editForm.termNumber.toString()}
							onValueChange={(value) => value && (editForm.termNumber = parseInt(value))}
						>
							<Select.Trigger>
								Term {editForm.termNumber}
							</Select.Trigger>
							<Select.Content>
								{#each [1, 2, 3, 4] as term}
									<Select.Item value={term.toString()}>Term {term}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					{#if data.learningAreas && data.learningAreas.length > 0}
						<div>
							<Label for="learning-area">Learning Area (Optional)</Label>
							<Select.Root
								type="single"
								value={editForm.learningAreaId?.toString() || ""}
								onValueChange={(value) => {
									editForm.learningAreaId = value ? parseInt(value) : null;
								}}
							>
								<Select.Trigger>
									{editForm.learningAreaId 
										? (data.learningAreas.find((la: any) => la.learningArea.id === editForm.learningAreaId)?.learningArea.name || 'Unknown')
										: 'Select learning area...'}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="">None</Select.Item>
									{#each data.learningAreas as area}
										<Select.Item value={area.learningArea.id.toString()}>{area.learningArea.name}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
					{/if}

					<div class="flex gap-2 pt-4">
						<Button onclick={saveCourseMapItem} class="flex-1">
							<Save class="h-4 w-4 mr-2" />
							Save
						</Button>
						<Button variant="outline" onclick={cancelEdit} class="flex-1">
							<X class="h-4 w-4 mr-2" />
							Cancel
						</Button>
					</div>
				</div>
			{:else if selectedCourseMapItem}
				<!-- View Mode -->
				<div class="space-y-4">
					<!-- Item Details -->
					<div class="space-y-2">
						<div>
							<h3 class="font-semibold">Description</h3>
							<p class="text-sm text-muted-foreground">
								{selectedCourseMapItem.description || 'No description provided'}
							</p>
						</div>

						<Separator />

						<div class="grid grid-cols-2 gap-4 text-sm">
							<div>
								<span class="font-medium">Duration:</span>
								<span class="ml-1">{selectedCourseMapItem.lengthInWeeks} week{selectedCourseMapItem.lengthInWeeks !== 1 ? 's' : ''}</span>
							</div>
							<div>
								<span class="font-medium">Term:</span>
								<span class="ml-1">{selectedCourseMapItem.termNumber}</span>
							</div>
							<div>
								<span class="font-medium">Weeks:</span>
								<span class="ml-1">
									{getWeekRange(selectedCourseMapItem.startWeekNumber, selectedCourseMapItem.lengthInWeeks).join(', ')}
								</span>
							</div>
							<div>
								<span class="font-medium">Year Level:</span>
								<span class="ml-1">{selectedCourseMapItem.yearLevel}</span>
							</div>
						</div>
					</div>

					<!-- Learning Area Content -->
					{#if areaOfStudyContent.length > 0}
						<Separator />
						<div>
							<h3 class="font-semibold mb-2">Learning Area Content</h3>
							<div class="space-y-2">
								{#each areaOfStudyContent as content}
									<div class="border rounded-lg p-3">
										<h4 class="font-medium text-sm">{content.learningArea.name}</h4>
										<p class="text-xs text-muted-foreground mt-1">
											{content.content.description}
										</p>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Lessons for this item -->
					<!-- TODO: Implement lesson loading -->
					
					<!-- Action Buttons -->
					<div class="flex gap-2 pt-4">
						<Button onclick={enterEditMode} variant="outline" class="flex-1">
							<Edit class="h-4 w-4 mr-2" />
							Edit
						</Button>
						<Button onclick={deleteCourseMapItem} variant="destructive" class="flex-1">
							<Trash2 class="h-4 w-4 mr-2" />
							Delete
						</Button>
					</div>
				</div>
			{/if}
		</div>
	</Drawer.Content>
</Drawer.Root>
