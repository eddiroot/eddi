<script lang="ts">
	import { taskBlockTypeEnum } from '$lib/enums.js';
	import type { TaskBlock, TaskBlockResponse } from '$lib/server/db/schema';
	import { ViewMode } from '$lib/utils';
	
	// Import the same block components used in the main task page
	import Heading from '../../blocks/heading.svelte';
	import RichTextEditor from '../../blocks/rich-text-editor.svelte';
	import Image from '../../blocks/image.svelte';
	import Video from '../../blocks/video.svelte';
	import Audio from '../../blocks/audio.svelte';
	import Whiteboard from '../../blocks/whiteboard.svelte';
	import MultipleChoice from '../../blocks/multiple-choice.svelte';
	import FillInBlank from '../../blocks/fill-in-blank.svelte';
	import Matching from '../../blocks/matching.svelte';
	import TwoColumnLayout from '../../blocks/two-column-layout.svelte';
	import ShortAnswer from '../../blocks/short-answer.svelte';

	interface TaskBlockWithResponse {
		taskBlock: TaskBlock;
		response: TaskBlockResponse;
	}

	interface Props {
		taskBlockResponses: TaskBlockWithResponse[];
		selectedTaskBlockId?: number;
		onTaskBlockSelect?: (taskBlockId: number) => void;
		taskId: number;
		classTaskId: number;
		subjectOfferingId: number;
		subjectOfferingClassId: number;
		studentId: string;
		readonly?: boolean;
	}

	let { 
		taskBlockResponses, 
		selectedTaskBlockId = $bindable(), 
		onTaskBlockSelect,
		taskId,
		classTaskId,
		subjectOfferingId,
		subjectOfferingClassId,
		studentId,
		readonly = false
	}: Props = $props();

	// Always use VIEW mode to mimic published student view
	const viewMode = ViewMode.VIEW;

	// Response props for interactive blocks (using student's data)
	const responseProps = {
		taskId,
		classTaskId,
		subjectOfferingId,
		subjectOfferingClassId,
		isPublished: true,
		studentId, // Pass the student ID so blocks can load their responses
		readonly: true // Make all blocks read-only
	};

	function handleBlockClick(taskBlockId: number) {
		selectedTaskBlockId = taskBlockId;
		onTaskBlockSelect?.(taskBlockId);
	}

	// No-op update function since this is read-only
	async function noOpUpdate(state: any) {
		// Do nothing - this is read-only view
	}
</script>

<div class="response-viewer space-y-4">
	{#each taskBlockResponses as { taskBlock, response } (taskBlock.id)}
		<div 
			class="p-4 rounded-lg border transition-colors hover:bg-muted cursor-pointer {selectedTaskBlockId === taskBlock.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-background'}"
			role="button"
			tabindex="0"
			onclick={() => handleBlockClick(taskBlock.id)}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					handleBlockClick(taskBlock.id);
				}
			}}
		>
			<!-- Make the content non-interactive by wrapping in a div with pointer-events-none -->
			<div class="pointer-events-none">
				{#if taskBlock.type === 'h1' || taskBlock.type === 'h2' || taskBlock.type === 'h3' || taskBlock.type === 'h4' || taskBlock.type === 'h5' || taskBlock.type === 'h6'}
					<Heading
						headingSize={parseInt(taskBlock.type[1]) + 1}
						text={typeof taskBlock.content === 'string' ? taskBlock.content : 'This is a heading'}
						{viewMode}
						onUpdate={noOpUpdate}
					/>
				{:else if taskBlock.type === 'markdown'}
					<RichTextEditor
						initialContent={taskBlock.content as string | undefined}
						{viewMode}
						onUpdate={noOpUpdate}
					/>
				{:else if taskBlock.type === 'image'}
					<Image
						content={taskBlock.content as Record<string, any> | undefined}
						{viewMode}
						onUpdate={noOpUpdate}
					/>
				{:else if taskBlock.type === 'video'}
					<Video
						content={taskBlock.content as Record<string, any> | undefined}
						{viewMode}
						onUpdate={noOpUpdate}
					/>
				{:else if taskBlock.type === 'audio'}
					<Audio
						content={taskBlock.content as Record<string, any> | undefined}
						{viewMode}
						onUpdate={noOpUpdate}
					/>
				{:else if taskBlock.type === 'whiteboard'}
					<Whiteboard
						content={taskBlock.content as Record<string, any> | undefined}
						{viewMode}
						onUpdate={noOpUpdate}
					/>
				{:else if taskBlock.type === 'multiple_choice'}
					<MultipleChoice
						content={taskBlock.content as any}
						{viewMode}
						onUpdate={noOpUpdate}
						blockId={taskBlock.id}
						{...responseProps}
					/>
				{:else if taskBlock.type === 'fill_in_blank'}
					<FillInBlank
						content={taskBlock.content as any}
						{viewMode}
						onUpdate={noOpUpdate}
						blockId={taskBlock.id}
						{...responseProps}
					/>
				{:else if taskBlock.type === 'matching'}
					<Matching
						content={taskBlock.content as any}
						{viewMode}
						onUpdate={noOpUpdate}
						blockId={taskBlock.id}
						{...responseProps}
					/>
				{:else if taskBlock.type === 'short_answer'}
					<ShortAnswer
						content={taskBlock.content as any}
						{viewMode}
						onUpdate={noOpUpdate}
						blockId={taskBlock.id}
						{...responseProps}
					/>
				{:else}
					<p>Content for {taskBlock.type} block.</p>
				{/if}
			</div>
		</div>
	{/each}
</div>