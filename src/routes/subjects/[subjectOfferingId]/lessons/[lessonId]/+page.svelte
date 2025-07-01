<script lang="ts">
	import { flip } from 'svelte/animate';
	import { dndzone } from 'svelte-dnd-action';
	import { invalidateAll } from '$app/navigation';
	import { type LessonBlock } from '$lib/server/db/schema';

	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Heading from './blocks/heading.svelte';
	import Markdown from './blocks/markdown.svelte';
	import Image from './blocks/image.svelte';
	import Video from './blocks/video.svelte';
	import Audio from './blocks/audio.svelte';
	import Whiteboard from './blocks/whiteboard.svelte';
	import MultipleChoice from './blocks/multiple-choice.svelte';
	import FillInBlankBlock from './blocks/fill-in-blank.svelte';

	import HeadingOneIcon from '@lucide/svelte/icons/heading-1';
	import HeadingTwoIcon from '@lucide/svelte/icons/heading-2';
	import HeadingThreeIcon from '@lucide/svelte/icons/heading-3';
	import HeadingFourIcon from '@lucide/svelte/icons/heading-4';
	import HeadingFiveIcon from '@lucide/svelte/icons/heading-5';
	import PilcrowIcon from '@lucide/svelte/icons/pilcrow';
	import ImageIcon from '@lucide/svelte/icons/image';
	import FilmIcon from '@lucide/svelte/icons/film';
	import AudioLinesIcon from '@lucide/svelte/icons/audio-lines';
	import PresentationIcon from '@lucide/svelte/icons/presentation';
	import HelpCircleIcon from '@lucide/svelte/icons/help-circle';
	import PenToolIcon from '@lucide/svelte/icons/pen-tool';

	let { data } = $props();

	let blocks: LessonBlock[] = $state(data.blocks);

	const flipDurationMs = 300;
	async function handleDndFinalise(e: any) {
		blocks = e.detail.items;
		// if (!targetContainer) return;

		// if (sourceContainer === 'blockSelectionMenu' && targetContainer === 'sectionColumn') {
		// 	await createBlock(draggedItem);
		// 	return;
		// }

		// if (sourceContainer === 'sectionColumn' && targetContainer === 'blockSelectionMenu') {
		// 	await deleteBlock(draggedItem);
		// 	return;
		// }

		// if (sourceContainer.startsWith('block-') && targetContainer.startsWith('block-')) {
		// 	const sourceId = parseInt(sourceContainer.split('-')[1]);
		// 	const targetId = parseInt(targetContainer.split('-')[1]);

		// 	if (sourceId === targetId) return;

		// 	const sourceBlock = data.blocks.find((b) => b.id === sourceId);
		// 	const targetBlock = data.blocks.find((b) => b.id === targetId);

		// 	if (!sourceBlock || !targetBlock) return;

		// 	await swapBlocks(sourceBlock, targetBlock);
		// 	return;
		// }
	}

	async function updateLessonTitle(title: string) {
		const formData = new FormData();
		formData.append('lessonId', data.lesson.id.toString());
		formData.append('title', title);

		const response = await fetch('?/updateLessonTitle', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			await invalidateAll();
		}
	}

	async function createBlock(draggedItem: LessonBlock) {
		const formData = new FormData();
		formData.append('lessonId', data.lesson.id.toString());
		formData.append('type', draggedItem.type);
		formData.append('content', JSON.stringify(draggedItem.content ?? ''));

		const response = await fetch('?/createBlock', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			await invalidateAll();
		}
	}

	async function updateBlockContent(block: LessonBlock, content: unknown) {
		const formData = new FormData();
		formData.append('blockId', block.id.toString());
		formData.append('content', JSON.stringify(content));

		const response = await fetch('?/updateBlock', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			await invalidateAll();
		}
	}

	async function deleteBlock(block: LessonBlock) {
		const formData = new FormData();
		formData.append('blockId', block.id.toString());

		const response = await fetch('?/deleteBlock', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			await invalidateAll();
		}
	}

	async function swapBlocks(blockA: LessonBlock, blockB: LessonBlock) {
		const formData = new FormData();
		formData.append('blockOneId', blockA.id.toString());
		formData.append('blockTwoId', blockB.id.toString());
		formData.append('blockOneIndex', blockA.index.toString());
		formData.append('blockTwoIndex', blockB.index.toString());

		const response = await fetch('?/swapBlocks', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			await invalidateAll();
		}
	}
