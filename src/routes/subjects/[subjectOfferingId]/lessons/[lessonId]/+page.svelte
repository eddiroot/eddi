<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
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

	import { type LessonBlock } from '$lib/server/db/schema';
	import { lessonBlockTypeEnum } from '$lib/server/db/schema';

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
			} else {
				if (index === 0) {
					blocks = [block, ...blocks];
				} else if (index !== -1) {
					blocks = [...blocks.slice(0, index + 1), block, ...blocks.slice(index + 1)];
				} else {
					alert('Failed to insert block at the correct position. Please try again.');
					return;
				}
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
		<Card.Header>
			<Heading
				headingSize={1}
				text={data.lesson.title}
				onUpdate={async (newText: string) =>
					await updateLessonTitle({ lessonId: data.lesson.id, title: newText })}
			/>
		</Card.Header>
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
						class="grid grid-cols-[30px_1fr] items-center gap-2"
						role="group"
						onmouseover={() => (mouseOverElement = `lesson-${block.id}`)}
						onfocus={() => (mouseOverElement = `lesson-${block.id}`)}
					>
						{#if mouseOverElement === `lesson-${block.id}`}
							<div
								use:draggable={{
									container: 'lesson',
									dragData: block
								}}
							>
								<GripVerticalIcon class="text-muted-foreground" />
							</div>
						{:else}
							<div></div>
						{/if}
						<div>
							{#if block.type === lessonBlockTypeEnum.h1 || block.type === lessonBlockTypeEnum.h2 || block.type === lessonBlockTypeEnum.h3 || block.type === lessonBlockTypeEnum.h4 || block.type === lessonBlockTypeEnum.h5 || block.type === lessonBlockTypeEnum.h6}
								<Heading
									headingSize={parseInt(block.type[1]) + 1}
									text={typeof block.content === 'string' ? block.content : 'This is a heading'}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === lessonBlockTypeEnum.markdown}
								<Markdown
									content={typeof block.content === 'string' ? block.content : ''}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === lessonBlockTypeEnum.image}
								<Image
									content={block.content as Record<string, any> | undefined}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === lessonBlockTypeEnum.video}
								<Video
									content={block.content as Record<string, any> | undefined}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === lessonBlockTypeEnum.audio}
								<Audio
									content={block.content as Record<string, any> | undefined}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === lessonBlockTypeEnum.whiteboard}
								<Whiteboard
									content={block.content as Record<string, any> | undefined}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === lessonBlockTypeEnum.multipleChoice}
								<MultipleChoice
									content={block.content as any}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === lessonBlockTypeEnum.fillInBlank}
								<FillInBlank
									content={block.content as any}
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
				Drag and drop blocks from here to the lesson content area, or drag blocks to the delete bin
				below to remove them.
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
