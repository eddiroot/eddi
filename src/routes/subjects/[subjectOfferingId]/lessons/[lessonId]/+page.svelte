<script lang="ts">
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';
	import Heading from './blocks/heading.svelte';
	import Markdown from './blocks/markdown.svelte';
	import Image from './blocks/image.svelte';
	import Video from './blocks/video.svelte';
	import Audio from './blocks/audio.svelte';
	import HeadingOneIcon from '@lucide/svelte/icons/heading-1';
	import HeadingTwoIcon from '@lucide/svelte/icons/heading-2';
	import HeadingThreeIcon from '@lucide/svelte/icons/heading-3';
	import HeadingFourIcon from '@lucide/svelte/icons/heading-4';
	import HeadingFiveIcon from '@lucide/svelte/icons/heading-5';
	import PilcrowIcon from '@lucide/svelte/icons/pilcrow';
	import ImageIcon from '@lucide/svelte/icons/image';
	import FilmIcon from '@lucide/svelte/icons/film';
	import AudioLinesIcon from '@lucide/svelte/icons/audio-lines';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import type { LessonSectionBlock } from '$lib/server/db/schema';

	let { data } = $props();
	let items = $state<LessonSectionBlock[]>(data.lessonBlocks ? data.lessonBlocks : []);
	let selectedLessonSectionId = $derived(() =>
		data.lesson ? (data.lesson.length > 0 ? data.lesson[0].lessonSection.id : null) : null
	);

	async function handleDrop(state: DragDropState<LessonSectionBlock>) {
		const { draggedItem, sourceContainer, targetContainer } = state;
		if (!targetContainer || sourceContainer === targetContainer) return;

		if (sourceContainer === 'blockSelectionMenu' && targetContainer === 'blocksColumn') {
			const formData = new FormData();
			formData.append('lessonSectionId', selectedLessonSectionId()?.toString() ?? '');
			formData.append('type', draggedItem.type);
			formData.append('content', JSON.stringify(draggedItem.content ?? ''));

			await fetch('?/createBlock', {
				method: 'POST',
				body: formData
			});

			items = [...items, draggedItem];
		}

		if (sourceContainer === 'blocksColumn' && targetContainer === 'blockSelectionMenu') {
			items = items.filter((item) => item !== draggedItem);
		}
	}

	function handleDragEnter(state: DragDropState<LessonSectionBlock>) {}
	function handleDragLeave(state: DragDropState<LessonSectionBlock>) {}
</script>

<div class="grid h-full grid-cols-[300px_1fr_300px] gap-4 p-4">
	<Card.Root class="h-full">
		<Card.Header>
			<Card.Title class="text-lg">Sections</Card.Title>
			<Card.Description>
				Choose a lesson section to edit its blocks, or add a new section.
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			{#each data.lesson ?? [] as lesson}
				<Button class="w-full" variant="outline">
					{lesson.lessonSection.title}
				</Button>
			{/each}
			<Button class="w-full">
				<PlusIcon />
				Add New Section
			</Button>
		</Card.Content>
	</Card.Root>
	<Card.Root class="h-full">
		<Card.Header>
			<Heading headingSize={1} text={data.lesson![0]!.lesson.title} />
		</Card.Header>
		<Card.Content class="h-full">
			<div
				class="flex h-full flex-col gap-4"
				use:droppable={{
					container: 'blocksColumn',
					callbacks: {
						onDrop: handleDrop,
						onDragEnter: handleDragEnter,
						onDragLeave: handleDragLeave
					}
				}}
			>
				{#each items as item}
					{#if item.type[0] === 'h'}
						<Heading headingSize={parseInt(item.type[1]) + 1} text="This is a heading" />
					{:else if item.type === 'markdown'}
						<Markdown />
					{:else if item.type === 'image'}
						<Image />
					{:else if item.type === 'video'}
						<Video />
					{:else if item.type === 'audio'}
						<Audio />
					{:else}
						<p>Content for {item.type} block.</p>
					{/if}
				{/each}
			</div>
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-lg">Blocks</Card.Title>
			<Card.Description>
				Drag and drop blocks from here to the lesson content area.
			</Card.Description>
		</Card.Header>
		<Card.Content class="grid grid-cols-2 grid-rows-12 gap-2">
			<div
				class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
				use:draggable={{
					container: 'blockSelectionMenu',
					dragData: { type: 'h1', content: 'This is a Heading 1' }
				}}
			>
				<HeadingOneIcon class="size-8" />
			</div>
			<div
				class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
				use:draggable={{
					container: 'blockSelectionMenu',
					dragData: { type: 'h2', content: 'This is a Heading 2' }
				}}
			>
				<HeadingTwoIcon class="size-8" />
			</div>
			<div
				class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
				use:draggable={{
					container: 'blockSelectionMenu',
					dragData: { type: 'h3', content: 'This is a Heading 3' }
				}}
			>
				<HeadingThreeIcon class="size-8" />
			</div>
			<div
				class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
				use:draggable={{
					container: 'blockSelectionMenu',
					dragData: { type: 'h4', content: 'This is a Heading 4' }
				}}
			>
				<HeadingFourIcon class="size-8" />
			</div>
			<div
				class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
				use:draggable={{
					container: 'blockSelectionMenu',
					dragData: { type: 'h5', content: 'This is a Heading 5' }
				}}
			>
				<HeadingFiveIcon class="size-8" />
			</div>
			<div
				class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
				use:draggable={{
					container: 'blockSelectionMenu',
					dragData: { type: 'markdown', content: 'This is markdown' }
				}}
			>
				<PilcrowIcon class="size-8" />
			</div>
			<div
				class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
				use:draggable={{
					container: 'blockSelectionMenu',
					dragData: { type: 'image', content: 'This is an image' }
				}}
			>
				<ImageIcon class="size-8" />
			</div>
			<div
				class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
				use:draggable={{
					container: 'blockSelectionMenu',
					dragData: { type: 'video', content: 'This is a video' }
				}}
			>
				<FilmIcon class="size-8" />
			</div>
			<div
				class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
				use:draggable={{
					container: 'blockSelectionMenu',
					dragData: { type: 'audio', content: 'This is audio' }
				}}
			>
				<AudioLinesIcon class="size-8" />
			</div>
		</Card.Content>
	</Card.Root>
</div>
