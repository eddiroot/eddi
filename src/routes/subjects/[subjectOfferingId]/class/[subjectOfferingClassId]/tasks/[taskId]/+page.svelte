<script lang="ts">
	import { page } from '$app/state';
	import { type TaskBlock } from '$lib/server/db/schema';
	import { draggable, droppable, type DragDropState, dndState } from '@thisux/sveltednd';

	// UI Components
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import { Badge } from '$lib/components/ui/badge';

	// Block Components
	import BlockHeading from './components/block-heading.svelte';
	import BlockRichText from './components/block-rich-text-editor.svelte';
	import BlockWhiteboard from './components/block-whiteboard.svelte';
	import BlockChoice from './components/block-choice.svelte';
	import BlockFillBlank from './components/block-fill-blank.svelte';
	import BlockMatching from './components/block-matching.svelte';

	// Icons
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import CheckIcon from '@lucide/svelte/icons/check';
	import EyeIcon from '@lucide/svelte/icons/eye';

	import {
		createBlock,
		deleteBlock,
		updateBlock,
		updateTaskTitle,
		updateBlockOrder,
		upsertBlockResponse
	} from './client';

	import {
		blockTypes,
		ViewMode,
		type BlockChoiceResponse,
		type BlockFillBlankResponse,
		type BlockHeadingConfig,
		type BlockMatchingResponse,
		type BlockResponse
	} from '$lib/schemas/taskSchema';
	import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
	import { taskBlockTypeEnum, taskStatusEnum, userTypeEnum } from '$lib/enums';
	import { PresentationIcon } from '@lucide/svelte';

	let { data } = $props();
	let blocks = $state(data.blocks);
	let mouseOverElement = $state<string>('');
	let viewMode = $state<ViewMode>(
		data.user.type == userTypeEnum.student ? ViewMode.ANSWER : ViewMode.CONFIGURE
	);
	let selectedStatus = $state<taskStatusEnum>(data.classTask.status);
	let selectedStudent = $state<string | null>(null);

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
				config: draggedItem.config,
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
				config: draggedItem.config,
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
	class="grid h-full gap-4 p-4 {viewMode === ViewMode.CONFIGURE
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
				variant={viewMode === ViewMode.ANSWER ? 'default' : 'outline'}
				onclick={() =>
					viewMode == ViewMode.CONFIGURE
						? (viewMode = ViewMode.ANSWER)
						: (viewMode = ViewMode.CONFIGURE)}
				size="lg"
			>
				<EyeIcon />
				Preview
				{#if viewMode === ViewMode.ANSWER}
					<CheckIcon />
				{/if}
			</Button>
			<Button variant="outline" disabled onclick={() => (viewMode = ViewMode.PRESENT)} size="lg">
				<PresentationIcon />
				Present
			</Button>
			<Button
				variant={viewMode === ViewMode.REVIEW ? 'default' : 'outline'}
				onclick={() =>
					viewMode == ViewMode.REVIEW
						? (viewMode = ViewMode.CONFIGURE)
						: (viewMode = ViewMode.REVIEW)}
				size="lg"
			>
				<CheckCircleIcon />
				Review
				{#if viewMode === ViewMode.REVIEW}
					<CheckIcon />
				{/if}
			</Button>
		{/if}
		<Card.Root class="h-full">
			<Card.Header>
				<Card.Title>{viewMode === ViewMode.REVIEW ? 'Students' : 'Content'}</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-1">
				{#if viewMode === ViewMode.REVIEW}
					{#each data.responses as response}
						<Button
							onclick={() => (selectedStudent = response.student.id)}
							size="lg"
							variant={selectedStudent === response.student.id ? 'default' : 'ghost'}
						>
							{response.student.firstName}
							{response.student.lastName}
						</Button>
					{/each}
				{:else}
					{#each blocks.filter((block) => block.type === taskBlockTypeEnum.heading) as block}
						{#if block.type === taskBlockTypeEnum.heading}
							<p class="text-muted-foreground">{(block.config as BlockHeadingConfig).text}</p>
						{:else}
							<p class="text-muted-foreground">Untitled Heading</p>
						{/if}
					{/each}
				{/if}
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Task Blocks -->
	<Card.Root class="h-full overflow-y-auto">
		<Card.Content class="h-full space-y-4">
			<div class={viewMode === ViewMode.CONFIGURE ? 'ml-[38px]' : ''}>
				<div class="flex items-center gap-4">
					<BlockHeading
						initialConfig={{
							text: data.task.title,
							size: 1
						}}
						onConfigUpdate={async (config) =>
							await updateTaskTitle({ taskId: data.task.id, title: config.text })}
						{viewMode}
					/>
					<!-- Submit Button for Students -->
					{#if data.classTask.status === 'published' && data.user.type === userTypeEnum.student}
						<Button
							href="/subjects/${data.subjectOfferingId}/class/${data.subjectOfferingClassId}/tasks/${data
								.task.id}/submit"
							size="lg"
						>
							Submit Task
						</Button>
					{/if}
				</div>

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
						class="grid {viewMode === ViewMode.CONFIGURE
							? 'grid-cols-[30px_1fr]'
							: 'grid-cols-1'} items-center gap-2"
						role="group"
						onmouseover={() => (mouseOverElement = `task-${block.id}`)}
						onfocus={() => (mouseOverElement = `task-${block.id}`)}
					>
						{#if viewMode === ViewMode.CONFIGURE && mouseOverElement === `task-${block.id}`}
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
						{:else if viewMode === ViewMode.CONFIGURE}
							<div></div>
						{/if}
						<div>
							{#if block.type === taskBlockTypeEnum.heading}
								<BlockHeading
									initialConfig={block.config as { text: string; size: number }}
									onConfigUpdate={async (config) => await updateBlock({ block, config })}
									{viewMode}
								/>
							{:else if block.type === taskBlockTypeEnum.richText}
								<BlockRichText
									initialConfig={block.config as { html: string }}
									onConfigUpdate={async (config) => await updateBlock({ block, config })}
									{viewMode}
								/>
							{:else if block.type === taskBlockTypeEnum.whiteboard}
								<BlockWhiteboard
									initialConfig={block.config as { title: string; whiteboardId: number | null }}
									onConfigUpdate={async (config) => await updateBlock({ block, config })}
									{viewMode}
								/>
							{:else if block.type === taskBlockTypeEnum.choice}
								<BlockChoice
									initialConfig={block.config as {
										question: string;
										options: { text: string; isAnswer: boolean }[];
									}}
									onConfigUpdate={async (config) => await updateBlock({ block, config })}
									initialResponse={viewMode === ViewMode.REVIEW && selectedStudent
										? (data.groupedBlockResponses[selectedStudent][block.id]
												?.response as BlockChoiceResponse)
										: undefined}
									onResponseUpdate={async (response) =>
										await upsertBlockResponse(block.id, data.classTask.id, response)}
									{viewMode}
								/>
							{:else if block.type === taskBlockTypeEnum.fillBlank}
								<BlockFillBlank
									initialConfig={block.config as { sentence: string; answer: string }}
									onConfigUpdate={async (config) => await updateBlock({ block, config })}
									initialResponse={viewMode === ViewMode.REVIEW && selectedStudent
										? (data.groupedBlockResponses[selectedStudent][block.id]
												?.response as BlockFillBlankResponse)
										: undefined}
									onResponseUpdate={async (response) =>
										await upsertBlockResponse(block.id, data.classTask.id, response)}
									{viewMode}
								/>
							{:else if block.type === taskBlockTypeEnum.matching}
								<BlockMatching
									initialConfig={block.config as {
										instructions: string;
										pairs: { left: string; right: string }[];
									}}
									onConfigUpdate={async (config) => await updateBlock({ block, config })}
									initialResponse={viewMode === ViewMode.REVIEW && selectedStudent
										? (data.groupedBlockResponses[selectedStudent][block.id]
												?.response as BlockMatchingResponse)
										: undefined}
									onResponseUpdate={async (response) =>
										await upsertBlockResponse(block.id, data.classTask.id, response)}
									{viewMode}
								/>
							{:else}
								<p>Block of type "{block.type}" is not yet implemented.</p>
							{/if}
						</div>
					</div>
				{/each}
				{#if viewMode === ViewMode.CONFIGURE}
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
	{#if viewMode === ViewMode.CONFIGURE}
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
						{#each blockTypes as { type, name, initialConfig, icon }}
							{@const Icon = icon}
							<div
								class="flex flex-col items-center justify-center gap-1 {buttonVariants({
									variant: 'outline'
								})} aspect-square h-18 w-full"
								use:draggable={{
									container: 'blockPalette',
									dragData: { type, config: initialConfig, id: 0 }
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