</script>

<div class="grid h-full grid-cols-[300px_1fr_300px] gap-4 p-4">
	<Card.Root class="h-full">
		<Card.Header>
			<Card.Title class="text-lg">Contents</Card.Title>
			<Card.Description>Navigate between headings in the lesson</Card.Description>
		</Card.Header>
		<Card.Content></Card.Content>
	</Card.Root>

	<Card.Root class="h-full">
		<Card.Header>
			<Heading
				headingSize={1}
				text={data.lesson.title}
				onUpdate={(newText: string) => updateLessonTitle(newText)}
			/>
		</Card.Header>
		<Card.Content class="h-full">
			<div class="flex h-full flex-col gap-4">
				{#each data.blocks as block (block.id)}
					<div animate:flip={{ duration: flipDurationMs }}>
						{#if block.type[0] === 'h'}
							<Heading
								headingSize={parseInt(block.type[1]) + 1}
								text={typeof block.content === 'string' ? block.content : 'This is a heading'}
								onUpdate={(newText: string) => updateBlockContent(block, newText)}
							/>
						{:else if block.type === 'markdown'}
							<Markdown
								content={typeof block.content === 'string' ? block.content : ''}
								onUpdate={(newContent: string) => updateBlockContent(block, newContent)}
							/>
						{:else if block.type === 'image'}
							<Image
								content={block.content as Record<string, any> | undefined}
								onUpdate={(newContent: any) => updateBlockContent(block, newContent)}
							/>
						{:else if block.type === 'video'}
							<Video
								content={block.content as Record<string, any> | undefined}
								onUpdate={(newContent: any) => updateBlockContent(block, newContent)}
							/>
						{:else if block.type === 'audio'}
							<Audio
								content={block.content as Record<string, any> | undefined}
								onUpdate={(newContent: any) => updateBlockContent(block, newContent)}
							/>
						{:else if block.type === 'whiteboard'}
							<Whiteboard
								content={block.content as Record<string, any> | undefined}
								onUpdate={(newContent: any) => updateBlockContent(block, newContent)}
							/>
						{:else if block.type === 'multiple_choice'}
							<MultipleChoice
								content={block.content as any}
								onUpdate={(newContent: any) => updateBlockContent(block, newContent)}
							/>
						{:else if block.type === 'fill_in_blank'}
							<FillInBlankBlock
								content={block.content as any}
								onUpdate={(newContent: any) => updateBlockContent(block, newContent)}
							/>
						{:else}
							<p>Content for {block.type} block.</p>
						{/if}
					</div>
				{/each}
				<div
					use:dndzone={{ items: data.blocks, flipDurationMs }}
					onfinalize={handleDndFinalise}
					class={`${buttonVariants({ variant: 'outline' })} flex h-16 w-full cursor-default items-center justify-center`}
				>
					<span>Drop blocks here to add them to the section</span>
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
			<div class="grid flex-1 grid-cols-2 gap-2">
				{#each [{ icon: HeadingOneIcon, label: 'Heading 1' }, { icon: HeadingTwoIcon, label: 'Heading 2' }, { icon: HeadingThreeIcon, label: 'Heading 3' }, { icon: HeadingFourIcon, label: 'Heading 4' }, { icon: HeadingFiveIcon, label: 'Heading 5' }, { icon: PilcrowIcon, label: 'Paragraph' }, { icon: ImageIcon, label: 'Image' }, { icon: FilmIcon, label: 'Video' }, { icon: AudioLinesIcon, label: 'Audio' }, { icon: PresentationIcon, label: 'Whiteboard' }, { icon: HelpCircleIcon, label: 'Multiple Choice' }, { icon: PenToolIcon, label: 'Fill in Blank' }] as blockType (blockType.label)}
					<div
						class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
						animate:flip={{ duration: flipDurationMs }}
						title={blockType.label}
					>
						<blockType.icon class="size-8" />
					</div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>
</div>
