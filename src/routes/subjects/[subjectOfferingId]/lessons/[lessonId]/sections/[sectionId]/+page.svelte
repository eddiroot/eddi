<script lang="ts">
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';
	import { invalidateAll } from '$app/navigation';
	import Heading from './blocks/heading.svelte';
	import Markdown from './blocks/markdown.svelte';
	import Image from './blocks/image.svelte';
	import Video from './blocks/video.svelte';
	import Audio from './blocks/audio.svelte';
	import Whiteboard from './blocks/whiteboard.svelte';
	import MultipleChoice from './blocks/multiple-choice.svelte';
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
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import EditIcon from '@lucide/svelte/icons/edit';
	import HelpCircleIcon from '@lucide/svelte/icons/help-circle';
	import { type LessonSectionBlock } from '$lib/server/db/schema';

	let { data } = $props();
	let blocks = $derived(() => data.blocks);
	let editingSectionId = $state<number | null>(null);
	let newSectionTitle = $state('');
	let showNewSectionInput = $state(false);

	async function handleDrop(state: DragDropState<LessonSectionBlock>) {
		const { draggedItem, sourceContainer, targetContainer } = state;
		if (!targetContainer) return;

		console.log('handleDrop', sourceContainer, targetContainer);

		if (sourceContainer === 'blockSelectionMenu' && targetContainer === 'sectionColumn') {
			await createBlock(draggedItem);
			return;
		}

		if (sourceContainer === 'sectionColumn' && targetContainer === 'deleteBin') {
			await deleteBlock(draggedItem);
			return;
		}

		if (sourceContainer.startsWith('block-') && targetContainer.startsWith('block-')) {
			const sourceId = parseInt(sourceContainer.split('-')[1]);
			const targetId = parseInt(targetContainer.split('-')[1]);

			if (sourceId === targetId) return;

			const sourceBlock = blocks().find((b) => b.id === sourceId);
			const targetBlock = blocks().find((b) => b.id === targetId);

			if (!sourceBlock || !targetBlock) return;

			await swapBlocks(sourceBlock, targetBlock);
			return;
		}
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

	async function createBlock(draggedItem: LessonSectionBlock) {
		const formData = new FormData();
		formData.append('lessonSectionId', data.section.id.toString());
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

	async function updateBlockContent(block: LessonSectionBlock, content: unknown) {
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

	async function deleteBlock(block: LessonSectionBlock) {
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

	async function swapBlocks(blockA: LessonSectionBlock, blockB: LessonSectionBlock) {
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

	async function createSection() {
		if (!newSectionTitle.trim()) return;

		const formData = new FormData();
		formData.append('lessonId', data.lesson.id.toString());
		formData.append('title', newSectionTitle.trim());

		const response = await fetch('?/createSection', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			showNewSectionInput = false;
			newSectionTitle = '';
			await invalidateAll();
		}
	}

	async function updateSection(sectionId: number, title: string) {
		const formData = new FormData();
		formData.append('sectionId', sectionId.toString());
		formData.append('title', title);

		const response = await fetch('?/updateSection', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			editingSectionId = null;
			await invalidateAll();
		}
	}

	async function deleteSection(sectionId: number) {
		if (sectionId === data.section.id) {
			alert('You cannot delete the current section.');
			return;
		}

		const formData = new FormData();
		formData.append('sectionId', sectionId.toString());
		formData.append('lessonId', data.lesson.id.toString());

		await fetch('?/deleteSection', {
			method: 'POST',
			body: formData
		});

		await invalidateAll();
	}
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
			{#each data.sections as section, index}
				<div class="flex items-center gap-2">
					{#if editingSectionId === section.id}
						<Input
							bind:value={section.title}
							class="flex-1"
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									updateSection(section.id, section.title);
								}
							}}
						/>
						<Button size="sm" onclick={() => updateSection(section.id, section.title)}>Save</Button>
					{:else}
						<a
							href={`/subjects/${data.subjectOfferingId}/lessons/${data.lesson.id}/sections/${section.id}`}
							class={`${buttonVariants({ variant: data.section.id === section.id ? 'default' : 'outline' })} block flex-1`}
						>
							{section.title}
						</a>
						<Button size="sm" variant="ghost" onclick={() => (editingSectionId = section.id)}>
							<EditIcon class="h-3 w-3" />
						</Button>
						<Button size="sm" variant="ghost" onclick={() => deleteSection(section.id)}>
							<TrashIcon class="h-3 w-3" />
						</Button>
					{/if}
				</div>
			{/each}

			{#if showNewSectionInput}
				<div class="flex gap-2">
					<Input
						bind:value={newSectionTitle}
						placeholder="Section title"
						class="flex-1"
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								createSection();
							}
						}}
					/>
					<Button onclick={createSection}>Add</Button>
					<Button variant="ghost" onclick={() => (showNewSectionInput = false)}>Cancel</Button>
				</div>
			{:else}
				<Button class="w-full" onclick={() => (showNewSectionInput = true)}>
					<PlusIcon />
					Add New Section
				</Button>
			{/if}
		</Card.Content>
	</Card.Root>

	<Card.Root class="h-full">
		<Card.Header>
			{#if data.sections.length > 0}
				<Heading
					headingSize={1}
					text={data.lesson.title}
					onUpdate={(newText: string) => updateLessonTitle(newText)}
				/>
			{/if}
		</Card.Header>
		<Card.Content class="h-full">
			<div class="flex h-full flex-col gap-4">
				{#each blocks() as item}
					<div
						use:droppable={{
							container: `block-${item.id}`,
							callbacks: {
								onDrop: handleDrop
							}
						}}
						use:draggable={{
							container: `block-${item.id}`,
							dragData: item,
							interactive: ['.interactive']
						}}
					>
						{#if item.type[0] === 'h'}
							<Heading
								headingSize={parseInt(item.type[1]) + 1}
								text={typeof item.content === 'string' ? item.content : 'This is a heading'}
								onUpdate={(newText: string) => updateBlockContent(item, newText)}
							/>
						{:else if item.type === 'markdown'}
							<Markdown
								content={typeof item.content === 'string' ? item.content : ''}
								onUpdate={(newContent: string) => updateBlockContent(item, newContent)}
							/>
						{:else if item.type === 'image'}
							<Image
								content={item.content as Record<string, any> | undefined}
								onUpdate={(newContent: any) => updateBlockContent(item, newContent)}
							/>
						{:else if item.type === 'video'}
							<Video
								content={item.content as Record<string, any> | undefined}
								onUpdate={(newContent: any) => updateBlockContent(item, newContent)}
							/>
						{:else if item.type === 'audio'}
							<Audio
								content={item.content as Record<string, any> | undefined}
								onUpdate={(newContent: any) => updateBlockContent(item, newContent)}
							/>
						{:else if item.type === 'whiteboard'}
							<Whiteboard
								content={item.content as Record<string, any> | undefined}
								onUpdate={(newContent: any) => updateBlockContent(item, newContent)}
							/>
						{:else if item.type === 'multipleChoice'}
							<MultipleChoice
								content={item.content as any}
								onUpdate={(newContent: any) => updateBlockContent(item, newContent)}
							/>
						{:else}
							<p>Content for {item.type} block.</p>
						{/if}
					</div>
				{/each}
				<div
					use:droppable={{
						container: 'sectionColumn',
						callbacks: {
							onDrop: handleDrop
						}
					}}
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
				<div
					class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
					use:draggable={{
						container: 'blockSelectionMenu',
						dragData: { type: 'h1', content: 'This is a Heading 1', id: 0 }
					}}
				>
					<HeadingOneIcon class="size-8" />
				</div>
				<div
					class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
					use:draggable={{
						container: 'blockSelectionMenu',
						dragData: { type: 'h2', content: 'This is a Heading 2', id: 0 }
					}}
				>
					<HeadingTwoIcon class="size-8" />
				</div>
				<div
					class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
					use:draggable={{
						container: 'blockSelectionMenu',
						dragData: { type: 'h3', content: 'This is a Heading 3', id: 0 }
					}}
				>
					<HeadingThreeIcon class="size-8" />
				</div>
				<div
					class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
					use:draggable={{
						container: 'blockSelectionMenu',
						dragData: { type: 'h4', content: 'This is a Heading 4', id: 0 }
					}}
				>
					<HeadingFourIcon class="size-8" />
				</div>
				<div
					class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
					use:draggable={{
						container: 'blockSelectionMenu',
						dragData: { type: 'h5', content: 'This is a Heading 5', id: 0 }
					}}
				>
					<HeadingFiveIcon class="size-8" />
				</div>
				<div
					class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
					use:draggable={{
						container: 'blockSelectionMenu',
						dragData: { type: 'markdown', content: 'This is markdown content...', id: 0 }
					}}
				>
					<PilcrowIcon class="size-8" />
				</div>
				<div
					class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
					use:draggable={{
						container: 'blockSelectionMenu',
						dragData: { type: 'image', content: { src: '', alt: 'Image', caption: '' }, id: 0 }
					}}
				>
					<ImageIcon class="size-8" />
				</div>
				<div
					class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
					use:draggable={{
						container: 'blockSelectionMenu',
						dragData: { type: 'video', content: { src: '', title: 'Video' }, id: 0 }
					}}
				>
					<FilmIcon class="size-8" />
				</div>
				<div
					class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
					use:draggable={{
						container: 'blockSelectionMenu',
						dragData: { type: 'audio', content: { src: '', title: 'Audio' }, id: 0 }
					}}
				>
					<AudioLinesIcon class="size-8" />
				</div>
				<div
					class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
					use:draggable={{
						container: 'blockSelectionMenu',
						dragData: { type: 'whiteboard', content: { whiteboardId: null, title: '' }, id: 0 }
					}}
				>
					<PresentationIcon class="size-8" />
				</div>
				<div
					class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
					use:draggable={{
						container: 'blockSelectionMenu',
						dragData: { type: 'multipleChoice', content: { question: '', options: [], explanation: '' }, id: 0 }
					}}
				>
					<HelpCircleIcon class="size-8" />
				</div>
			</div>

			<div
				class={`${buttonVariants({ variant: 'destructive' })} h-16 w-full cursor-default`}
				use:droppable={{
					container: 'deleteBin',
					callbacks: {
						onDrop: handleDrop
					}
				}}
			>
				<TrashIcon />
				<span>Drop here to delete</span>
			</div>
		</Card.Content>
	</Card.Root>
</div>
