<script lang="ts">
	import { Drawer, DrawerContent, DrawerClose } from '$lib/components/ui/drawer';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Checkbox} from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import * as HoverCard from '$lib/components/ui/hover-card';
	import { toast } from 'svelte-sonner';
	import * as Select from '$lib/components/ui/select'
	import * as Tooltip from '$lib/components/ui/tooltip'
	import Plus from '@lucide/svelte/icons/plus';
	import type { CourseMapItem, LearningArea, LearningAreaStandard } from '$lib/server/db/schema';

	// Use Svelte 5 $props() for component props
	let {
		open = $bindable(false),
		courseMapItem = null,
		subjectOfferingId,
		availableLearningAreas = [],
		courseMapItemLearningAreas = [],
		learningAreaContent = {},
		isCreateMode = false,
		createWeek = null,
		createSemester = null,
		onColorChange = undefined,
		onItemCreated = undefined,
		onItemUpdated = undefined
	}: {
		open?: boolean;
		courseMapItem?: CourseMapItem | null;
		subjectOfferingId: number;
		availableLearningAreas?: LearningArea[];
		courseMapItemLearningAreas?: LearningArea[];
		learningAreaContent?: Record<number, LearningAreaStandard[]>;
		isCreateMode?: boolean;
		createWeek?: number | null;
		createSemester?: number | null;
		onColorChange?: ((itemId: number, newColor: string) => void) | undefined;
		onItemCreated?: ((newItem: CourseMapItem) => void) | undefined;
		onItemUpdated?: ((updatedItem: CourseMapItem) => void) | undefined;
	} = $props();

	// Form state
	let isEditMode = $state(false);
	let isLoading = $state(false);
	let editForm = $state({
		topic: '',
		description: '',
		startWeek: 1,
		duration: 1,
		color: ''
	});

	// Color options for course map items
	const colorOptions = [
		{ name: 'Blue', value: '#3B82F6', class: 'bg-blue-500' },
		{ name: 'Green', value: '#10B981', class: 'bg-emerald-500' },
		{ name: 'Purple', value: '#8B5CF6', class: 'bg-violet-500' },
		{ name: 'Orange', value: '#F59E0B', class: 'bg-amber-500' },
		{ name: 'Red', value: '#EF4444', class: 'bg-red-500' },
		{ name: 'Pink', value: '#EC4899', class: 'bg-pink-500' },
		{ name: 'Teal', value: '#14B8A6', class: 'bg-teal-500' }
	];

	// Learning area selection state
	let selectedLearningAreaIds = $state<string[]>([]);

	// Color picker state
	let showColorPicker = $state(false);

	// Learning area picker state
	let showLearningAreaPicker = $state(false);

	// New state for assessment plans, lesson plans, and tasks
	let assessmentPlans = $state<any[]>([]);
	let lessonPlans = $state<any[]>([]);
	let tasks = $state<any[]>([]);
	let isLoadingDrawerData = $state(false);

	// Form element reference
	let formElement: HTMLFormElement;

	// Use Svelte 5 $effect for reactive statements

	// Load drawer data when courseMapItem changes
	$effect(() => {
		if (courseMapItem && !isCreateMode) {
			loadDrawerData(courseMapItem.id);
		}
	});

	async function loadDrawerData(courseMapItemId: number) {
		isLoadingDrawerData = true;
		try {
			// Load assessment plans
			const assessmentResponse = await fetch(`/api/coursemap?action=assessment-plans&courseMapItemId=${courseMapItemId}`);
			if (assessmentResponse.ok) {
				assessmentPlans = await assessmentResponse.json();
			}

			// Load lesson plans
			const lessonResponse = await fetch(`/api/coursemap?action=lesson-plans&courseMapItemId=${courseMapItemId}`);
			if (lessonResponse.ok) {
				lessonPlans = await lessonResponse.json();
			}

			// Load tasks
			const tasksResponse = await fetch(`/api/coursemap?action=tasks&courseMapItemId=${courseMapItemId}`);
			if (tasksResponse.ok) {
				tasks = await tasksResponse.json();
			}
		} catch (error) {
			console.error('Error loading drawer data:', error);
		} finally {
			isLoadingDrawerData = false;
		}
	}

	$effect(() => {
		if (courseMapItem && !isEditMode) {
			editForm.topic = courseMapItem.topic || '';
			editForm.description = courseMapItem.description || '';
			editForm.startWeek = courseMapItem.startWeek || 1;
			editForm.duration = courseMapItem.duration || 1;
			editForm.color = courseMapItem.color || colorOptions[0].value;
			selectedLearningAreaIds = courseMapItemLearningAreas.map((la) => la.id.toString());
		} else if (isCreateMode && createWeek) {
			editForm.topic = '';
			editForm.description = '';
			editForm.startWeek = createWeek;
			editForm.duration = 1;
			editForm.color = colorOptions[0].value;
			selectedLearningAreaIds = [];
			isEditMode = true;
		}
	});

	// Reset edit mode and close color picker when switching between items
	let previousCourseMapItem = $state<CourseMapItem | null>(null);
	$effect(() => {
		if (courseMapItem !== previousCourseMapItem) {
			isEditMode = false;
			showColorPicker = false;
			showLearningAreaPicker = false;
			previousCourseMapItem = courseMapItem;
		}
	});

	// Reset edit mode only when drawer first opens with an existing course map item (view mode)
	let previousOpen = $state(false);
	$effect(() => {
		if (open && !previousOpen && courseMapItem && !isCreateMode) {
			isEditMode = false;
			previousOpen = true;
		} else if (!open) {
			previousOpen = false;
		}
	});

	function toggleLearningArea(learningAreaId: number) {
		const idStr = learningAreaId.toString();
		if (selectedLearningAreaIds.includes(idStr)) {
			selectedLearningAreaIds = selectedLearningAreaIds.filter((id) => id !== idStr);
		} else {
			selectedLearningAreaIds = [...selectedLearningAreaIds, idStr];
		}
	}

	// Helper function to get color name from value
	function getColorName(colorValue: string): string {
		const colorOption = colorOptions.find((option) => option.value === colorValue);
		return colorOption ? colorOption.name : 'Custom';
	}

	function handleEdit() {
		isEditMode = true;
	}

	function handleCancel() {
		isEditMode = false;
		if (courseMapItem) {
			editForm.topic = courseMapItem.topic || '';
			editForm.description = courseMapItem.description || '';
			editForm.startWeek = courseMapItem.startWeek || 1;
			editForm.duration = courseMapItem.duration || 1;
			editForm.color = courseMapItem.color || '';
		}
		selectedLearningAreaIds = courseMapItemLearningAreas.map((la) => la.id.toString());
	}

	async function handleSave() {
		isLoading = true;

		try {
			// First, update local state immediately for instant feedback
			if (isCreateMode && onItemCreated) {
				// Create a temporary item for immediate display
				const tempItem = {
					id: Date.now(), // Temporary ID
					subjectOfferingId: subjectOfferingId,
					topic: editForm.topic,
					description: editForm.description,
					startWeek: editForm.startWeek,
					duration: editForm.duration,
					semester: createSemester || 1,
					color: editForm.color,
					version: 1,
					isArchived: false,
					createdAt: new Date(),
					updatedAt: new Date(),
					originalId: null
				};

				onItemCreated(tempItem);

				// Close drawer immediately for create mode
				handleClose();

				// Show success message
				toast.success('Course map item created successfully');

				// Now save to server in background
				const formData = new FormData();
				formData.append('topic', editForm.topic);
				formData.append('description', editForm.description);
				formData.append('startWeek', editForm.startWeek.toString());
				formData.append('duration', editForm.duration.toString());
				formData.append('learningAreaIds', JSON.stringify(selectedLearningAreaIds.map(id => Number(id))));
				formData.append('learningAreaIds', JSON.stringify(selectedLearningAreaIds));
				formData.append('semester', (createSemester || 1).toString());

				fetch('?/createCourseMapItem', {
					method: 'POST',
					body: formData
				})
					.then((response) => response.json())
					.then((result) => {
						if (result.success && result.courseMapItem) {
							// Replace temp item with real item from server
							// TODO: Implement replacing temporary item with real server item
							// This would require additional logic in the parent component
						}
					})
					.catch((error) => {
						console.error('Background save failed:', error);
						toast.error('Failed to save to server, but item was added locally');
					});
			} else if (!isCreateMode && courseMapItem && onItemUpdated) {
				// Update existing item immediately
				const updatedItem = {
					...courseMapItem,
					topic: editForm.topic,
					description: editForm.description,
					startWeek: editForm.startWeek,
					duration: editForm.duration,
					color: editForm.color,
					updatedAt: new Date()
				};

				onItemUpdated(updatedItem);

				// Update local reference
				courseMapItem = updatedItem;

				// Exit edit mode but keep drawer open for edit mode
				isEditMode = false;

				// Show success message
				toast.success('Course map item updated successfully');

				// Save to server in background
				const formData = new FormData();
				formData.append('topic', editForm.topic);
				formData.append('description', editForm.description);
				formData.append('startWeek', editForm.startWeek.toString());
				formData.append('duration', editForm.duration.toString());
				formData.append('color', editForm.color);
				formData.append('learningAreaIds', JSON.stringify(selectedLearningAreaIds));
				if (courseMapItem) {
					formData.append('courseMapItemId', courseMapItem.id.toString());
				}

				fetch('?/updateCourseMapItem', {
					method: 'POST',
					body: formData
				})
					.then((response) => response.json())
					.then((result) => {
						// Background update completed
					})
					.catch((error) => {
						console.error('Background update failed:', error);
						toast.error('Failed to save to server, but item was updated locally');
					});
			}
		} catch (error) {
			console.error('Error in handleSave:', error);
			toast.error('An error occurred while saving');
		} finally {
			isLoading = false;
		}
	}

	function handleClose() {
		open = false;
		isEditMode = false;
		showColorPicker = false;
		showLearningAreaPicker = false;
		// Don't reset createSemester and createWeek here - let parent handle it
	}
