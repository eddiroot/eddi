<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';
	import { ViewMode } from '$lib/utils';
	import { saveTaskBlockResponse, createDebouncedSave, loadExistingResponse as loadExistingResponseFromAPI } from '../utils/auto-save.js';

	interface MatchingPair {
		left: string;
		right: string;
	}

	interface MatchingContent {
		instructions: string;
		pairs: MatchingPair[];
	}

	// Component props using Svelte 5 syntax
	let {
		content = {
			instructions: '',
			pairs: []
		} as MatchingContent,
		viewMode = ViewMode.VIEW,
		onUpdate = () => {},
		onPresentationAnswer = () => {},
		// New props for response saving
		blockId,
		taskId,
		classTaskId,
		subjectOfferingId,
		subjectOfferingClassId,
		isPublished = false
	} = $props();

	// Normalize content to handle potential legacy formats
	function normalizeContent(content: any): MatchingContent {
		if (!content || typeof content !== 'object') {
			return { instructions: '', pairs: [] };
		}

		return {
			instructions: content.instructions || '',
			pairs: Array.isArray(content.pairs) ? content.pairs.map((pair: any) => ({
				left: pair?.left || '',
				right: pair?.right || ''
			})) : []
		};
	}

	// State management
	let normalizedContent = $state(normalizeContent(content));
	let instructions = $state('');
	let pairs = $state<MatchingPair[]>([]);

	// Preview mode state
	let hasSubmitted = $state(false);
	let showFeedback = $state(false);
	let rightItemsOrder = $state<string[]>([]);

	// Drag and drop state for preview mode
	let draggedItem = $state<string | null>(null);

	// Auto-save function for student responses
	const debouncedSaveResponse = createDebouncedSave(async (response: unknown) => {
		if (isPublished && blockId && classTaskId) {
			await saveTaskBlockResponse(
				blockId,
				classTaskId,
				response
			);
		}
	}, 1000); // 1 second delay for matching

	// Sync with prop changes
	$effect(() => {
		const newNormalized = normalizeContent(content);
		if (JSON.stringify(newNormalized) !== JSON.stringify(normalizedContent)) {
			normalizedContent = newNormalized;
			instructions = newNormalized.instructions;
			pairs = newNormalized.pairs.length > 0 ? [...newNormalized.pairs] : [{ left: '', right: '' }];
			
			// Reset right items order when content changes
			if (newNormalized.pairs.length > 0) {
				rightItemsOrder = [...newNormalized.pairs.map(pair => pair.right)].sort(() => Math.random() - 0.5);
			}

			// Reset user state
			hasSubmitted = false;
			showFeedback = false;

			// Load existing response for published tasks in view mode
			if (isPublished && viewMode === ViewMode.VIEW) {
				loadExistingResponse();
			}
		}
	});

	// Initialize state on mount
	$effect(() => {
		if ((!instructions || instructions === '') && pairs.length === 0) {
			const normalized = normalizeContent(content);
			instructions = normalized.instructions;
			pairs = normalized.pairs.length > 0 ? [...normalized.pairs] : [{ left: '', right: '' }];
			
			// Initialize right items in random order
			if (normalized.pairs.length > 0) {
				rightItemsOrder = [...normalized.pairs.map(pair => pair.right)].sort(() => Math.random() - 0.5);
			}

			// Load existing response for published tasks in view mode
			if (isPublished && viewMode === ViewMode.VIEW) {
				loadExistingResponse();
			}
		}
	});

	// Save function
	function save() {
		const validPairs = pairs.filter(pair => pair.left.trim() && pair.right.trim());
		const updatedContent = {
			instructions: instructions.trim(),
			pairs: validPairs
		};

		try {
			onUpdate(updatedContent);
		} catch (error) {
			console.error('Failed to save matching block:', error);
		}
	}

	// Edit mode functions
	function addPair() {
		pairs = [...pairs, { left: '', right: '' }];
		save();
	}

	function removePair(index: number) {
		if (pairs.length > 1) {
			pairs = pairs.filter((_, i) => i !== index);
			save();
		}
	}

	function updatePair(index: number, field: 'left' | 'right', value: string) {
		pairs[index][field] = value;
		save();
	}

	// Preview mode functions
	function handleDragOver(state: DragDropState<any>) {
		const { draggedItem: draggedData, sourceContainer } = state;
		
		console.log('Matching block drag over:', { sourceContainer, draggedData });
		
		// Update visual state for right items reordering
		if (sourceContainer === 'matching-right-items') {
			draggedItem = draggedData;
		}
	}

	function handleDrop(state: DragDropState<any>) {
		const { draggedItem: droppedItem, targetContainer, sourceContainer } = state;
		
		console.log('Matching block drop:', { sourceContainer, targetContainer, droppedItem });
		
		if (!droppedItem || !targetContainer || sourceContainer !== 'matching-right-items' || !targetContainer.startsWith('matching-right-item-')) {
			return;
		}

		// Extract target index from container name
		const targetIndex = parseInt(targetContainer.replace('matching-right-item-', ''), 10);
		const sourceIndex = rightItemsOrder.indexOf(droppedItem);
		
		if (sourceIndex === -1 || targetIndex < 0 || targetIndex >= rightItemsOrder.length) {
			return;
		}

		// Reorder the right items
		const newOrder = [...rightItemsOrder];
		const [movedItem] = newOrder.splice(sourceIndex, 1);
		newOrder.splice(targetIndex, 0, movedItem);
		rightItemsOrder = newOrder;
		
		// Reset drag state
		draggedItem = null;

		// Auto-save response for published tasks
		if (isPublished && viewMode === ViewMode.VIEW) {
			const response = {
				rightItemsOrder: [...rightItemsOrder],
				submittedAt: new Date().toISOString()
			};
			debouncedSaveResponse(response);
		}
	}

	// Save student response for published tasks
	async function saveStudentResponse() {
		if (!isPublished || !blockId || !classTaskId) return;
		
		try {
			const response = {
				rightItemsOrder: [...rightItemsOrder],
				submittedAt: new Date().toISOString()
			};
			
			await saveTaskBlockResponse(
				blockId,
				classTaskId,
				response
			);
		} catch (error) {
			console.error('Failed to save matching response:', error);
		}
	}

	// Load existing user response using centralized function
	async function loadExistingResponse() {
		if (!isPublished || !blockId) return;
		
		const existingResponse = await loadExistingResponseFromAPI(blockId, taskId, subjectOfferingClassId);
		if (existingResponse && existingResponse.rightItemsOrder) {
			rightItemsOrder = [...existingResponse.rightItemsOrder];
		}
	}

	function submitAnswers() {
		hasSubmitted = true;
		showFeedback = true;
	}

	function resetAnswers() {
		hasSubmitted = false;
		showFeedback = false;
		// Shuffle right items again
		const validPairs = pairs.filter(pair => pair.left.trim() && pair.right.trim());
		rightItemsOrder = [...validPairs.map(pair => pair.right)].sort(() => Math.random() - 0.5);
	}

	function isCorrectMatch(index: number): boolean {
		const validPairs = pairs.filter(pair => pair.left.trim() && pair.right.trim());
		if (index >= validPairs.length || index >= rightItemsOrder.length) return false;
		
		const leftItem = validPairs[index].left;
		const rightItem = rightItemsOrder[index];
		const correctPair = validPairs.find(pair => pair.left === leftItem);
		
		return rightItem === correctPair?.right;
	}

	function getScore(): { correct: number; total: number } {
		const validPairs = pairs.filter(pair => pair.left.trim() && pair.right.trim());
		let correct = 0;
		
		for (let i = 0; i < Math.min(validPairs.length, rightItemsOrder.length); i++) {
			if (isCorrectMatch(i)) {
				correct++;
			}
		}
		
		return { correct, total: validPairs.length };
	}
