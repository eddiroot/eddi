<script lang="ts">
	import { page } from '$app/state';
	import { type TaskBlock } from '$lib/server/db/schema';
	import { dndState, draggable, droppable, type DragDropState } from '@thisux/sveltednd';
	// UI Components
	import { Badge } from '$lib/components/ui/badge';
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	// Block Components
	import BlockAudio from './components/block-audio.svelte';
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
	import ClockIcon from '@lucide/svelte/icons/clock';
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

	import {
		gradeReleaseEnum,
		quizModeEnum,
		taskBlockTypeEnum,
		taskStatusEnum,
		userTypeEnum
	} from '$lib/enums';
	import {
		blockTypes,
		ViewMode,
		type BlockAudioConfig,
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
	import { formatTimer } from '$lib/utils';
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
	let statusForm = $state<HTMLFormElement>();

	// Quiz settings state
	let showQuizSettings = $state(false);
	let quizMode = $state<quizModeEnum>(data.classTask.quizMode || quizModeEnum.none);

	// Helper function to convert UTC date to local datetime-local format
	function toLocalDatetimeString(date: Date | string | null): string {
		if (!date) return '';
		const d = new Date(date);
		// Adjust for timezone offset to get local time
		const offset = d.getTimezoneOffset() * 60000; // offset in milliseconds
		const localTime = new Date(d.getTime() - offset);
		return localTime.toISOString().slice(0, 16);
	}

	let quizStartTime = $state(
		data.classTask.quizStartTime ? toLocalDatetimeString(data.classTask.quizStartTime) : ''
	);
	let quizDurationMinutes = $state<number>(data.classTask.quizDurationMinutes || 60);
	let gradeRelease = $state<gradeReleaseEnum>(
		data.classTask.gradeRelease || gradeReleaseEnum.instant
	);
	let gradeReleaseTime = $state(
		data.classTask.gradeReleaseTime ? toLocalDatetimeString(data.classTask.gradeReleaseTime) : ''
	);

	// Timer state for quiz mode
	let timeRemaining = $state<number>(0);
	let timerInterval: ReturnType<typeof setInterval> | null = null;
	let isQuizActive = $state(false);
	let quizStarted = $state(false);

	// Check if content should be blocked for students
	const isContentBlocked = $derived(() => {
		// Only block for students
		if (data.user.type !== userTypeEnum.student) return false;

		// Block students from accessing draft tasks
		if (data.classTask.status === taskStatusEnum.draft) return true;

		// Only block for quiz modes
		if (quizMode === quizModeEnum.none) return false;

		// For manual quiz mode, block until teacher manually starts globally
		if (quizMode === quizModeEnum.manual && !data.quizGloballyStarted) return true;

		// For scheduled quiz mode, block until scheduled start time (unless student has active session)
		if (quizMode === quizModeEnum.scheduled && data.classTask.quizStartTime) {
			const scheduleStartTime = new Date(data.classTask.quizStartTime).getTime();
			const now = Date.now();
			// Don't block if student has an active quiz session
			if (data.quizSession && data.quizSession.quizStartedAt && !data.quizSession.isQuizSubmitted) {
				return false;
			}
			return now < scheduleStartTime;
		}

		return false;
	});

	// Check if quiz is active for current user (student)
	$effect(() => {
		const isStudentInQuizMode =
			data.user.type === userTypeEnum.student &&
			(quizMode === quizModeEnum.scheduled || quizMode === quizModeEnum.manual);

		if (isStudentInQuizMode && data.classTask.quizDurationMinutes) {
			// Check if student has an active quiz session
			const session = data.quizSession;

			if (session && session.quizStartedAt && !session.isQuizSubmitted) {
				// Calculate time remaining based on actual start time
				const startTime = new Date(session.quizStartedAt).getTime();
				const durationMs = data.classTask.quizDurationMinutes * 60 * 1000;
				const elapsed = Date.now() - startTime;
				const remaining = Math.max(0, (durationMs - elapsed) / 1000);

				timeRemaining = remaining;
				isQuizActive = true;
				quizStarted = true;

				if (remaining > 0) {
					startTimer();
				} else {
					// Time already up, auto-submit
					autoSubmitQuiz();
				}
			} else if (quizMode === quizModeEnum.scheduled && data.classTask.quizStartTime) {
				// Check if scheduled start time has passed
				const scheduleStartTime = new Date(data.classTask.quizStartTime).getTime();
				const now = Date.now();

				if (now >= scheduleStartTime) {
					// Auto-start scheduled quiz for students
					startQuizSession();
				}
			}
		}

		return () => {
			if (timerInterval) {
				clearInterval(timerInterval);
			}
		};
	});

	async function startQuizSession() {
		if (quizStarted || isQuizActive) return;

		try {
			const response = await fetch(window.location.pathname + '?/startQuiz', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({})
			});

			if (response.ok) {
				// Reload page to get updated session data
				window.location.reload();
			}
		} catch (error) {
			console.error('Failed to start quiz session:', error);
		}
	}

	function startTimer() {
		if (timerInterval) clearInterval(timerInterval);

		timerInterval = setInterval(() => {
			timeRemaining -= 1;

			if (timeRemaining <= 0) {
				// Time's up - auto submit
				autoSubmitQuiz();
			}
		}, 1000);
	}

	async function autoSubmitQuiz() {
		if (timerInterval) {
			clearInterval(timerInterval);
		}
		isQuizActive = false;

		try {
			await fetch(window.location.pathname + '?/autoSubmitQuiz', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({})
			});

			alert('Time is up! Your quiz has been automatically submitted.');
			// Optionally reload to show submitted state
			window.location.reload();
		} catch (error) {
			console.error('Failed to auto-submit quiz:', error);
			alert('Time is up! Please submit your quiz manually.');
		}
	}

	$effect(() => {
		blocks.forEach((block) => {
			if (!Object.prototype.hasOwnProperty.call(responses, block.id)) {
				responses[block.id] = getInitialResponse(block.type);
			}
		});
	});

	function getInitialResponse(blockType: string) {
		switch (blockType) {
			case taskBlockTypeEnum.audio:
				return {};
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
			<form method="POST" action="?/status" bind:this={statusForm}>
				<Select.Root
					type="single"
					name="status"
					required
					bind:value={selectedStatus}
					onValueChange={(value) => {
						if (value && statusForm) {
							setTimeout(() => statusForm?.submit(), 0);
						}
					}}
				>
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
			{#if data.task.type === 'assessment' || data.task.type === 'homework'}
				<Button variant="outline" onclick={() => (showQuizSettings = true)} size="lg">
					<ClockIcon />
					Quiz Settings
				</Button>
			{/if}
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

					<!-- Quiz Timer for Students -->
					{#if isQuizActive && data.user.type === userTypeEnum.student}
						<div
							class="border-warning bg-warning/10 flex items-center gap-2 rounded-lg border px-3 py-2"
						>
							<ClockIcon class="text-warning h-5 w-5" />
							<span class="text-warning font-mono text-lg font-bold">
								{formatTimer(timeRemaining)}
							</span>
							<span class="text-warning text-sm">remaining</span>
						</div>
					{/if}

					<!-- Manual Quiz Start Button for Teachers -->
					{#if data.user.type === userTypeEnum.teacher && quizMode === quizModeEnum.manual && !data.quizGloballyStarted && data.classTask.status === 'published'}
						<Button
							onclick={startQuizSession}
							size="lg"
							class="bg-success text-success-foreground hover:bg-success/90"
						>
							<ClockIcon class="mr-2 h-4 w-4" />
							Start Quiz
						</Button>
					{/if}

					<!-- Submit Button for Students -->
					{#if data.classTask.status === 'published' && data.user.type === userTypeEnum.student && (quizMode === quizModeEnum.none || isQuizActive)}
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
							class="border-success bg-success/10 text-success flex w-fit items-center gap-2"
						>
							<CheckCircleIcon />
							Task submitted successfully!
						</Badge>
					</div>
				{/if}
			</div>
			<div class="flex h-full flex-col">
				{#if isContentBlocked()}
					<!-- Blocked Content Message -->
					<div class="flex h-full items-center justify-center">
						<Card.Root class="w-full max-w-md">
							<Card.Content class="p-8 text-center">
								{#if data.classTask.status === taskStatusEnum.draft}
									<!-- Draft Task Message -->
									<WrenchIcon class="text-muted-foreground mx-auto mb-4 h-12 w-12" />
									<h3 class="mb-4 text-xl font-semibold">Task Not Available</h3>
									<p class="text-muted-foreground mb-4">
										This task is currently in draft mode and has not been published yet.
									</p>
									<p class="text-muted-foreground text-sm">
										Your teacher will make this task available when it's ready.
									</p>
								{:else}
									<!-- Quiz Not Started Message -->
									<ClockIcon class="text-primary mx-auto mb-4 h-12 w-12" />
									<h3 class="mb-4 text-xl font-semibold">Quiz Not Available Yet</h3>
									{#if quizMode === quizModeEnum.scheduled && data.classTask.quizStartTime}
										{@const startTime = new Date(data.classTask.quizStartTime)}
										{@const now = new Date()}
										{@const timeDiff = startTime.getTime() - now.getTime()}
										<p class="text-muted-foreground mb-4">This quiz will become available at:</p>
										<div class="bg-primary/10 mb-4 rounded-lg p-3">
											<p class="text-primary font-mono text-lg font-bold">
												{startTime.toLocaleString()}
											</p>
										</div>
										{#if timeDiff > 0 && timeDiff < 24 * 60 * 60 * 1000}
											<!-- Show countdown if within 24 hours -->
											{@const hours = Math.floor(timeDiff / (1000 * 60 * 60))}
											{@const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))}
											<div class="bg-warning/10 mb-4 rounded-lg p-3">
												<p class="text-warning text-sm font-medium">
													Available in: {hours}h {minutes}m
												</p>
											</div>
										{/if}
										<p class="text-muted-foreground text-sm">
											The quiz will start automatically at the scheduled time.
										</p>
									{:else if quizMode === quizModeEnum.manual}
										<p class="text-muted-foreground mb-4">
											This quiz requires manual start by your teacher.
										</p>
										<p class="text-muted-foreground text-sm">
											Your teacher will provide instructions when the quiz is ready to begin.
										</p>
									{/if}
								{/if}
							</Card.Content>
						</Card.Root>
					</div>
				{:else}
					<!-- Normal Content Rendering -->
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
								{:else if block.type === taskBlockTypeEnum.audio}
									<BlockAudio
										config={block.config as BlockAudioConfig}
										onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
										{viewMode}
									/>
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

<!-- Quiz Settings Dialog -->
<Dialog.Root bind:open={showQuizSettings}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title>Quiz Settings</Dialog.Title>
			<Dialog.Description>
				Configure timing and grading settings for this quiz/test.
			</Dialog.Description>
		</Dialog.Header>

		<form method="POST" action="?/updateQuizSettings" class="space-y-4">
			<!-- Quiz Mode -->
			<div class="space-y-2">
				<Label for="quizMode">Quiz Mode</Label>
				<Select.Root type="single" name="quizMode" bind:value={quizMode}>
					<Select.Trigger>
						{#if quizMode === quizModeEnum.none}
							Regular Task
						{:else if quizMode === quizModeEnum.scheduled}
							Scheduled Start
						{:else if quizMode === quizModeEnum.manual}
							Manual Start
						{:else}
							Select quiz mode
						{/if}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value={quizModeEnum.none}>Regular Task</Select.Item>
						<Select.Item value={quizModeEnum.scheduled}>Scheduled Start</Select.Item>
						<Select.Item value={quizModeEnum.manual}>Manual Start</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>

			{#if quizMode === quizModeEnum.scheduled}
				<!-- Scheduled Start Time -->
				<div class="space-y-2">
					<Label for="quizStartTime">Start Time</Label>
					<Input type="datetime-local" name="quizStartTime" bind:value={quizStartTime} required />
				</div>
			{/if}

			{#if quizMode !== quizModeEnum.none}
				<!-- Quiz Duration -->
				<div class="space-y-2">
					<Label for="quizDurationMinutes">Duration (minutes)</Label>
					<Input
						type="number"
						name="quizDurationMinutes"
						bind:value={quizDurationMinutes}
						min="1"
						max="480"
						required
					/>
				</div>

				<!-- Grade Release -->
				<div class="space-y-2">
					<Label for="gradeRelease">Grade Release</Label>
					<Select.Root type="single" name="gradeRelease" bind:value={gradeRelease}>
						<Select.Trigger>
							{#if gradeRelease === gradeReleaseEnum.instant}
								Instant
							{:else if gradeRelease === gradeReleaseEnum.manual}
								Manual
							{:else if gradeRelease === gradeReleaseEnum.scheduled}
								Scheduled
							{:else}
								Select grade release
							{/if}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value={gradeReleaseEnum.instant}>Instant</Select.Item>
							<Select.Item value={gradeReleaseEnum.manual}>Manual</Select.Item>
							<Select.Item value={gradeReleaseEnum.scheduled}>Scheduled</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>

				{#if gradeRelease === gradeReleaseEnum.scheduled}
					<!-- Grade Release Time -->
					<div class="space-y-2">
						<Label for="gradeReleaseTime">Grade Release Time</Label>
						<Input
							type="datetime-local"
							name="gradeReleaseTime"
							bind:value={gradeReleaseTime}
							required
						/>
					</div>
				{/if}
			{/if}

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (showQuizSettings = false)}>
					Cancel
				</Button>
				<Button type="submit">Save Settings</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
