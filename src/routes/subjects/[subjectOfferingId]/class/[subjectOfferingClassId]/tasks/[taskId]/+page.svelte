<script lang="ts">
	import { page } from '$app/state';
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
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
	import EyeIcon from '@lucide/svelte/icons/eye';
	// import ShortAnswer from './blocks/short-answer.svelte';
	import { type TaskBlock } from '$lib/server/db/schema';
	import { Badge } from '$lib/components/ui/badge';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import CheckIcon from '@lucide/svelte/icons/check';

	import {
		createBlock,
		deleteBlock,
		updateBlock,
		updateTaskTitle,
		updateBlockOrder
	} from './client';

	import { blockTypes, ViewMode } from './constants';
	import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
	import { taskBlockTypeEnum, taskStatusEnum, userTypeEnum } from '$lib/enums';
	import { PresentationIcon } from '@lucide/svelte';

	let { data } = $props();
	let blocks = $state(data.blocks);
	let mouseOverElement = $state<string>('');
	let viewMode = $state<ViewMode>(
		data.user.type == userTypeEnum.student ? ViewMode.VIEW : ViewMode.EDIT
	);
	let selectedStatus = $state<taskStatusEnum>(data.classTask.status);

	const responseProps = $derived({
		taskId: data.task.id,
		classTaskId: data.classTask.id,
		subjectOfferingId: data.subjectOfferingId,
		subjectOfferingClassId: data.subjectOfferingClassId,
		isPublished: data.classTask.status === taskStatusEnum.published
	});

	const draggedOverClasses = 'border-accent-foreground';
	const notDraggedOverClasses = 'border-bg';

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
			<form method="POST" action="?/status">
				<Select.Root type="single" name="status" required bind:value={selectedStatus}>
					<Select.Trigger class="w-full"
						>{selectedStatus[0].toUpperCase() + selectedStatus.slice(1)}</Select.Trigger
					>
					<Select.Content>
						<Select.Item value={taskStatusEnum.draft}>Draft</Select.Item>
						<Select.Item value={taskStatusEnum.published}>Published</Select.Item>
					</Select.Content>
				</Select.Root>
			</form>
			<Button
				variant={viewMode === ViewMode.EDIT ? 'outline' : 'default'}
				onclick={() =>
					viewMode == ViewMode.EDIT ? (viewMode = ViewMode.VIEW) : (viewMode = ViewMode.EDIT)}
				size="lg"
			>
				<EyeIcon />
				Preview
				{#if viewMode === ViewMode.VIEW}
					<CheckIcon />
				{/if}
			</Button>
			<Button variant="outline" disabled onclick={() => (viewMode = ViewMode.PRESENT)} size="lg">
				<PresentationIcon />
				Present
			</Button>
			<Button
				variant="outline"
				href={`/subjects/${data.subjectOfferingId}/class/${data.subjectOfferingClassId}/tasks/${data.task.id}/assess`}
				size="lg"
			>
				<CheckCircleIcon class="size-5" />
				Assess
			</Button>
		{/if}
		<Card.Root class="h-full">
			<Card.Header>
				<Card.Title>Contents</Card.Title>
			</Card.Header>
			<Card.Content>
				{#each blocks.filter((block) => block.type.startsWith('h') && block.type.match(/^h[1-6]$/)) as block}
					<p>{block.content}</p>
					<br />
				{/each}
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Task Blocks -->
	<Card.Root class="h-full overflow-y-auto">
		<Card.Content class="h-full space-y-4">
			<div class={viewMode === ViewMode.EDIT ? 'ml-[38px]' : ''}>
				<Heading
					headingSize={1}
					text={data.task.title}
					{viewMode}
					onUpdate={async (newText: string) =>
						await updateTaskTitle({ taskId: data.task.id, title: newText })}
				/>

				{#if page.url.searchParams.get('submitted') === 'true'}
					<div class="mt-4">
						<Badge
							variant="default"
							class="flex w-fit items-center gap-2 border-green-300 bg-green-100 text-green-800"
						>
							<CheckCircleIcon class="h-4 w-4" />
							Task submitted successfully!
						</Badge>
					</div>
				{/if}
			</div>
			<div class="flex h-full flex-col">
				{#each blocks as block}
					<div
						class="ml-[38px] min-h-4 rounded-md {dndState.targetContainer === `task-${block.id}`
							? 'border-accent-foreground my-2 h-8 border border-dashed'
							: ''}"
						use:droppable={{
							container: `task-${block.id}`,
							callbacks: {
								onDrop: handleDrop
							}
						}}
					></div>

					<div
						class="grid {viewMode === ViewMode.EDIT
							? 'grid-cols-[30px_1fr]'
							: 'grid-cols-1'} items-center gap-2"
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
							{#if block.type === taskBlockTypeEnum.h1 || block.type === taskBlockTypeEnum.h2 || block.type === taskBlockTypeEnum.h3 || block.type === taskBlockTypeEnum.h4 || block.type === taskBlockTypeEnum.h5 || block.type === taskBlockTypeEnum.h6}
								<Heading
									headingSize={parseInt(block.type[1]) + 1}
									text={typeof block.content === 'string' ? block.content : 'This is a heading'}
									{viewMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === taskBlockTypeEnum.richText}
								<RichTextEditor
									initialContent={block.content as string | undefined}
									{viewMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === taskBlockTypeEnum.image}
								<Image
									content={block.content as Record<string, any> | undefined}
									{viewMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === taskBlockTypeEnum.video}
								<Video
									content={block.content as Record<string, any> | undefined}
									{viewMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === taskBlockTypeEnum.audio}
								<Audio
									content={block.content as Record<string, any> | undefined}
									{viewMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === taskBlockTypeEnum.whiteboard}
								<Whiteboard
									content={block.content as Record<string, any> | undefined}
									{viewMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
								/>
							{:else if block.type === taskBlockTypeEnum.multipleChoice}
								<MultipleChoice
									content={block.content as any}
									{viewMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
									blockId={block.id}
									{...responseProps}
								/>
							{:else if block.type === taskBlockTypeEnum.fillInBlank}
								<FillInBlank
									content={block.content as any}
									{viewMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
									blockId={block.id}
									{...responseProps}
								/>
							{:else if block.type === taskBlockTypeEnum.matching}
								<Matching
									content={block.content as any}
									{viewMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
									blockId={block.id}
									{...responseProps}
								/>
							{:else if block.type === taskBlockTypeEnum.shortAnswer}
								<!-- <ShortAnswer
									content={block.content as any}
									{viewMode}
									onUpdate={async (content: string) => await updateBlock({ block, content })}
									blockId={block.id}
									{...responseProps}
								/> -->
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

				<!-- Submit Button for Students -->
				{#if data.classTask.status === 'published' && data.user.type === 'student'}
					<div class="mt-8 ml-[38px]">
						<Button
							onclick={() =>
								(window.location.href = `/subjects/${data.subjectOfferingId}/class/${data.subjectOfferingClassId}/tasks/${data.task.id}/submit`)}
							size="lg"
							class="w-full"
						>
							Submit Task
						</Button>
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
						Drag and drop blocks from the palette to the task content area. If you'd like to delete
						a block, simply drag it to the area below.
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
		</div>
	{/if}
</div>
