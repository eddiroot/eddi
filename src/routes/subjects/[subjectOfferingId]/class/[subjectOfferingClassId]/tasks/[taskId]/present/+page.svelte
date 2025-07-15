<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import { type TaskBlock } from '$lib/server/db/schema';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import XIcon from '@lucide/svelte/icons/x';
	import Maximize2Icon from '@lucide/svelte/icons/maximize-2';
	
	// Import all block components
	import Heading from '../blocks/heading.svelte';
	import RichTextEditor from '../blocks/rich-text-editor.svelte';
	import Image from '../blocks/image.svelte';
	import Video from '../blocks/video.svelte';
	import Audio from '../blocks/audio.svelte';
	import Whiteboard from '../blocks/whiteboard.svelte';
	import MultipleChoice from '../blocks/multiple-choice.svelte';
	import FillInBlank from '../blocks/fill-in-blank.svelte';
	import Matching from '../blocks/matching.svelte';
	import TwoColumnLayout from '../blocks/two-column-layout.svelte';
	import ShortAnswer from '../blocks/short-answer.svelte';

	let { data } = $props();
	let blocks = $state(data.blocks as TaskBlock[]);
	let currentSlide = $state(0);
	let isFullscreen = $state(false);

	// Group consecutive headings into slides
	let slides = $derived(() => {
		const grouped: TaskBlock[][] = [];
		let currentGroup: TaskBlock[] = [];

		for (const block of blocks) {
			const isHeading = block.type.startsWith('h') && block.type.match(/^h[1-6]$/);
      const isMarkdown = block.type === 'markdown';

			if (isHeading) {

        currentGroup.push(block);
			} else if (block.type === 'markdown') {
        currentGroup.push(block);
      } else {
        if (currentGroup.length > 0) {
				  grouped.push([...currentGroup]);
        }
        grouped.push([block]);
        currentGroup = [];
			}
		}
		
		// Add final group if it has content
		if (currentGroup.length > 0) {
			grouped.push(currentGroup);
		}
		
		// Add title slide as the first slide
		return [[], ...grouped]; // Empty array represents the title slide
	});

	// Navigation functions
	function nextSlide() {
		if (currentSlide < slides().length - 1) {
			currentSlide++;
		}
	}

	function prevSlide() {
		if (currentSlide > 0) {
			currentSlide--;
		}
	}

	function goToSlide(index: number) {
		if (index >= 0 && index < slides().length) {
			currentSlide = index;
		}
	}

	// Keyboard navigation
	function handleKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowRight':
			case ' ':
				event.preventDefault();
				nextSlide();
				break;
			case 'ArrowLeft':
				event.preventDefault();
				prevSlide();
				break;
			case 'Escape':
				event.preventDefault();
				exitFullscreen();
				break;
			case 'f':
			case 'F':
				event.preventDefault();
				toggleFullscreen();
				break;
		}
	}

	// Fullscreen functionality
	function toggleFullscreen() {
		if (!browser) return;
		
		if (!isFullscreen) {
			document.documentElement.requestFullscreen?.();
		} else {
			document.exitFullscreen?.();
		}
	}

	function exitFullscreen() {
		if (!browser) return;
		if (document.fullscreenElement) {
			document.exitFullscreen?.();
		}
	}

	onMount(() => {
		if (browser) {
			// Listen for fullscreen changes
			const handleFullscreenChange = () => {
				isFullscreen = !!document.fullscreenElement;
			};
			
			document.addEventListener('fullscreenchange', handleFullscreenChange);
			document.addEventListener('keydown', handleKeydown);
			
			return () => {
				document.removeEventListener('fullscreenchange', handleFullscreenChange);
				document.removeEventListener('keydown', handleKeydown);
			};
		}
	});
</script>

<svelte:head>
	<title>{data.task.title} - Presentation</title>
</svelte:head>

