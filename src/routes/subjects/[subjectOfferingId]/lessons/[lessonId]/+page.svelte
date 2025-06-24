<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
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

	let { data } = $props();
	let items = $state<{ id: string }[]>([]);

	function handleDrop(state: DragDropState<{ id: string }>) {
		const { draggedItem, sourceContainer, targetContainer } = state;
		if (!targetContainer || sourceContainer === targetContainer) return;
		items = items.filter((item) => item !== draggedItem);
		items = [...items, draggedItem];
	}

	function handleDragEnter(state: DragDropState<{ id: string }>) {}
	function handleDragLeave(state: DragDropState<{ id: string }>) {}
</script>

<div class="grid h-full grid-cols-[1fr_300px] gap-4 p-4">
	<Card.Root class="h-full">
		<Card.Header>
			<Heading headingSize={1} text={data.lesson?.lesson.title} />
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
					{#if item.id[0] === 'h'}
						<Heading headingSize={parseInt(item.id[1]) + 1} text="This is a heading" />
					{:else if item.id === 'markdown'}
						<Markdown />
					{:else if item.id === 'image'}
						<Image />
					{:else if item.id === 'video'}
						<Video />
					{:else if item.id === 'audio'}
						<Audio />
					{:else}
						<p>Content for {item.id} block.</p>
					{/if}
				{/each}
			</div>
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-lg">Block Selection Menu</Card.Title>
			<Card.Description>
				Drag and drop blocks from here to the lesson content area.
			</Card.Description>
		</Card.Header>
		<Card.Content class="grid grid-cols-2 grid-rows-12 gap-2">
			<div
				class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
				use:draggable={{ container: 'blockSelectionMenu', dragData: { id: 'h1' } }}
			>
				<HeadingOneIcon class="size-8" />
			</div>
			<div
				class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
				use:draggable={{ container: 'blockSelectionMenu', dragData: { id: 'h2' } }}
			>
				<HeadingTwoIcon class="size-8" />
			</div>
			<div
				class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
				use:draggable={{ container: 'blockSelectionMenu', dragData: { id: 'h3' } }}
			>
				<HeadingThreeIcon class="size-8" />
			</div>
			<div
				class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
				use:draggable={{ container: 'blockSelectionMenu', dragData: { id: 'h4' } }}
			>
				<HeadingFourIcon class="size-8" />
			</div>
			<div
				class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
				use:draggable={{ container: 'blockSelectionMenu', dragData: { id: 'h5' } }}
			>
				<HeadingFiveIcon class="size-8" />
			</div>
			<div
				class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
				use:draggable={{ container: 'blockSelectionMenu', dragData: { id: 'markdown' } }}
			>
				<PilcrowIcon class="size-8" />
			</div>
			<div
				class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
				use:draggable={{ container: 'blockSelectionMenu', dragData: { id: 'image' } }}
			>
				<ImageIcon class="size-8" />
			</div>
			<div
				class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
				use:draggable={{ container: 'blockSelectionMenu', dragData: { id: 'video' } }}
			>
				<FilmIcon class="size-8" />
			</div>
			<div
				class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
				use:draggable={{ container: 'blockSelectionMenu', dragData: { id: 'audio' } }}
			>
				<AudioLinesIcon class="size-8" />
			</div>
		</Card.Content>
	</Card.Root>
</div>
