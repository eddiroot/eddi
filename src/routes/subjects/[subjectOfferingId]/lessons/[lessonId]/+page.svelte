<script lang="ts">
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';
	import Heading from './blocks/heading.svelte';
	import Markdown from './blocks/markdown.svelte';
	import Image from './blocks/image.svelte';
	import Video from './blocks/video.svelte';
	import Audio from './blocks/audio.svelte';
	import Whiteboard from './blocks/whiteboard.svelte';
	import MultipleChoice from './blocks/multiple-choice.svelte';
	import FillInBlank from './blocks/fill-in-blank.svelte';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EditIcon from '@lucide/svelte/icons/edit';
	import { type LessonBlock } from '$lib/server/db/schema';

	import {
		createBlock,
		deleteBlock,
		updateBlock,
		updateLessonTitle,
		updateBlockOrder
	} from './client';
	import { blockTypes } from './constants';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';

	let { data } = $props();
	let blocks = $state(data.blocks);
	let elementDragStarted = $state<string>('');
	let draggedOverElement = $state<string>('');
	let mouseOverElement = $state<string>('');
	let isEditMode = $state(true);

	const draggedOverClasses = 'border-accent-foreground';
	const notDraggedOverClasses = 'border-bg';

	async function handleDrop(state: DragDropState<LessonBlock>) {
		const { draggedItem, sourceContainer, targetContainer } = state;
		if (!targetContainer) return;

		draggedOverElement = '';

		if (sourceContainer === 'blockPalette' && targetContainer.startsWith('lesson')) {
			const index = blocks.findIndex((b) => b.id.toString() === targetContainer.split('-')[1]);

			const { block } = await createBlock({
				lessonId: data.lesson.id,
				type: draggedItem.type,
				content: draggedItem.content,
				index: targetContainer === 'lesson-bottom' ? blocks.length : index
			});

			if (!block) {
				alert('Failed to create block. Please try again.');
				return;
			}

			if (targetContainer === 'lesson-bottom') {
				blocks = [...blocks, block];
			} else if (index !== -1) {
				blocks = [...blocks.slice(0, index), block, ...blocks.slice(index)];
			} else {
				alert('Failed to insert block at the correct position. Please try again.');
				return;
			}
		}

		if (sourceContainer.startsWith('lesson') && targetContainer.startsWith('lesson')) {
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

		if (sourceContainer.startsWith('lesson') && targetContainer === 'blockPalette') {
			const { success } = await deleteBlock(draggedItem.id);
			if (!success) {
				alert('Failed to delete block. Please try again.');
				return;
			}
			blocks = blocks.filter((block) => block.id !== draggedItem.id);
		}
	}

	function handleDragOver(state: DragDropState<LessonBlock>) {
		const { sourceContainer, targetContainer } = state;
		if (sourceContainer) {
			elementDragStarted = sourceContainer;
		}
		if (targetContainer) {
			draggedOverElement = targetContainer;
		}
	}
</script>

<div class="grid h-full grid-cols-[300px_1fr_300px] gap-4 p-4">
	<Card.Root class="h-full">
		<Card.Header>
			<Card.Title class="text-lg">Contents</Card.Title>
			<Card.Description>Choose a heading to navigate to.</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4"></Card.Content>
	</Card.Root>

	<Card.Root class="h-full gap-0">
		<div class="flex items-center justify-between p-6 pb-4">
			<div class="flex-1">
				<Heading
					headingSize={1}
					text={data.lesson.title}
					{isEditMode}
					onUpdate={async (newText: string) =>
						await updateLessonTitle({ lessonId: data.lesson.id, title: newText })}
				/>
			</div>
			<Button
				variant="outline"
				size="sm"
				onclick={() => (isEditMode = !isEditMode)}
				class="flex items-center gap-2"
			>
				{#if isEditMode}
					<EyeIcon class="h-4 w-4" />
					Switch to Preview Mode
				{:else}
					<EditIcon class="h-4 w-4" />
					Switch to Edit Mode
				{/if}
			</Button>
		</div>
		<Card.Content class="h-full">
			<div class="flex h-full flex-col">
				{#each blocks as block}
					<div
						class="h-4"
						use:droppable={{
							container: `lesson-${block.id}`,
							callbacks: {
								onDrop: handleDrop,
								onDragOver: handleDragOver
							}
						}}
					>
						{#if draggedOverElement === `lesson-${block.id}`}
							<Separator class="bg-accent-foreground my-2" />
						{/if}
					</div>
					<div
						class="grid {isEditMode ? 'grid-cols-[30px_1fr]' : 'grid-cols-1'} items-center gap-2"
						role="group"
						onmouseover={() => (mouseOverElement = `lesson-${block.id}`)}
						onfocus={() => (mouseOverElement = `lesson-${block.id}`)}
					>
						{#if isEditMode && mouseOverElement === `lesson-${block.id}`}
							<div
								use:draggable={{
									container: 'lesson',
									dragData: block
								}}
								class="group relative flex h-6 w-6 cursor-grab items-center justify-center rounded transition-colors hover:bg-gray-100 active:cursor-grabbing dark:hover:bg-gray-800"
							>
								<GripVerticalIcon
									class="text-muted-foreground group-hover:text-foreground h-3 w-3 rounded transition-colors"
								/>
							</div>
						{:else if isEditMode}
							<div></div>
						{/if}
						<div>
							{#if block.type === 'h1' || block.type === 'h2' || block.type === 'h3' || block.type === 'h4' || block.type === 'h5' || block.type === 'h6'}
								<Heading
									headingSize={parseInt(block.type[1]) + 1}
									text={typeof block.content === 'string' ? block.content : 'This is a heading'}
									{isEditMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === 'markdown'}
								<Markdown
									content={typeof block.content === 'string' ? block.content : ''}
									{isEditMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === 'image'}
								<Image
									content={block.content as Record<string, any> | undefined}
									{isEditMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === 'video'}
								<Video
									content={block.content as Record<string, any> | undefined}
									{isEditMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === 'audio'}
								<Audio
									content={block.content as Record<string, any> | undefined}
									{isEditMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === 'whiteboard'}
								<Whiteboard
									content={block.content as Record<string, any> | undefined}
									{isEditMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === 'multiple_choice'}
								<MultipleChoice
									content={block.content as any}
									{isEditMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === 'fill_in_blank'}
								<FillInBlank
									content={block.content as any}
									{isEditMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else}
								<p>Content for {block.type} block.</p>
							{/if}
						</div>
					</div>
				{/each}
				<div
					use:droppable={{
						container: `lesson-bottom`,
						callbacks: {
							onDrop: handleDrop,
							onDragOver: handleDragOver
						}
					}}
					class="my-4 flex min-h-24 items-center justify-center rounded-lg border border-dashed transition-colors {draggedOverElement ===
					'lesson-bottom'
						? draggedOverClasses
						: notDraggedOverClasses}"
				>
					<span class="text-muted-foreground text-sm">Add more blocks here</span>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-lg">Blocks</Card.Title>
			<Card.Description>
				Drag and drop blocks from here to the lesson content area. If you'd like to delete a block,
				simply drag it to the area below.
			</Card.Description>
		</Card.Header>
		<Card.Content class="flex h-full flex-col gap-4">
			<div
				class="grid grid-cols-2 gap-2 rounded-lg p-2 {elementDragStarted.startsWith('lesson') &&
				draggedOverElement === 'blockPalette'
					? 'border-destructive border border-dashed'
					: notDraggedOverClasses}"
				use:droppable={{
					container: `blockPalette`,
					callbacks: {
						onDrop: handleDrop,
						onDragOver: handleDragOver
					}
				}}
			>
				{#each blockTypes as { type, content, icon }}
					{@const Icon = icon}
					<div
						class="aspect-square h-full w-full {buttonVariants({ variant: 'outline' })}"
						use:draggable={{
							container: 'blockPalette',
							dragData: { type, content, id: 0 }
						}}
					>
						<Icon class="size-8" />
					</div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>
</div>