<div class="relative h-screen bg-gray-900 text-white">
	<div class="h-full">
		{#if slides().length > 0}
			<Card.Root class="h-full bg-white rounded-none">
				<Card.Content class="h-full p-8">
					{@const currentSlideBlocks = slides()[currentSlide]}
					
					<!-- Title slide (first slide) -->
					{#if currentSlide === 0}
						<div class="flex flex-col items-center justify-center h-full text-center">
							<h1 class="text-6xl font-bold text-gray-900 mb-8">{data.task.title}</h1>
							<div class="text-xl text-gray-600">
								{slides().length - 1} slides
							</div>
						</div>
					{:else}
						<!-- Render all blocks in the current slide -->
						{#each currentSlideBlocks as block, blockIndex}
						<div class="mb-6 {blockIndex === currentSlideBlocks.length - 1 ? 'mb-0' : ''}">
							<!-- Render the current block -->
							{#if block.type === 'h1'}
								<Heading
									headingSize={parseInt(block.type[1]) + 1}
									text={typeof block.content === 'string' ? block.content : 'This is a heading'}
									isEditMode={false}
									onUpdate={() => {}}
								/>
							{:else if block.type === 'h2' || block.type === 'h3' || block.type === 'h4' || block.type === 'h5' || block.type === 'h6'}
								<Heading
									headingSize={parseInt(block.type[1]) + 1}
									text={typeof block.content === 'string' ? block.content : 'This is a heading'}
									isEditMode={false}
									onUpdate={() => {}}
								/>
							{:else if block.type === 'markdown'}
								<RichTextEditor
									initialContent={block.content as string | undefined}
									isEditMode={false}
									onUpdate={() => {}}
								/>
							{:else if block.type === 'image'}
								<Image
									content={block.content as Record<string, any> | undefined}
									isEditMode={false}
									onUpdate={() => {}}
								/>
							{:else if block.type === 'video'}
								<Video
									content={block.content as Record<string, any> | undefined}
									isEditMode={false}
									onUpdate={() => {}}
								/>
							{:else if block.type === 'audio'}
								<Audio
									content={block.content as Record<string, any> | undefined}
									isEditMode={false}
									onUpdate={() => {}}
								/>
							{:else if block.type === 'whiteboard'}
								<Whiteboard
									content={block.content as Record<string, any> | undefined}
									isEditMode={false}
									onUpdate={() => {}}
								/>
							{:else if block.type === 'multiple_choice'}
								<MultipleChoice
									content={block.content as any}
									isEditMode={false}
									onUpdate={() => {}}
								/>
							{:else if block.type === 'fill_in_blank'}
								<FillInBlank
									content={block.content as any}
									isEditMode={false}
									onUpdate={() => {}}
								/>
							{:else if block.type === 'matching'}
								<Matching
									content={block.content as any}
									isEditMode={false}
									onUpdate={() => {}}
								/>
							<!--{:else if block.type === 'two_column_layout'}
								<TwoColumnLayout
									content={block.content as any}
									isEditMode={false}
									onUpdate={() => {}}
									onGlobalDrop={() => {}}
								/> -->
							{:else if block.type === 'short_answer'}
								<ShortAnswer
									content={block.content as any}
									isEditMode={false}
									onUpdate={() => {}}
								/>
							{:else}
								<div class="text-center text-gray-500">
									<p>Content for {block.type} block.</p>
								</div>
							{/if}
						</div>
					{/each}
					{/if}
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="flex items-center justify-center h-full bg-gray-100">
				<p class="text-xl text-gray-500">No slides to display</p>
			</div>
		{/if}
	</div>

	<!-- Left Navigation Arrow -->
	{#if currentSlide > 0}
		<button
			class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all duration-200"
			onclick={prevSlide}
		>
			<ChevronLeftIcon class="h-6 w-6" />
		</button>
	{/if}

	<!-- Right Navigation Arrow -->
	{#if currentSlide < slides().length - 1}
		<button
			class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all duration-200"
			onclick={nextSlide}
		>
			<ChevronRightIcon class="h-6 w-6" />
		</button>
	{/if}

	<!-- Bottom Navigation Overlay -->
	<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
		<div class="flex items-center justify-between text-white">
			<!-- Task Info -->
			<div class="flex items-center gap-4">
				<h1 class="text-lg font-semibold">{data.task.title}</h1>
				<div class="text-sm opacity-80">
					{currentSlide + 1} / {slides().length}
				</div>
			</div>
			
			<!-- Controls -->
			<div class="flex items-center gap-2">
				<!-- Slide Dots -->
				<div class="flex items-center gap-1 mr-4">
					{#each slides() as _, index}
						<button
							class="h-2 w-2 rounded-full transition-colors {index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-40 hover:bg-opacity-60'}"
							onclick={() => goToSlide(index)}
							title="Go to slide {index + 1}"
						></button>
					{/each}
				</div>

				<!-- Fullscreen toggle -->
				<Button 
					variant="ghost" 
					size="sm" 
					onclick={toggleFullscreen}
					class="text-white hover:bg-white hover:bg-opacity-20"
				>
					<Maximize2Icon class="h-4 w-4" />
				</Button>
				
				<!-- Exit presentation -->
				<Button 
					variant="ghost" 
					size="sm" 
					href="../"
					class="text-white hover:bg-white hover:bg-opacity-20"
				>
					<XIcon class="h-4 w-4" />
				</Button>
			</div>
		</div>
	</div>
</div>

<!-- Fullscreen Styles -->
<style>
	:global(html:fullscreen) {
		background: rgb(17 24 39); /* gray-900 */
	}
	
	:global(html:fullscreen body) {
		background: rgb(17 24 39); /* gray-900 */
	}
</style>