</script>

<Tooltip.Provider>
	<Drawer bind:open onClose={handleClose} direction="right">
		<DrawerContent class="max-h-[100vh] !max-w-[1600px] rounded-l-lg overflow-hidden flex flex-col">
			<!-- Header -->
			<div class="flex items-center justify-between p-6 pb-2">
				<h2 class="text-3xl font-bold">
					{#if isCreateMode}
						Create Task
					{:else if isEditMode}
						Edit Task
					{:else}
						{courseMapItem?.topic || 'Task Details'}
					{/if}
				</h2>

				<!-- Top Right Action Buttons -->
				<div class="flex items-center gap-2">
					{#if isCreateMode}
						<Button size="sm" onclick={handleSave} disabled={isLoading || !editForm.topic.trim()}>
							Create Task
						</Button>
					{/if}
				</div>
			</div>

			<!-- Hidden form for SvelteKit form actions -->
			<!-- Form removed - using direct API calls for immediate updates -->

			<!-- Metadata Section -->
			{#if isEditMode || isCreateMode}
				<div class="p-6 pt-2">
					<div class="grid grid-cols-12 gap-4">
						<!-- Topic -->
						<div class="col-span-6">
							<Label for="topic" class="text-sm font-medium">Topic</Label>
							<Input
								id="topic"
								bind:value={editForm.topic}
								placeholder="Enter topic"
								class="mt-2"
							/>
						</div>

						<!-- Week & Duration -->
						<div class="col-span-2">
							<Label for="startWeek" class="text-sm font-medium">Week</Label>
							<Input
								id="startWeek"
								type="number"
								bind:value={editForm.startWeek}
								min="1"
								max="18"
								class="mt-2"
							/>
						</div>
						<div class="col-span-2">
							<Label for="duration" class="text-sm font-medium">Duration</Label>
							<Input
								id="duration"
								type="number"
								bind:value={editForm.duration}
								min="1"
								max="18"
								class="mt-2"
							/>
						</div>

						<!-- Color Picker -->
						<div class="col-span-2">
							<Label class="text-sm font-medium">Color</Label>
							<div class="relative mt-2">
								<button
									type="button"
									class="border-input bg-background flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm"
									onclick={() => (showColorPicker = !showColorPicker)}
									title="Select color"
									aria-label="Select color"
								>
									<div class="flex items-center gap-2">
										<div
											class="h-4 w-4 rounded-full border"
											style="background-color: {editForm.color}"
										></div>
										<span>{getColorName(editForm.color)}</span>
									</div>
									<svg
										class="text-muted-foreground h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 9l-7 7-7-7"
										></path>
									</svg>
								</button>
								{#if showColorPicker}
									<div
										class="absolute top-full left-0 z-50 mt-1 rounded-md border p-3 shadow-lg"
									>
										<div class="grid grid-cols-4 gap-2">
											{#each colorOptions as color}
												<button
													type="button"
													class="h-8 w-8 rounded border-2 {editForm.color === color.value
													} {color.class}"
													onclick={() => {
														editForm.color = color.value;
														showColorPicker = false;
														// Don't auto-save color changes - only update when user clicks Save
													}}
													title={color.name}
													aria-label="Select {color.name} color"
												>
												</button>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Main Content Area -->
			<div class="flex-1 overflow-y-auto p-6 pt-0">
				<div class="space-y-6">
					<!-- Description -->
					{#if isEditMode || isCreateMode}
						<div>
							<Label for="description" class="text-sm font-medium">Description</Label>
							<Textarea
								id="description"
								bind:value={editForm.description}
								placeholder="Enter description"
								rows={3}
								class="mt-2"
							/>
						</div>
					{:else if courseMapItem?.description}
						<div>
							<Label class="text-xl font-bold">Description</Label>
							<p class="mt-2 text-base">{courseMapItem.description}</p>
						</div>
					{/if}

					<!-- Learning Areas Section -->
					{#if availableLearningAreas.length > 0}
						<div>
							<h3 class="text-xl font-bold mb-4">Learning Areas</h3>
							
							{#if isEditMode || isCreateMode}
								<!-- Edit Mode: Multi-select dropdown using Select UI -->
								<Select.Root
									type="multiple"
									bind:value={selectedLearningAreaIds}
									name="learningAreaIds">
									<Select.Trigger class="w-full">
										{#if selectedLearningAreaIds.length > 0}
											{selectedLearningAreaIds.length} selected
										{:else}
											Select learning areas...
										{/if}
									</Select.Trigger>
									<Select.Content class="z-50 max-h-48 overflow-y-auto rounded-md border shadow-lg">
										{#each availableLearningAreas as learningArea}
											<Select.Item value={learningArea.id.toString()}>
												<div class="flex items-center">
													<span class="flex-1 text-sm truncate">{learningArea.name}</span>
													{#if learningArea.description}
														<HoverCard.Root>
														<HoverCard.Trigger
															type="button"
															aria-label="Show description"
															class="focus:outline-none ml-2"
														>
															
														</HoverCard.Trigger>
														<HoverCard.Content class="max-w-xs p-3 rounded-lg shadow-lg border z-50 text-xs leading-relaxed">
															{learningArea.description}
														</HoverCard.Content>
														</HoverCard.Root>
													{/if}
												</div>
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							{:else}
								<!-- View Mode: Two column layout -->
								{#if courseMapItemLearningAreas.length > 0}
									<div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
										{#each courseMapItemLearningAreas as learningArea}
											{@const contents = learningAreaContent[learningArea.id] || []}
											{@const contentCount = contents.length}
											{@const isMultiRow = contentCount > 3}
											
											<div class="p-2 border rounded-lg {isMultiRow ? 'min-h-[5.5rem]' : 'min-h-[3.5rem]'} flex">
												<div class="flex items-center gap-2 w-full">
													<!-- Learning Area name with colon on the left -->
													<div class="flex items-center gap-1 min-w-0 flex-shrink-0">
														<span class="text-sm font-semibold">{learningArea.name}</span>
														<span class="text-sm font-semibold">:</span>
													</div>
													
													<!-- Content items bundled on the right -->
													<div class="flex-1 min-w-0 {contentCount === 1 ? 'flex items-center' : 'flex items-center justify-center'}">
														{#if contents.length > 0}
															{#if contentCount <= 3}
																<!-- Single row layout for 1-3 items -->
																<div class="grid {contentCount === 1 ? 'grid-cols-1' : contentCount === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-1 w-full">
																	{#each contents as content}
																		<Tooltip.Root>
																			<Tooltip.Trigger>
																				<div class="p-1.5 border rounded  transition-colors cursor-pointer shadow-sm">
																					<div class="text-xs font-medium text-center leading-tight">{content.name}</div>
																				</div>
																			</Tooltip.Trigger>
																			<Tooltip.Content class="max-w-xs p-3 rounded-lg shadow-lg border z-50 text-sm leading-relaxed" side="top">
																				<div>{content.description}</div>
																			</Tooltip.Content>
																		</Tooltip.Root>
																	{/each}
																</div>
															{:else}
																<!-- Multiple rows with max 3 per row -->
																<div class="space-y-1 w-full">
																	{#each Array(Math.ceil(contentCount / 3)) as _, rowIndex}
																		{@const startIndex = rowIndex * 3}
																		{@const endIndex = Math.min(startIndex + 3, contentCount)}
																		{@const rowContents = contents.slice(startIndex, endIndex)}
																		<div class="grid {rowContents.length === 1 ? 'grid-cols-1' : rowContents.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-1">
																			{#each rowContents as content}
																				<Tooltip.Root>
																					<Tooltip.Trigger>
																						<div class="p-1.5 border rounded transition-colors cursor-pointer shadow-sm">
																							<div class="text-xs font-medium text-center leading-tight">{content.name}</div>
																						</div>
																					</Tooltip.Trigger>
																					<Tooltip.Content class="max-w-xs p-3  rounded-lg shadow-lg border z-50 text-sm leading-relaxed" side="top">
																						<div>{content.description}</div>
																					</Tooltip.Content>
																				</Tooltip.Root>
																			{/each}
																		</div>
																	{/each}
																</div>
															{/if}
														{:else}
															<p class="text-xs italic">No content available</p>
														{/if}
													</div>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<p class="text-sm">No learning areas selected</p>
								{/if}
							{/if}
						</div>
					{/if}

					<!-- Assessment Plans Section -->
					{#if !isCreateMode}
						<div>
							<div class="flex items-center justify-between mb-4">
								<h3 class="text-xl font-bold">Assessment Plans</h3>
								<Button variant="outline" size="sm">
									<Plus class="h-4 w-4 mr-2" />
									Assessment Plan
								</Button>
							</div>

							{#if isLoadingDrawerData}
								<p class="text-sm">Loading assessment plans...</p>
							{:else if assessmentPlans.length > 0}
								<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{#each assessmentPlans as plan}
										<div class="p-4 border rounded-lg transition-colors cursor-pointer shadow-sm">
											<h4 class="font-medium text-sm">{plan.name || 'Assessment Plan'}</h4>
											{#if plan.description}
												<p class="text-xs text-gray-600 mt-1">{plan.description}</p>
											{/if}
										</div>
									{/each}
								</div>
							{:else}
								<p class="text-sm  italic">No assessment plans available</p>
							{/if}
						</div>
					{/if}

					<!-- Lesson Plans Section -->
					{#if !isCreateMode}
						<div>
							<div class="flex items-center justify-between mb-4">
								<h3 class="text-xl font-bold">Lesson Plans</h3>
								<Button variant="outline" size="sm">
									<Plus class="h-4 w-4 mr-2" />
									Lesson Plan
								</Button>
							</div>

							{#if isLoadingDrawerData}
								<p class="text-sm">Loading lesson plans...</p>
							{:else if lessonPlans.length > 0}
								<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{#each lessonPlans as plan}
										<div class="p-4 border rounded-lgtransition-colors cursor-pointer shadow-sm">
											<h4 class="font-medium text-sm">{plan.name || 'Lesson Plan'}</h4>
											{#if plan.description}
												<p class="text-xs mt-1">{plan.description}</p>
											{/if}
										</div>
									{/each}
								</div>
							{:else}
								<p class="text-sm italic">No lesson plans available</p>
							{/if}
						</div>
					{/if}

					<!-- Tasks Section -->
					<div>
						<div class="flex items-center justify-between mb-4">
							<h3 class="text-xl font-bold">Tasks</h3>
							{#if !isCreateMode}
								<Button variant="outline" size="sm">
									<Plus class="h-4 w-4 mr-2" />
									Task
								</Button>
							{/if}
						</div>

						{#if isLoadingDrawerData && !isCreateMode}
							<p class="text-sm">Loading tasks...</p>
						{:else if tasks.length > 0}
							<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{#each tasks as task}
									<div class="p-4 border rounded-lg transition-colors cursor-pointer shadow-sm">
										<h4 class="font-medium text-sm">{task.name || task.title || 'Task'}</h4>
										{#if task.description}
											<p class="text-xs mt-1">{task.description}</p>
										{/if}
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-sm italic">No tasks available</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- Bottom Action Bar -->
			<div class="sticky bottom- border-t">
				{#if isEditMode && !isCreateMode}
					<div class="flex gap-2 p-4">
						<Button variant="outline" class="flex-1" onclick={handleCancel}>Cancel</Button>
						<Button class="flex-1" onclick={handleSave} disabled={isLoading}>Save Changes</Button>
					</div>
				{:else if !isCreateMode}
					<!-- View Mode Action Bar -->
					<div class="flex gap-2 p-4">
						<Button variant="outline" class="flex-1" onclick={handleClose}>Close</Button>
						<Button class="flex-1" onclick={handleEdit}>Edit</Button>
					</div>
				{/if}
			</div>
		</DrawerContent>
	</Drawer>
</Tooltip.Provider>
