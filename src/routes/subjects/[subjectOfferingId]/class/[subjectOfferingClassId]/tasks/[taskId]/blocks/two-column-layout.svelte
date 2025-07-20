<script lang="ts">
	import { draggable, droppable, type DragDropState, dndState } from '@thisux/sveltednd';

	import Heading from './heading.svelte';
	import RichTextEditor from './rich-text-editor.svelte';
	import Image from './image.svelte';
	import Video from './video.svelte';
	import Audio from './audio.svelte';
	import Whiteboard from './whiteboard.svelte';
	import MultipleChoice from './multiple-choice.svelte';
	import FillInBlank from './fill-in-blank.svelte';
	import Matching from './matching.svelte';
	import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
	import { ViewMode } from '$lib/utils';

	interface TwoColumnContent {
		leftColumn: any[];
		rightColumn: any[];
	}

	let {
		content,
		viewMode = ViewMode.VIEW,
		onUpdate,
		onGlobalDrop,
		// Response props to pass through
		blockId,
		taskId,
		classTaskId,
		subjectOfferingId,
		subjectOfferingClassId,
		isPublished = false
	}: {
		content: TwoColumnContent;
		viewMode: ViewMode;
		onUpdate: (content: any) => Promise<void>;
		onGlobalDrop?: (state: DragDropState<any>) => Promise<void>;
		blockId?: number;
		taskId?: number;
		classTaskId?: number;
		subjectOfferingId?: string;
		subjectOfferingClassId?: string;
		isPublished?: boolean;
	} = $props();

	// Common response props for nested interactive blocks
	const responseProps = $derived({
		taskId,
		classTaskId,
		subjectOfferingId,
		subjectOfferingClassId,
		isPublished
	});

	let localContent = $state<TwoColumnContent>({
		leftColumn: content?.leftColumn || [],
		rightColumn: content?.rightColumn || []
	});

	let mouseOverElement = $state<string>('');

	const draggedOverClasses = 'border-accent-foreground bg-accent/10';
	const notDraggedOverClasses = 'border-muted';

	// Helper function to check if the current drag operation should trigger column highlighting
	function shouldHighlightColumn(targetContainer: string, sourceContainer?: string): boolean {
		if (!targetContainer) return false;

		// Don't highlight if this is an internal matching block drag operation
		if (
			sourceContainer === 'matching-right-items' ||
			sourceContainer?.startsWith('matching-right-item-')
		) {
			console.log('Blocking highlight for matching block internal drag:', {
				sourceContainer,
				targetContainer
			});
			return false;
		}

		console.log('Allowing highlight for drag:', { sourceContainer, targetContainer });
		return true;
	}

	// Auto-save when content changes
	$effect(() => {
		if (JSON.stringify(localContent) !== JSON.stringify(content)) {
			onUpdate(JSON.stringify(localContent));
		}
	});

	function createUpdateHandler(column: 'left' | 'right') {
		return (newContent: any) => {
			const columnKey = column === 'left' ? 'leftColumn' : 'rightColumn';
			const newArray = [...localContent[columnKey]];
			if (newArray.length > 0) {
				newArray[0] = { ...newArray[0], content: newContent };
				localContent = { ...localContent, [columnKey]: newArray };
			}
		};
	}

	function handleDrop(state: DragDropState<any>, targetColumn: 'left' | 'right') {
		const { draggedItem, sourceContainer, targetContainer } = state;

		if (!targetContainer || !targetContainer.startsWith('two-column-')) return;

		// Ignore drops from internal matching block containers
		if (
			sourceContainer === 'matching-right-items' ||
			sourceContainer?.startsWith('matching-right-item-')
		) {
			return;
		}

		// Call the global drop handler first (for task-level operations)
		if (onGlobalDrop) {
			onGlobalDrop(state);
		}

		// Only allow taskComponentItems to be dropped in columns
		const allowedTypes = [
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6',
			'markdown',
			'image',
			'video',
			'audio',
			'whiteboard',
			'multiple_choice',
			'fill_in_blank',
			'matching'
		];

		if (!allowedTypes.includes(draggedItem.type)) {
			console.warn('Only task component items can be dropped in columns');
			return;
		}

		const targetColumnKey = targetColumn === 'left' ? 'leftColumn' : 'rightColumn';

		// Check if target column already has a block (limit to one block per column)
		if (localContent[targetColumnKey].length > 0) {
			console.warn('Each column can only contain one block at a time');
			return;
		}

		if (sourceContainer === 'blockPalette' || sourceContainer.startsWith('task')) {
			// Add new item from palette or main task
			// For task blocks, preserve the exact content structure
			const newItem = {
				type: draggedItem.type,
				content: sourceContainer.startsWith('task') ? draggedItem.content : draggedItem.content,
				id: Date.now() // Temporary ID for local state
			};

			localContent = {
				...localContent,
				[targetColumnKey]: [newItem]
			};

			// If dragging from main task, the block will be removed by the main handleDrop function
		} else if (sourceContainer.startsWith('two-column-')) {
			// Handle moving items between columns
			const sourceColumn = sourceContainer.includes('left') ? 'left' : 'right';
			const sourceColumnKey = sourceColumn === 'left' ? 'leftColumn' : 'rightColumn';

			// Remove from source column
			const sourceItem = localContent[sourceColumnKey][0]; // Only one item per column

			localContent = {
				...localContent,
				[sourceColumnKey]: [],
				[targetColumnKey]: [sourceItem]
			};
		}
	}

	function removeItem(column: 'left' | 'right') {
		const columnKey = column === 'left' ? 'leftColumn' : 'rightColumn';
		localContent = {
			...localContent,
			[columnKey]: []
		};
	}

	// Handle when blocks are dragged OUT of columns to task or palette
	function handleBlockDraggedOut(column: 'left' | 'right') {
		removeItem(column);
	}
