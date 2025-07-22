<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import { draggable, droppable, type DragDropState, dndState } from '@thisux/sveltednd';
	import Heading from './blocks/heading.svelte';
	import RichTextEditor from './blocks/rich-text-editor.svelte';
	import Image from './blocks/image.svelte';
	import Video from './blocks/video.svelte';
	import Audio from './blocks/audio.svelte';
	import Whiteboard from './blocks/whiteboard.svelte';
	import MultipleChoice from './blocks/multiple-choice.svelte';
	import FillInBlank from './blocks/fill-in-blank.svelte';
	import Matching from './blocks/matching.svelte';
	import TwoColumnLayout from './blocks/two-column-layout.svelte';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EditIcon from '@lucide/svelte/icons/edit';
	import ShortAnswer from './blocks/short-answer.svelte';
	import { type TaskBlock } from '$lib/server/db/schema';
	import { ViewMode } from '$lib/utils';

	import {
		createBlock,
		deleteBlock,
		updateBlock,
		updateTaskTitle,
		updateBlockOrder
	} from './client';
	import { blockTypes } from './constants';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
	import { browser } from '$app/environment';

	let { data } = $props();
	
	let blocks = $state(data.blocks);
	let mouseOverElement = $state<string>('');
	let taskStatus = $state<string>(data.classTask.status);
	let manualViewMode = $state<ViewMode | null>(null); // Override for manual switching

	// Common response props for all interactive blocks
	const responseProps = $derived({
		taskId: data.task.id,
		classTaskId: data.classTask.id,
		subjectOfferingId: data.subjectOfferingId,
		subjectOfferingClassId: data.subjectOfferingClassId,
		isPublished: taskStatus === 'published'
	});

	// Use a derived value for viewMode that updates reactively
	let viewMode = $derived<ViewMode>(
		manualViewMode !== null 
			? manualViewMode
			: data.user.type === 'student' || taskStatus === 'published'
			? ViewMode.VIEW
			: ViewMode.EDIT
	);

	const draggedOverClasses = 'border-accent-foreground';
	const notDraggedOverClasses = 'border-bg';

	// Handle status changes
	async function publishTask() {
		try {
			const response = await fetch(`?/publish`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				}
			});

			if (response.ok) {
				// Update local state instead of reloading
				taskStatus = 'published';
				manualViewMode = null; // Reset manual override
			} else {
				alert('Failed to publish task');
			}
		} catch (error) {
			console.error('Error publishing task:', error);
			alert('Failed to publish task');
		}
	}

	async function setToDraft() {
		try {
			const response = await fetch(`?/setToDraft`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				}
			});

			if (response.ok) {
				// Update local state instead of reloading
				taskStatus = 'draft';
				manualViewMode = null; // Reset manual override
			} else {
				alert('Failed to set task to draft');
			}
		} catch (error) {
			console.error('Error setting task to draft:', error);
			alert('Failed to set task to draft');
		}
	}

	async function handleDrop(state: DragDropState<TaskBlock>) {
		const { draggedItem, sourceContainer, targetContainer } = state;
		if (!targetContainer) return;

		if (sourceContainer === 'blockPalette' && targetContainer.startsWith('task')) {
			const index = blocks.findIndex((b) => b.id.toString() === targetContainer.split('-')[1]);

			const { block } = await createBlock({
				taskId: data.task.id,
				type: draggedItem.type,
				content: draggedItem.content,
				index: targetContainer === 'task-bottom' ? blocks.length : index
			});

			if (!block) {
				alert('Failed to create block. Please try again.');
				return;
			}

			if (targetContainer === 'task-bottom') {
				blocks = [...blocks, block];
			} else if (index !== -1) {
				blocks = [...blocks.slice(0, index), block, ...blocks.slice(index)];
			} else {
				alert('Failed to insert block at the correct position. Please try again.');
				return;
			}
		}

		// Handle drops from two-column layout to main task
		if (sourceContainer.startsWith('two-column-') && targetContainer.startsWith('task')) {
			const index = blocks.findIndex((b) => b.id.toString() === targetContainer.split('-')[1]);

			const { block } = await createBlock({
				taskId: data.task.id,
				type: draggedItem.type,
				content: draggedItem.content,
				index: targetContainer === 'task-bottom' ? blocks.length : index
			});

			if (!block) {
				alert('Failed to create block. Please try again.');
				return;
			}

			if (targetContainer === 'task-bottom') {
				blocks = [...blocks, block];
			} else if (index !== -1) {
				blocks = [...blocks.slice(0, index), block, ...blocks.slice(index)];
			} else {
				alert('Failed to insert block at the correct position. Please try again.');
				return;
			}
		}

		if (sourceContainer.startsWith('task') && targetContainer.startsWith('task')) {
			const sourceIndex = draggedItem.index;
			const targetIndex = blocks.findIndex(
				(b) => b.id.toString() === targetContainer.split('-')[1]
			);

			if (targetIndex === -1 || sourceIndex === -1) {
				alert('Failed to find block for drag and drop. Please try again.');
				return;
			}

			if (sourceIndex === targetIndex) {
				return;
			}

			const newBlocks = [...blocks];
			const [movedBlock] = newBlocks.splice(sourceIndex, 1);

			// Adjust target index if moving downwards (after removing the source item, indices shift)
			const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
			newBlocks.splice(adjustedTargetIndex, 0, movedBlock);

			const finalisedBlocks = newBlocks.map((block, index) => ({
				...block,
				index
			}));

			const blockOrder = finalisedBlocks.map(({ id, index }) => ({
				id,
				index
			}));

			try {
				await updateBlockOrder({ blockOrder });
			} catch (error) {
				blocks = [...blocks];
				alert('Failed to update block order. Please try again.');
				console.error('Error updating block order:', error);
			}

			blocks = finalisedBlocks;
		}

		if (sourceContainer.startsWith('task') && targetContainer === 'blockPalette') {
			const { success } = await deleteBlock(draggedItem.id);
			if (!success) {
				alert('Failed to delete block. Please try again.');
				return;
			}
			blocks = blocks.filter((block) => block.id !== draggedItem.id);
		}

		// Handle drops from two-column layout to palette (deletion)
		if (sourceContainer.startsWith('two-column-') && targetContainer === 'blockPalette') {
			// No server action needed since two-column blocks are not persisted individually
			// The onDragEnd callback in the two-column component will handle removal
			console.log('Block dragged from two-column to palette for deletion');
		}

		// Handle drops from main task to two-column layout
		if (sourceContainer.startsWith('task') && targetContainer.startsWith('two-column-')) {
			const { success } = await deleteBlock(draggedItem.id);
			if (!success) {
				alert('Failed to move block to column. Please try again.');
				return;
			}
			blocks = blocks.filter((block) => block.id !== draggedItem.id);
		}
	}
