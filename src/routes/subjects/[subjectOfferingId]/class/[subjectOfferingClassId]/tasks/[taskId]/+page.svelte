<script lang="ts">
	import { page } from '$app/state';
	import { type TaskBlock } from '$lib/server/db/schema';
	import { dndState, draggable, droppable, type DragDropState } from '@thisux/sveltednd';
// UI Components
	import { Badge } from '$lib/components/ui/badge';
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
// Block Components
	import BlockBalancingEquations from './components/block-balancing-equations.svelte';
	import BlockChoice from './components/block-choice.svelte';
	import BlockClose from './components/block-close.svelte';
	import BlockFillBlank from './components/block-fill-blank.svelte';
	import BlockGraph from './components/block-graph.svelte';
	import BlockHeading from './components/block-heading.svelte';
	import BlockHighlightText from './components/block-highlight-text.svelte';
	import BlockImage from './components/block-image.svelte';
	import BlockMatching from './components/block-matching.svelte';
	import BlockRichText from './components/block-rich-text-editor.svelte';
	import BlockShortAnswer from './components/block-short-answer.svelte';
	import BlockTable from './components/block-table.svelte';
	import BlockVideo from './components/block-video.svelte';
	import BlockWhiteboard from './components/block-whiteboard.svelte';
// Icons
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import WrenchIcon from '@lucide/svelte/icons/wrench';

	import {
		createBlock,
		deleteBlock,
		updateBlock,
		updateBlockOrder,
		updateTaskTitle,
		upsertBlockResponse
	} from './client';

	import { taskBlockTypeEnum, taskStatusEnum, userTypeEnum } from '$lib/enums';
	import {
		blockTypes,
		ViewMode,
		type BlockBalancingEquationsConfig,
		type BlockChoiceConfig,
		type BlockCloseConfig,
		type BlockFillBlankConfig,
		type BlockGraphConfig,
		type BlockHeadingConfig,
		type BlockHighlightTextConfig,
		type BlockImageConfig,
		type BlockMatchingConfig,
		type BlockRichTextConfig,
		type BlockShortAnswerConfig,
		type BlockTableConfig,
		type BlockVideoConfig,
		type BlockWhiteboardConfig
	} from '$lib/schemas/taskSchema';
	import { PresentationIcon } from '@lucide/svelte';
	import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';

	let { data } = $props();

	let blocks = $state(data.blocks);
	let responses = $state<Record<number, any>>({});

	let mouseOverElement = $state<string>('');
	let viewMode = $state<ViewMode>(
		data.user.type == userTypeEnum.student ? ViewMode.ANSWER : ViewMode.CONFIGURE
	);
	let selectedStatus = $state<taskStatusEnum>(data.classTask.status);
	let selectedStudent = $state<string | null>(null);

	$effect(() => {
		blocks.forEach((block) => {
			if (!Object.prototype.hasOwnProperty.call(responses, block.id)) {
				responses[block.id] = getInitialResponse(block.type);
			}
		});
	});

	function getInitialResponse(blockType: string) {
		switch (blockType) {
			case taskBlockTypeEnum.choice:
				return { answers: [] };
			case taskBlockTypeEnum.fillBlank:
				return { answers: [] };
			case taskBlockTypeEnum.matching:
				return { matches: [] };
			case taskBlockTypeEnum.shortAnswer:
				return { answer: '' };
			case taskBlockTypeEnum.close:
				return { answer: '' };
			case taskBlockTypeEnum.highlightText:
				return { selectedText: [] };
			case taskBlockTypeEnum.graph:
				return { studentPlots: [] };
			case taskBlockTypeEnum.balancingEquations:
				return { coefficients: { reactants: [], products: [] } };
			case taskBlockTypeEnum.mathInput:
				return { answer: '' };
			default:
				return {};
		}
	}

	function getCurrentResponse(blockId: number, blockType: string) {
		if (data.user.type == userTypeEnum.student) {
			return data.blockResponses![blockId] || getInitialResponse(blockType);
		}

		if (viewMode === ViewMode.REVIEW && selectedStudent) {
			return (
				data.groupedBlockResponses![selectedStudent]?.[blockId]?.response ||
				getInitialResponse(blockType)
			);
		}

		return responses[blockId] || getInitialResponse(blockType);
	}

	async function handleConfigUpdate(block: TaskBlock, config: any) {
		await updateBlock({ block, config });
		const blockIndex = blocks.findIndex((b) => b.id === block.id);
		if (blockIndex !== -1) {
			blocks[blockIndex] = { ...blocks[blockIndex], config };
		}
	}

	async function handleResponseUpdate(blockId: number, response: any) {
		responses[blockId] = response;

		if (data.user.type !== userTypeEnum.student) return;

		try {
			await upsertBlockResponse(blockId, data.classTask.id, response);
		} catch (error) {
			console.error('Failed to save response:', error);
		}
	}

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
				variant={viewMode === ViewMode.CONFIGURE ? 'default' : 'outline'}
				onclick={() => (viewMode = ViewMode.CONFIGURE)}
				size="lg"
			>
				<WrenchIcon />
				Configure
			</Button>
			<Button variant="outline" disabled onclick={() => (viewMode = ViewMode.PRESENT)} size="lg">
				<PresentationIcon />
				Present
			</Button>
			<Button
				variant={viewMode === ViewMode.ANSWER ? 'default' : 'outline'}
				onclick={() => (viewMode = ViewMode.ANSWER)}
				size="lg"
			>
				<EyeIcon />
				Preview
			</Button>
			<Button
				variant={viewMode === ViewMode.REVIEW ? 'default' : 'outline'}
				onclick={() => (viewMode = ViewMode.REVIEW)}
				size="lg"
			>
				<CheckCircleIcon />
				Review
			</Button>
		{/if}
		<Card.Root class="h-full">
			<Card.Header>
				<Card.Title>{viewMode === ViewMode.REVIEW ? 'Students' : 'Content'}</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-1">
				{#if viewMode === ViewMode.REVIEW}
					{#each data.responses! as response}
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
							<p
								class="text-muted-foreground"
								style="font-size: {1.5 -
									(block.config as BlockHeadingConfig).size * 0.1}rem; font-weight: {700 -
									(block.config as BlockHeadingConfig).size * 100}; margin-left: {((
									block.config as BlockHeadingConfig
								).size -
									1) *
									4}px"
							>
								{(block.config as BlockHeadingConfig).text}
							</p>
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
						config={{
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
							<CheckCircleIcon />
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
									config={block.config as BlockHeadingConfig}
									onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
									{viewMode}
								/>
							{:else if block.type === taskBlockTypeEnum.richText}
								<BlockRichText
									config={block.config as BlockRichTextConfig}
									onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
									{viewMode}
								/>
							{:else if block.type === taskBlockTypeEnum.whiteboard}
								<BlockWhiteboard
									config={block.config as BlockWhiteboardConfig}
									onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
									{viewMode}
								/>
							{:else if block.type === taskBlockTypeEnum.choice}
								<BlockChoice
									config={block.config as BlockChoiceConfig}
									onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
									response={getCurrentResponse(block.id, block.type)}
									onResponseUpdate={async (response) =>
										await handleResponseUpdate(block.id, response)}
									{viewMode}
								/>
							{:else if block.type === taskBlockTypeEnum.fillBlank}
								<BlockFillBlank
									config={block.config as BlockFillBlankConfig}
									onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
									response={getCurrentResponse(block.id, block.type)}
									onResponseUpdate={async (response) =>
										await handleResponseUpdate(block.id, response)}
									{viewMode}
								/>
							{:else if block.type === taskBlockTypeEnum.matching}
								<BlockMatching
									config={block.config as BlockMatchingConfig}
									onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
									response={getCurrentResponse(block.id, block.type)}
									onResponseUpdate={async (response) =>
										await handleResponseUpdate(block.id, response)}
									{viewMode}
								/>
							{:else if block.type === taskBlockTypeEnum.shortAnswer}
								<BlockShortAnswer
									config={block.config as BlockShortAnswerConfig}
									onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
									response={getCurrentResponse(block.id, block.type)}
									onResponseUpdate={async (response) =>
										await handleResponseUpdate(block.id, response)}
									{viewMode}
								/>
							{:else if block.type === taskBlockTypeEnum.close}
								<BlockClose
									config={block.config as BlockCloseConfig}
									onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
									response={getCurrentResponse(block.id, block.type)}
									onResponseUpdate={async (response) =>
										await handleResponseUpdate(block.id, response)}
									{viewMode}
								/>
							{:else if block.type === taskBlockTypeEnum.highlightText}
								<BlockHighlightText
									config={block.config as BlockHighlightTextConfig}
									onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
									response={getCurrentResponse(block.id, block.type)}
									onResponseUpdate={async (response) =>
										await handleResponseUpdate(block.id, response)}
									{viewMode}
								/>
							{:else if block.type === taskBlockTypeEnum.table}
								<BlockTable
									config={block.config as BlockTableConfig}
									onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
									{viewMode}
								/>
							{:else if block.type === taskBlockTypeEnum.graph}
								<BlockGraph
									config={block.config as BlockGraphConfig}
									onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
									response={getCurrentResponse(block.id, block.type)}
									onResponseUpdate={async (response) =>
										await handleResponseUpdate(block.id, response)}
									{viewMode}
								/>
							{:else if block.type === taskBlockTypeEnum.balancingEquations}
								<BlockBalancingEquations
									config={block.config as BlockBalancingEquationsConfig}
									onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
									response={getCurrentResponse(block.id, block.type)}
									onResponseUpdate={async (response) =>
										await handleResponseUpdate(block.id, response)}
									{viewMode}
								/>
							{:else if block.type === taskBlockTypeEnum.mathInput}
								<p>Math Input block component is not yet implemented.</p>
							{:else if block.type === taskBlockTypeEnum.image}
								<BlockImage
									config={block.config as BlockImageConfig}
									onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
									{viewMode}
								/>
							{:else if block.type === taskBlockTypeEnum.video}
								<BlockVideo
									config={block.config as BlockVideoConfig}
									onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
									{viewMode}
								/>
							{:else}
								<p>Block of type {block.type} is not yet implemented.</p>
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
