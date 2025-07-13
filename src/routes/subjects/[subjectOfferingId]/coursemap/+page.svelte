<script lang="ts">
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import CurriculumSingleYearView from './components/CurriculumSingleYearView.svelte';
	import CourseMapItemDrawer from './components/CourseMapItemDrawer.svelte';
	import type { 
		CourseMapItem, 
		LearningArea, 
		LearningAreaContent,
		CourseMapItemAssessmentPlan
	} from '$lib/server/db/schema';

	export let data;
	export let form;

	// Make courseMapItems reactive by copying the data
	let courseMapItems = [...(data.courseMapItems || [])];

	// Watch for form responses and handle them
	$: if (form) {
		console.log('Form response received:', form);
		if (form?.success && form?.courseMapItem) {
			// Handle form submission success
			if (form.action === 'create') {
				handleItemCreated(form.courseMapItem);
			} else if (form.action === 'update') {
				handleItemUpdated(form.courseMapItem);
			}
		}
	}
	let drawerOpen = false;
	let selectedCourseMapItem: CourseMapItem | null = null;
	let courseMapItemLearningAreas: LearningArea[] = [];
	let learningAreaContent: Record<number, LearningAreaContent[]> = {};
	let assessmentPlans: CourseMapItemAssessmentPlan[] = [];
	let isLoadingDrawerData = false;
	
	// Create mode state
	let isCreateMode = false;
	let createWeek: number | null = null;
	let createSemester: number | null = null;

	async function handleCourseMapItemClick(item: CourseMapItem) {
		selectedCourseMapItem = item;
		isCreateMode = false;
		createWeek = null;
		createSemester = null;
		isLoadingDrawerData = true;
		drawerOpen = true;

		try {
			// Load learning areas for this course map item
			const response1 = await fetch(`/api/coursemap?action=learning-areas&courseMapItemId=${item.id}`);
			if (response1.ok) {
				courseMapItemLearningAreas = await response1.json();
			}

			// Load learning area content for each selected learning area
			const contentPromises = courseMapItemLearningAreas.map(async (learningArea) => {
				const yearLevel = data.subjectOffering?.subject?.yearLevel || 'year9';
				const response = await fetch(`/api/coursemap?action=learning-area-content&learningAreaId=${learningArea.id}&yearLevel=${yearLevel}`);
				if (response.ok) {
					const content = await response.json();
					return { learningAreaId: learningArea.id, content };
				}
				return { learningAreaId: learningArea.id, content: [] };
			});

			const contentResults = await Promise.all(contentPromises);
			learningAreaContent = contentResults.reduce((acc, { learningAreaId, content }) => {
				acc[learningAreaId] = content;
				return acc;
			}, {} as Record<number, LearningAreaContent[]>);

			// Load assessment plans
			const response3 = await fetch(`/api/coursemap?action=assessment-plans&courseMapItemId=${item.id}`);
			if (response3.ok) {
				assessmentPlans = await response3.json();
			}
		} catch (error) {
			console.error('Error loading drawer data:', error);
		} finally {
			isLoadingDrawerData = false;
		}
	}

	function handleEmptyCellClick(week: number, semester: number) {
		// Handle creating new course map item
		selectedCourseMapItem = null;
		courseMapItemLearningAreas = [];
		learningAreaContent = {};
		assessmentPlans = [];
		isCreateMode = true;
		createWeek = week;
		createSemester = semester;
		drawerOpen = true;
	}

	// Handle real-time color updates
	function handleColorChange(itemId: number, newColor: string) {
		// Update the color in the local courseMapItems array with proper immutability
		courseMapItems = courseMapItems.map(item => 
			item.id === itemId ? { ...item, color: newColor } : item
		);
		
		// Also update the selectedCourseMapItem if it matches
		if (selectedCourseMapItem && selectedCourseMapItem.id === itemId) {
			selectedCourseMapItem = { ...selectedCourseMapItem, color: newColor };
		}
	}

	// Handle new item creation - add to local state immediately
	function handleItemCreated(newItem: CourseMapItem) {
		console.log('handleItemCreated called with:', newItem);
		console.log('Current courseMapItems length:', courseMapItems.length);
		courseMapItems = [...courseMapItems, newItem];
		console.log('New courseMapItems length:', courseMapItems.length);
	}

	// Handle item updates - update local state immediately
	function handleItemUpdated(updatedItem: CourseMapItem) {
		console.log('handleItemUpdated called with:', updatedItem);
		courseMapItems = courseMapItems.map(item => 
			item.id === updatedItem.id ? updatedItem : item
		);
		
		// Also update the selectedCourseMapItem if it matches
		if (selectedCourseMapItem && selectedCourseMapItem.id === updatedItem.id) {
			selectedCourseMapItem = { ...updatedItem };
			console.log('Updated selectedCourseMapItem:', selectedCourseMapItem);
		}
	}
</script>

<svelte:head>
	<title>Course Map - {data.subjectOffering?.subject?.name || 'Subject'}</title>
</svelte:head>

<div class="container mx-auto p-6">
	<div class="mb-6">
		<h1 class="text-2xl font-bold">Course Map</h1>
	</div>

	<CurriculumSingleYearView 
		courseMapItems={courseMapItems}
		yearLevel={data.subjectOffering?.subject?.yearLevel || 'Year 9'}
		onCourseMapItemClick={handleCourseMapItemClick}
		onEmptyCellClick={handleEmptyCellClick}
	/>

	<CourseMapItemDrawer 
		bind:open={drawerOpen}
		courseMapItem={selectedCourseMapItem}
		subjectOfferingId={data.subjectOfferingId}
		availableLearningAreas={data.availableLearningAreas}
		{courseMapItemLearningAreas}
		{learningAreaContent}
		{isCreateMode}
		{createWeek}
		{createSemester}
		onColorChange={handleColorChange}
		onItemCreated={handleItemCreated}
		onItemUpdated={handleItemUpdated}
	/>
</div>