</script>

<div
	class="grid h-full gap-4 p-4 {viewMode === ViewMode.EDIT
		? 'grid-cols-[200px_1fr_300px]'
		: 'grid-cols-[200px_1fr]'}"
>
	<!-- Contents Pane -->
	<div class="flex flex-col gap-2">
		{#if data.user.type !== 'student'}
			{#if taskStatus === 'published'}
				<Button
					variant="outline"
					onclick={setToDraft}
					size="lg"
					class="flex h-16 w-full items-center justify-center gap-2 whitespace-normal"
				>
					<EditIcon class="size-5" />
					Set to Draft
				</Button>
			{:else}
				<Button
					variant="outline"
					onclick={() => {
						if (viewMode === ViewMode.EDIT) {
							manualViewMode = ViewMode.VIEW;
						} else {
							manualViewMode = ViewMode.EDIT;
						}
					}}
					size="lg"
					class="flex h-16 w-full items-center justify-center gap-2 whitespace-normal"
				>
					{#if viewMode === ViewMode.EDIT}
						<EyeIcon class="size-5" />
						Switch to Preview Mode
					{:else}
						<EditIcon class="size-5" />
						Switch to Edit Mode
					{/if}
				</Button>
			{/if}
			<Button
				variant="outline"
				href={`/subjects/${data.subjectOfferingId}/class/${data.subjectOfferingClassId}/tasks/${data.task.id}/present`}
				size="lg"
				class="flex h-16 w-full items-center justify-center gap-2 whitespace-normal"
			>
				Start Presentation
			</Button>
		{:else if data.activePresentation}
			<Button
				variant="outline"
				href={`/subjects/${data.subjectOfferingId}/class/${data.subjectOfferingClassId}/tasks/${data.task.id}/present`}
				size="lg"
				class="flex h-16 w-full items-center justify-center gap-2 whitespace-normal"
			>
				Join Presentation
			</Button>
		{/if}
		<Card.Root class="h-full">
			<Card.Header>
				<Card.Title class="text-center text-lg">Contents</Card.Title>
			</Card.Header>
			<Card.Content></Card.Content>
		</Card.Root>
	</div>

	<!-- Task Blocks -->
	<Card.Root class="h-full overflow-y-auto">
		<Card.Content class="h-full space-y-4">
			<div class={viewMode === ViewMode.EDIT ? 'ml-[38px]' : ''}>
				<div class="flex items-center gap-3">
					<Heading
						headingSize={1}
						text={data.task.title}
						{viewMode}
						onUpdate={async (newText: string) =>
							await updateTaskTitle({ taskId: data.task.id, title: newText })}
					/>
					<div class="text-muted-foreground text-lg font-light flex items-center gap-2">
						{#if taskStatus === 'draft'}
							<span>Draft</span>
						{/if}
					</div>
				</div>
			</div>
			<div class="flex h-full flex-col">
				{#each blocks as block}
					<div
						class="min-h-4"
						use:droppable={{
							container: `task-${block.id}`,
							callbacks: {
								onDrop: handleDrop
							}
						}}
					>
						{#if dndState.targetContainer === `task-${block.id}`}
							<Separator class="bg-accent-foreground my-2" />
						{/if}
					</div>

					<div
						class="grid {viewMode === ViewMode.EDIT ? 'grid-cols-[30px_1fr]' : 'grid-cols-1'} items-center gap-2"
						role="group"
						onmouseover={() => (mouseOverElement = `task-${block.id}`)}
						onfocus={() => (mouseOverElement = `task-${block.id}`)}
					>
						{#if viewMode === ViewMode.EDIT && mouseOverElement === `task-${block.id}`}
							<div
								use:draggable={{
									container: 'task',
									dragData: block
								}}
								class="group hover:bg-muted relative flex h-6 w-6 cursor-grab items-center justify-center rounded transition-colors active:cursor-grabbing"
							>
								<GripVerticalIcon
									class="text-muted-foreground group-hover:text-foreground h-3 w-3 rounded transition-colors"
								/>
							</div>
						{:else if viewMode === ViewMode.EDIT}
							<div></div>
						{/if}
						<div>
							{#if block.type === 'h1' || block.type === 'h2' || block.type === 'h3' || block.type === 'h4' || block.type === 'h5' || block.type === 'h6'}
								<Heading
									headingSize={parseInt(block.type[1]) + 1}
									text={typeof block.content === 'string' ? block.content : 'This is a heading'}
									{viewMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === 'markdown'}
								<RichTextEditor
									initialContent={block.content as string | undefined}
									{viewMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === 'image'}
								<Image
									content={block.content as Record<string, any> | undefined}
									{viewMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === 'video'}
								<Video
									content={block.content as Record<string, any> | undefined}
									{viewMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === 'audio'}
								<Audio
									content={block.content as Record<string, any> | undefined}
									{viewMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === 'whiteboard'}
								<Whiteboard
									content={block.content as Record<string, any> | undefined}
									{viewMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === 'multiple_choice'}
								<MultipleChoice
									content={block.content as any}
									{viewMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
									blockId={block.id}
									{...responseProps}
								/>
							{:else if block.type === 'fill_in_blank'}
								<FillInBlank
									content={block.content as any}
									{viewMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
									blockId={block.id}
									{...responseProps}
								/>
							{:else if block.type === 'matching'}
								<Matching
									content={block.content as any}
									{viewMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
									blockId={block.id}
									{...responseProps}
								/>
							{:else if block.type === 'two_column_layout'}
								<TwoColumnLayout
									content={block.content as any}
									{viewMode}
									onUpdate={async (content: string) => {
										await updateBlock({ block, content });
									}}
									onGlobalDrop={handleDrop}
									blockId={block.id}
									{...responseProps}
								/>
							{:else if block.type === 'short_answer'}
								<ShortAnswer
									content={block.content as any}
									{viewMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
									blockId={block.id}
									{...responseProps}
								/>
							{:else}
								<p>Content for {block.type} block.</p>
							{/if}
						</div>
					</div>
				{/each}
				{#if viewMode === ViewMode.EDIT}
					<div
						use:droppable={{
							container: `task-bottom`,
							callbacks: {
								onDrop: handleDrop
							}
						}}
						class="my-4 ml-[38px] flex min-h-24 items-center justify-center rounded-lg border border-dashed transition-colors {dndState.targetContainer ===
						'task-bottom'
							? draggedOverClasses
							: notDraggedOverClasses}"
					>
						<span class="text-muted-foreground text-sm">Add more blocks here</span>
					</div>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Block Pane -->
	{#if viewMode === ViewMode.EDIT}
		<div class="flex flex-col gap-4">
			<Card.Root class="h-full">
				<Card.Header>
					<Card.Title class="text-lg">Task Blocks</Card.Title>
					<Card.Description>
						Drag and drop blocks from the palette to the task content area. If you'd like to delete a block,
						simply drag it to the area below.
					</Card.Description>
				</Card.Header>
				<Card.Content class="flex h-full flex-col gap-4">
					<div
						class="grid grid-cols-2 gap-3 rounded-lg p-2 {(dndState.sourceContainer.startsWith(
							'task'
						) ||
							dndState.sourceContainer.startsWith('two-column-')) &&
						dndState.targetContainer === 'blockPalette'
							? 'border-destructive border border-dashed'
							: notDraggedOverClasses}"
						use:droppable={{
							container: `blockPalette`,
							callbacks: {
								onDrop: handleDrop
							}
						}}
					>
						{#each blockTypes as { type, name, content, icon }}
							{@const Icon = icon}
							<div
								class="flex flex-col items-center justify-center gap-1 {buttonVariants({
									variant: 'outline'
								})} aspect-square h-18 w-full"
								use:draggable={{
									container: 'blockPalette',
									dragData: { type, content, id: 0 }
								}}
							>
								<Icon class="size-8" />
								<span class="text-center text-xs leading-tight">{name}</span>
							</div>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Publish Button -->
			{#if data.user.type !== 'student' && taskStatus === 'draft'}
				<Button
					onclick={publishTask}
					size="lg"
					class="w-full"
				>
					Publish Task
				</Button>
			{/if}
		</div>
	{/if}
</div>