</script>

{#if viewMode === ViewMode.EDIT}
	<Card.Root class="p-4">
		<Card.Header>
			<Card.Title class="text-lg font-semibold">Matching Exercise</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-4">
			<!-- Instructions -->
			<div class="space-y-2">
				<Label for="instructions">Instructions</Label>
				<Textarea
					id="instructions"
					bind:value={instructions}
					placeholder="Enter instructions for the matching exercise..."
					class="min-h-20"
					onblur={save}
				/>
			</div>

			<!-- Pairs -->
			<div class="space-y-4">
				<div class="flex justify-between items-center">
					<Label class="text-sm font-medium">Matching Pairs</Label>
					<Button variant="outline" size="sm" onclick={addPair}>
						<PlusIcon class="w-4 h-4 mr-2" />
						Add Pair
					</Button>
				</div>

				{#each pairs as pair, index (index)}
					<div class="flex gap-4 items-center p-3 border rounded-lg">
						<div class="flex-1">
							<Label class="text-xs text-muted-foreground">Left Item</Label>
							<Input
								bind:value={pair.left}
								placeholder="Left item..."
								class="mt-1"
								onblur={() => save()}
							/>
						</div>
						
						<div class="text-muted-foreground">↔</div>
						
						<div class="flex-1">
							<Label class="text-xs text-muted-foreground">Right Item</Label>
							<Input
								bind:value={pair.right}
								placeholder="Right item..."
								class="mt-1"
								onblur={() => save()}
							/>
						</div>

						{#if pairs.length > 1}
							<Button 
								variant="outline" 
								size="sm"
								onclick={() => removePair(index)}
								class="text-destructive hover:text-destructive"
							>
								<TrashIcon class="w-4 h-4" />
							</Button>
						{/if}
					</div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>
{:else if viewMode === ViewMode.VIEW}
	<!-- Preview Mode -->
	<Card.Root class="p-6">
		<Card.Header>
			<Card.Title class="text-lg font-semibold">Matching Exercise</Card.Title>
			{#if instructions}
				<Card.Description class="text-sm text-muted-foreground whitespace-pre-wrap">{instructions}</Card.Description>
			{/if}
		</Card.Header>
		<Card.Content class="space-y-6">
			{#if pairs.length > 0 && pairs.some(pair => pair.left.trim() && pair.right.trim())}
				<div class="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-8 items-start">
					<!-- Left Items (Fixed Order) -->
					<div class="space-y-3">
						<h3 class="font-medium text-sm text-muted-foreground">Items to match:</h3>
						<div class="space-y-2 min-h-[200px]">
							{#each pairs.filter(pair => pair.left.trim() && pair.right.trim()) as pair, index}
								<div class="min-h-12 p-3 border rounded-lg bg-muted/20 flex items-center justify-between">
									<div class="flex items-center gap-3">
										<span class="text-sm font-medium text-muted-foreground w-6">{index + 1}.</span>
										<span class="font-medium">{pair.left}</span>
									</div>
									{#if showFeedback}
										{#if isCorrectMatch(index)}
											<CheckIcon class="w-4 h-4 text-green-600" />
										{:else}
											<XIcon class="w-4 h-4 text-red-600" />
										{/if}
									{/if}
								</div>
							{/each}
						</div>
					</div>

					<!-- Arrow Column (hidden on mobile) -->
					<div class="hidden md:flex flex-col items-center justify-center min-h-[200px] px-2">
						<div class="text-muted-foreground">
							<ArrowRightIcon class="w-6 h-6" />
						</div>
						<div class="text-xs text-muted-foreground text-center mt-2 writing-mode-vertical">
							Match order
						</div>
					</div>

					<!-- Right Items (Reorderable) -->
					<div class="space-y-3">
						<h3 class="font-medium text-sm text-muted-foreground">
							{hasSubmitted ? 'Your answers:' : 'Drag to reorder these answers:'}
						</h3>
						<!-- Drag isolation wrapper -->
						<div 
							class="space-y-2 min-h-[200px] matching-drag-area"
							style="position: relative; z-index: 1;"
							role="group"
							aria-label="Matching exercise drag area"
							ondragstart={(e) => e.stopPropagation()}
							ondragover={(e) => { e.preventDefault(); e.stopPropagation(); }}
							ondrop={(e) => { e.preventDefault(); e.stopPropagation(); }}
							ondragenter={(e) => { e.preventDefault(); e.stopPropagation(); }}
							ondragleave={(e) => { e.preventDefault(); e.stopPropagation(); }}
						>
							{#each rightItemsOrder as rightItem, index}
								<div 
									use:draggable={{
										container: 'matching-right-items',
										dragData: rightItem
									}}
									use:droppable={{
										container: `matching-right-item-${index}`,
										callbacks: {
											onDrop: handleDrop,
											onDragOver: handleDragOver
										}
									}}
									class="min-h-12 p-3 border rounded-lg flex items-center justify-between transition-colors
										{hasSubmitted && !isPublished ? 'bg-muted/20' : 'bg-secondary hover:bg-secondary/80 cursor-grab active:cursor-grabbing'}
										{draggedItem === rightItem ? 'opacity-50' : ''}
										{showFeedback ? (isCorrectMatch(index) ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}"
									style="position: relative; z-index: 2;"
									role="button"
									aria-label="Drag to reorder item: {rightItem}"
									tabindex="0"
									ondragstart={(e) => e.stopPropagation()}
									ondragover={(e) => { e.preventDefault(); e.stopPropagation(); }}
									ondrop={(e) => { e.preventDefault(); e.stopPropagation(); }}
									ondragenter={(e) => { e.preventDefault(); e.stopPropagation(); }}
									ondragleave={(e) => { e.preventDefault(); e.stopPropagation(); }}
								>
									<div class="flex items-center gap-3">
										<span class="text-sm font-medium text-muted-foreground w-6">{index + 1}.</span>
										<span class="font-medium">{rightItem}</span>
									</div>
									{#if showFeedback}
										{#if isCorrectMatch(index)}
											<CheckIcon class="w-4 h-4 text-green-600" />
										{:else}
											<XIcon class="w-4 h-4 text-red-600" />
										{/if}
									{/if}
								</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- Action Buttons - Only show for non-published tasks -->
				{#if !isPublished}
					<div class="flex gap-2 pt-4">
						{#if !hasSubmitted}
							<Button 
								onclick={submitAnswers}
								disabled={rightItemsOrder.length !== pairs.filter(pair => pair.left.trim() && pair.right.trim()).length}
							>
								Submit Answers
							</Button>
						{:else}
							<Button variant="outline" onclick={resetAnswers}>
								Try Again
							</Button>
						{/if}
					</div>
				{/if}

				<!-- Feedback -->
				{#if showFeedback}
					{@const score = getScore()}
					<div class="mt-4 p-4 rounded-lg border bg-muted/30">
						<h4 class="font-medium mb-2">Results:</h4>
						<div class="space-y-1 text-sm">
							{#each pairs.filter(pair => pair.left.trim() && pair.right.trim()) as pair, index}
								<div class="flex items-center gap-2">
									{#if isCorrectMatch(index)}
										<CheckIcon class="w-4 h-4 text-green-600" />
										<span><strong>{index + 1}. {pair.left}</strong> → {rightItemsOrder[index]} ✓</span>
									{:else}
										<XIcon class="w-4 h-4 text-red-600" />
										<span><strong>{index + 1}. {pair.left}</strong> → {rightItemsOrder[index] || 'No answer'} (Correct: {pair.right})</span>
									{/if}
								</div>
							{/each}
						</div>
						<div class="mt-3 text-sm font-medium">
							Score: {score.correct} / {score.total}
						</div>
					</div>
				{/if}
			{:else}
				<p class="text-muted-foreground">No matching pairs configured. Switch to edit mode to add pairs.</p>
			{/if}
		</Card.Content>
	</Card.Root>
{/if}
