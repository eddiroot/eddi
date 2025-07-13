<script lang="ts">
	import { Drawer, DrawerContent, DrawerClose } from '$lib/components/ui/drawer';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { toast } from 'svelte-sonner';
	import type { CourseMapItem, LearningArea, LearningAreaContent } from '$lib/server/db/schema';

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
		learningAreaContent?: Record<number, LearningAreaContent[]>;
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
	let selectedLearningAreaIds = $state<number[]>([]);

	// Color picker state
	let showColorPicker = $state(false);

	// Learning area picker state
	let showLearningAreaPicker = $state(false);

	// Form element reference
	let formElement: HTMLFormElement;

	// Use Svelte 5 $effect for reactive statements

	$effect(() => {
		if (courseMapItem && !isEditMode) {
			editForm.topic = courseMapItem.topic || '';
			editForm.description = courseMapItem.description || '';
			editForm.startWeek = courseMapItem.startWeek || 1;
			editForm.duration = courseMapItem.duration || 1;
			editForm.color = courseMapItem.color || colorOptions[0].value;
			selectedLearningAreaIds = courseMapItemLearningAreas.map((la) => la.id);
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
		if (selectedLearningAreaIds.includes(learningAreaId)) {
			selectedLearningAreaIds = selectedLearningAreaIds.filter((id) => id !== learningAreaId);
		} else {
			selectedLearningAreaIds = [...selectedLearningAreaIds, learningAreaId];
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
		selectedLearningAreaIds = courseMapItemLearningAreas.map((la) => la.id);
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
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
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
				formData.append('color', editForm.color);
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
					updatedAt: new Date().toISOString()
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
				formData.append('courseMapItemId', courseMapItem.id.toString());

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
		<DrawerContent class="max-h-[100vh] !max-w-[1600px] rounded-l-lg">
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
					{:else if !isEditMode}
						<Button
							variant="outline"
							size="sm"
							onclick={() => {
								/* TODO: Add create task functionality */
							}}
						>
							Create Task +
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
										class="absolute top-full left-0 z-50 mt-1 rounded-md border bg-white p-3 shadow-lg"
									>
										<div class="grid grid-cols-4 gap-2">
											{#each colorOptions as color}
												<button
													type="button"
													class="h-8 w-8 rounded border-2 {editForm.color === color.value
														? 'border-gray-800'
														: 'border-gray-300'} {color.class}"
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
			<div class="flex-1 p-6 pt-0">
				<div class="space-y-4">
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
							<p class="mt-2 text-base text-gray-700">{courseMapItem.description}</p>
						</div>
					{/if}

					<!-- Learning Areas -->
					{#if availableLearningAreas.length > 0}
						<div>
							{#if isEditMode || isCreateMode}
								<!-- Edit Mode: Multi-select dropdown -->
								<div>
									<Label class="mb-2 block text-sm font-medium">Learning Areas</Label>
									<div class="relative">
										<button
											type="button"
											class="border-input bg-background hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-between rounded-md border p-2 text-left text-sm"
											onclick={() => (showLearningAreaPicker = !showLearningAreaPicker)}
										>
											<span>
												{#if selectedLearningAreaIds.length === 0}
													Select learning areas...
												{:else}
													{selectedLearningAreaIds.length} selected
												{/if}
											</span>
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
										{#if showLearningAreaPicker}
											<div
												class="absolute top-full right-0 left-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-md border bg-white shadow-lg"
											>
												{#each availableLearningAreas as learningArea}
													<label
														class="flex cursor-pointer items-center space-x-2 p-2 hover:bg-gray-50"
													>
														<Checkbox
															checked={selectedLearningAreaIds.includes(learningArea.id)}
															onCheckedChange={() => toggleLearningArea(learningArea.id)}
														/>
														<span class="text-sm">{learningArea.name}</span>
													</label>
												{/each}
											</div>
										{/if}
									</div>
								</div>
							{:else}
								<!-- View Mode: Excalidraw-style layout -->
								<div class="mb-4 flex items-center justify-between">
									<Label class="text-xl font-bold">Learning Areas</Label>
								</div>
								{#if courseMapItemLearningAreas.length > 0}
									{#each courseMapItemLearningAreas as learningArea}
										<div class="mb-4 rounded-lg border bg-gray-50 p-4">
											<div class="flex items-center gap-4">
												<!-- Learning Area name with colon -->
												<div class="flex items-center gap-3">
													<span class="text-lg font-semibold">{learningArea.name}</span>
													<span class="text-lg font-semibold">:</span>
												</div>

												<!-- Content items on the right with dynamic grid -->
												<div class="flex-1">
													{#if learningAreaContent[learningArea.id]?.length > 0}
														{@const contents = learningAreaContent[learningArea.id]}
														{@const contentCount = contents.length}

														{#if contentCount <= 4}
															<!-- Single row layout for 1-4 items -->
															<div
																class="grid {contentCount === 1
																	? 'grid-cols-1'
																	: contentCount === 2
																		? 'grid-cols-2'
																		: contentCount === 3
																			? 'grid-cols-3'
																			: 'grid-cols-4'} gap-3"
															>
																{#each contents as content}
																	<Tooltip.Root>
																		<Tooltip.Trigger>
																			<div
																				class="cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition-colors hover:bg-gray-50"
																			>
																				<div class="text-center text-sm font-medium">
																					{content.name}
																				</div>
																			</div>
																		</Tooltip.Trigger>
																		<Tooltip.Content
																			class="z-50 max-w-xs rounded-lg border bg-white p-3 text-sm leading-relaxed text-black shadow-lg"
																			side="top"
																		>
																			<div>{content.description}</div>
																		</Tooltip.Content>
																	</Tooltip.Root>
																{/each}
															</div>
														{:else if contentCount === 5}
															<!-- 5 items: 3 + 2 layout -->
															<div class="space-y-3">
																<div class="grid grid-cols-3 gap-3">
																	{#each contents.slice(0, 3) as content}
																		<Tooltip.Root>
																			<Tooltip.Trigger>
																				<div
																					class="cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition-colors hover:bg-gray-50"
																				>
																					<div class="text-center text-sm font-medium">
																						{content.name}
																					</div>
																				</div>
																			</Tooltip.Trigger>
																			<Tooltip.Content
																				class="z-50 max-w-xs rounded-lg border bg-white p-3 text-sm leading-relaxed text-black shadow-lg"
																				side="top"
																			>
																				<div>{content.description}</div>
																			</Tooltip.Content>
																		</Tooltip.Root>
																	{/each}
																</div>
																<div class="grid grid-cols-2 gap-3">
																	{#each contents.slice(3, 5) as content}
																		<Tooltip.Root>
																			<Tooltip.Trigger>
																				<div
																					class="cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition-colors hover:bg-gray-50"
																				>
																					<div class="text-center text-sm font-medium">
																						{content.name}
																					</div>
																				</div>
																			</Tooltip.Trigger>
																			<Tooltip.Content
																				class="z-50 max-w-xs rounded-lg border bg-white p-3 text-sm leading-relaxed text-black shadow-lg"
																				side="top"
																			>
																				<div>{content.description}</div>
																			</Tooltip.Content>
																		</Tooltip.Root>
																	{/each}
																</div>
															</div>
														{:else}
															<!-- 6+ items: multiple rows with max 4 per row -->
															<div class="space-y-3">
																{#each Array(Math.ceil(contentCount / 4)) as _, rowIndex}
																	{@const startIndex = rowIndex * 4}
																	{@const endIndex = Math.min(startIndex + 4, contentCount)}
																	{@const rowContents = contents.slice(startIndex, endIndex)}
																	<div
																		class="grid {rowContents.length === 1
																			? 'grid-cols-1'
																			: rowContents.length === 2
																				? 'grid-cols-2'
																				: rowContents.length === 3
																					? 'grid-cols-3'
																					: 'grid-cols-4'} gap-3"
																	>
																		{#each rowContents as content}
																			<Tooltip.Root>
																				<Tooltip.Trigger>
																					<div
																						class="cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition-colors hover:bg-gray-50"
																					>
																						<div class="text-center text-sm font-medium">
																							{content.name}
																						</div>
																					</div>
																				</Tooltip.Trigger>
																				<Tooltip.Content
																					class="z-50 max-w-xs rounded-lg border bg-white p-3 text-sm leading-relaxed text-black shadow-lg"
																					side="top"
																				>
																					<div>{content.description}</div>
																				</Tooltip.Content>
																			</Tooltip.Root>
																		{/each}
																	</div>
																{/each}
															</div>
														{/if}
													{:else}
														<p class="text-sm text-gray-500 italic">No content available</p>
													{/if}
												</div>
											</div>
										</div>
									{/each}
								{:else}
									<p class="text-sm text-gray-500">No learning areas selected</p>
								{/if}
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<!-- Bottom Action Bar -->
			{#if isEditMode && !isCreateMode}
				<div class="flex gap-2 bg-gray-50 p-4">
					<Button variant="outline" class="flex-1" onclick={handleCancel}>Cancel</Button>
					<Button class="flex-1" onclick={handleSave} disabled={isLoading}>Save Changes</Button>
				</div>
			{:else if !isCreateMode}
				<!-- View Mode Action Bar -->
				<div class="flex gap-2 bg-gray-50 p-4">
					<Button variant="outline" class="flex-1" onclick={handleClose}>Close</Button>
					<Button class="flex-1" onclick={handleEdit}>Edit</Button>
				</div>
			{/if}
		</DrawerContent>
	</Drawer>
</Tooltip.Provider>