</script>

<div class="grid min-h-[200px] grid-cols-2 gap-4 rounded-lg border p-4">
	<!-- Left Column -->
	<div
		class="flex flex-col gap-2 rounded border border-dashed p-2 transition-colors {dndState.targetContainer ===
			'two-column-left-drop' &&
		shouldHighlightColumn(dndState.targetContainer, dndState.sourceContainer)
			? draggedOverClasses
			: notDraggedOverClasses}"
		use:droppable={{
			container: 'two-column-left-drop',
			callbacks: {
				onDrop: (state) => handleDrop(state, 'left')
			}
		}}
	>
		{#if localContent.leftColumn.length === 0}
			<div
				class="text-muted-foreground flex min-h-[100px] flex-1 items-center justify-center text-sm"
			>
				Drop a block here
			</div>
		{:else}
			{@const block = localContent.leftColumn[0]}
			<div class="group relative">
				<div
					class="grid {viewMode == ViewMode.EDIT ? 'grid-cols-[30px_1fr]' : 'grid-cols-1'} items-center gap-2"
					role="group"
					onmouseover={() => (mouseOverElement = 'left-column')}
					onfocus={() => (mouseOverElement = 'left-column')}
					onmouseleave={() => (mouseOverElement = '')}
				>
					{#if viewMode == ViewMode.EDIT && mouseOverElement === 'left-column'}
						<div
							use:draggable={{
								container: 'two-column-left-drag',
								dragData: block,
								callbacks: {
									onDragEnd: () => handleBlockDraggedOut('left')
								}
							}}
							class="group hover:bg-muted relative flex h-6 w-6 cursor-grab items-center justify-center rounded transition-colors active:cursor-grabbing"
						>
							<GripVerticalIcon
								class="text-muted-foreground group-hover:text-foreground h-3 w-3 rounded transition-colors"
							/>
						</div>
					{:else if viewMode == ViewMode.EDIT}
						<div></div>
					{/if}

					<div class="relative">
						{#if block.type === 'h1' || block.type === 'h2' || block.type === 'h3' || block.type === 'h4' || block.type === 'h5' || block.type === 'h6'}
							<Heading
								headingSize={parseInt(block.type[1])}
								text={typeof block.content === 'string' ? block.content : 'This is a heading'}
								{viewMode}
								onUpdate={createUpdateHandler('left')}
							/>
						{:else if block.type === 'markdown'}
							<RichTextEditor
								initialContent={block.content}
								{viewMode}
								onUpdate={createUpdateHandler('left')}
							/>
						{:else if block.type === 'image'}
							<Image content={block.content} {viewMode} onUpdate={createUpdateHandler('left')} />
						{:else if block.type === 'video'}
							<Video content={block.content} {viewMode} onUpdate={createUpdateHandler('left')} />
						{:else if block.type === 'audio'}
							<Audio content={block.content} {viewMode} onUpdate={createUpdateHandler('left')} />
						{:else if block.type === 'whiteboard'}
							<Whiteboard
								content={block.content}
								{viewMode}
								onUpdate={createUpdateHandler('left')}
							/>
						{:else if block.type === 'multiple_choice'}
							<MultipleChoice
								content={block.content}
								{viewMode}
								onUpdate={createUpdateHandler('left')}
								blockId={block.id || blockId}
								{...responseProps}
							/>
						{:else if block.type === 'fill_in_blank'}
							<FillInBlank
								content={block.content}
								{viewMode}
								onUpdate={createUpdateHandler('left')}
								blockId={block.id || blockId}
								{...responseProps}
							/>
						{:else if block.type === 'matching'}
							<Matching
								content={block.content}
								{viewMode}
								onUpdate={createUpdateHandler('left')}
								blockId={block.id || blockId}
								{...responseProps}
							/>
						{:else}
							<div class="bg-muted rounded p-2">
								Unsupported block type: {block.type}
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Right Column -->
	<div
		class="flex flex-col gap-2 rounded border border-dashed p-2 transition-colors {dndState.targetContainer ===
			'two-column-right-drop' &&
		shouldHighlightColumn(dndState.targetContainer, dndState.sourceContainer)
			? draggedOverClasses
			: notDraggedOverClasses}"
		use:droppable={{
			container: 'two-column-right-drop',
			callbacks: {
				onDrop: (state) => handleDrop(state, 'right')
			}
		}}
	>
		{#if localContent.rightColumn.length === 0}
			<div
				class="text-muted-foreground flex min-h-[100px] flex-1 items-center justify-center text-sm"
			>
				Drop a block here
			</div>
		{:else}
			{@const block = localContent.rightColumn[0]}
			<div class="group relative">
				<div
					class="grid {viewMode == ViewMode.EDIT ? 'grid-cols-[30px_1fr]' : 'grid-cols-1'} items-center gap-2"
					role="group"
					onmouseover={() => (mouseOverElement = 'right-column')}
					onfocus={() => (mouseOverElement = 'right-column')}
					onmouseleave={() => (mouseOverElement = '')}
				>
					{#if viewMode == ViewMode.EDIT && mouseOverElement === 'right-column'}
						<div
							use:draggable={{
								container: 'two-column-right-drag',
								dragData: block,
								callbacks: {
									onDragEnd: () => handleBlockDraggedOut('right')
								}
							}}
							class="group hover:bg-muted relative flex h-6 w-6 cursor-grab items-center justify-center rounded transition-colors active:cursor-grabbing"
						>
							<GripVerticalIcon
								class="text-muted-foreground group-hover:text-foreground h-3 w-3 rounded transition-colors"
							/>
						</div>
					{:else if viewMode == ViewMode.EDIT}
						<div></div>
					{/if}

					<div class="relative">
						{#if block.type === 'h1' || block.type === 'h2' || block.type === 'h3' || block.type === 'h4' || block.type === 'h5' || block.type === 'h6'}
							<Heading
								headingSize={parseInt(block.type[1])}
								text={typeof block.content === 'string' ? block.content : 'This is a heading'}
								{viewMode}
								onUpdate={createUpdateHandler('right')}
							/>
						{:else if block.type === 'markdown'}
							<RichTextEditor
								initialContent={block.content}
								{viewMode}
								onUpdate={createUpdateHandler('right')}
							/>
						{:else if block.type === 'image'}
							<Image content={block.content} {viewMode} onUpdate={createUpdateHandler('right')} />
						{:else if block.type === 'video'}
							<Video content={block.content} {viewMode} onUpdate={createUpdateHandler('right')} />
						{:else if block.type === 'audio'}
							<Audio content={block.content} {viewMode} onUpdate={createUpdateHandler('right')} />
						{:else if block.type === 'whiteboard'}
							<Whiteboard
								content={block.content}
								{viewMode}
								onUpdate={createUpdateHandler('right')}
							/>
						{:else if block.type === 'multiple_choice'}
							<MultipleChoice
								content={block.content}
								{viewMode}
								onUpdate={createUpdateHandler('right')}
								blockId={block.id || blockId}
								{...responseProps}
							/>
						{:else if block.type === 'fill_in_blank'}
							<FillInBlank
								content={block.content}
								{viewMode}
								onUpdate={createUpdateHandler('right')}
								blockId={block.id || blockId}
								{...responseProps}
							/>
						{:else if block.type === 'matching'}
							<Matching
								content={block.content}
								{viewMode}
								onUpdate={createUpdateHandler('right')}
								blockId={block.id || blockId}
								{...responseProps}
							/>
						{:else}
							<div class="bg-muted rounded p-2">
								Unsupported block type: {block.type}
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
