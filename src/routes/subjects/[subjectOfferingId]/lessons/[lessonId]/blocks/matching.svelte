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
	import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';

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
		isEditMode = true,
		onUpdate = () => {}
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
	let userMatches = $state<Map<string, string>>(new Map()); // Maps left item to right item
	let showFeedback = $state(false);

	// Drag and drop state for preview mode
	let draggedItem = $state<string | null>(null);

	// Sync with prop changes
	$effect(() => {
		const newNormalized = normalizeContent(content);
		if (JSON.stringify(newNormalized) !== JSON.stringify(normalizedContent)) {
			normalizedContent = newNormalized;
			instructions = newNormalized.instructions;
			pairs = newNormalized.pairs.length > 0 ? [...newNormalized.pairs] : [{ left: '', right: '' }];
		}
	});

	// Initialize state on mount
	$effect(() => {
		if ((!instructions || instructions === '') && pairs.length === 0) {
			const normalized = normalizeContent(content);
			instructions = normalized.instructions;
			pairs = normalized.pairs.length > 0 ? [...normalized.pairs] : [{ left: '', right: '' }];
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
	function handleDragStart(item: string) {
		draggedItem = item;
	}

	function handleDragOver(state: DragDropState<any>) {
		const { draggedItem: draggedData, sourceContainer, targetContainer } = state;
		
		// Update visual state
		if (sourceContainer === 'right-items') {
			draggedItem = draggedData; // draggedData should be the right item text
		}
	}

	function handleDrop(state: DragDropState<any>) {
		const { draggedItem: droppedItem, targetContainer } = state;
		
		if (!droppedItem || !targetContainer) return;

		// Extract the left item from the drop target
		const leftItem = targetContainer.replace('drop-zone-', '');
		
		// Update user matches - droppedItem should be the dragData (the right item text)
		userMatches.set(leftItem, droppedItem);
		userMatches = new Map(userMatches);
		
		// Reset drag state
		draggedItem = null;
	}

	function removeMatch(leftItem: string) {
		userMatches.delete(leftItem);
		userMatches = new Map(userMatches);
	}

	function submitAnswers() {
		hasSubmitted = true;
		showFeedback = true;
	}

	function resetAnswers() {
		hasSubmitted = false;
		showFeedback = false;
		userMatches = new Map();
	}

	function isCorrectMatch(leftItem: string): boolean {
		const userAnswer = userMatches.get(leftItem);
		const correctPair = pairs.find(pair => pair.left === leftItem);
		return userAnswer === correctPair?.right;
	}

	// Get available right items (not yet matched)
	function getAvailableRightItems(): string[] {
		const matchedRightItems = new Set(userMatches.values());
		return pairs.map(pair => pair.right).filter(right => !matchedRightItems.has(right));
	}
</script>

{#if isEditMode}
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
{:else}
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
				<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
					<!-- Left Items (Drop Zones) -->
					<div class="space-y-3">
						<h3 class="font-medium text-sm text-muted-foreground">Match these items:</h3>
						{#each pairs.filter(pair => pair.left.trim() && pair.right.trim()) as pair}
							<div 
								use:droppable={{
									container: `drop-zone-${pair.left}`,
									callbacks: {
										onDrop: handleDrop,
										onDragOver: handleDragOver
									}
								}}
								class="min-h-12 p-3 border-2 border-dashed rounded-lg bg-muted/30 flex items-center justify-between transition-colors hover:bg-muted/50
									{draggedItem ? 'border-primary' : 'border-border'}"
							>
								<span class="font-medium">{pair.left}</span>
								
								{#if userMatches.has(pair.left)}
									<div class="flex items-center gap-2">
										<span class="px-2 py-1 bg-primary text-primary-foreground rounded text-sm">
											{userMatches.get(pair.left)}
										</span>
										{#if showFeedback}
											{#if isCorrectMatch(pair.left)}
												<CheckIcon class="w-4 h-4 text-green-600" />
											{:else}
												<XIcon class="w-4 h-4 text-red-600" />
											{/if}
										{/if}
										{#if !hasSubmitted}
											<Button 
												variant="ghost" 
												size="sm" 
												onclick={() => removeMatch(pair.left)}
												class="h-6 w-6 p-0"
											>
												<XIcon class="w-3 h-3" />
											</Button>
										{/if}
									</div>
								{:else}
									<span class="text-xs text-muted-foreground">Drop here</span>
								{/if}
							</div>
						{/each}
					</div>

					<!-- Right Items (Draggable) -->
					<div class="space-y-3">
						<h3 class="font-medium text-sm text-muted-foreground">Available answers:</h3>
						<div class="space-y-2">
							{#each getAvailableRightItems() as rightItem}
								<div 
									use:draggable={{
										container: 'right-items',
										dragData: rightItem
									}}
									class="p-3 bg-secondary hover:bg-secondary/80 rounded-lg cursor-grab active:cursor-grabbing transition-colors border
										{draggedItem === rightItem ? 'opacity-50' : ''}"
								>
									{rightItem}
								</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="flex gap-2 pt-4">
					{#if !hasSubmitted}
						<Button 
							onclick={submitAnswers}
							disabled={userMatches.size !== pairs.filter(pair => pair.left.trim() && pair.right.trim()).length}
						>
							Submit Answers
						</Button>
					{:else}
						<Button variant="outline" onclick={resetAnswers}>
							Try Again
						</Button>
					{/if}
				</div>

				<!-- Feedback -->
				{#if showFeedback}
					<div class="mt-4 p-4 rounded-lg border bg-muted/30">
						<h4 class="font-medium mb-2">Results:</h4>
						<div class="space-y-1 text-sm">
							{#each pairs.filter(pair => pair.left.trim() && pair.right.trim()) as pair}
								<div class="flex items-center gap-2">
									{#if isCorrectMatch(pair.left)}
										<CheckIcon class="w-4 h-4 text-green-600" />
										<span><strong>{pair.left}</strong> → {pair.right} ✓</span>
									{:else}
										<XIcon class="w-4 h-4 text-red-600" />
										<span><strong>{pair.left}</strong> → {userMatches.get(pair.left) || 'No answer'} (Correct: {pair.right})</span>
									{/if}
								</div>
							{/each}
						</div>
						<div class="mt-3 text-sm font-medium">
							Score: {pairs.filter(pair => pair.left.trim() && pair.right.trim() && isCorrectMatch(pair.left)).length} / {pairs.filter(pair => pair.left.trim() && pair.right.trim()).length}
						</div>
					</div>
				{/if}
			{:else}
				<p class="text-muted-foreground">No matching pairs configured. Switch to edit mode to add pairs.</p>
			{/if}
		</Card.Content>
	</Card.Root>
{/if}
