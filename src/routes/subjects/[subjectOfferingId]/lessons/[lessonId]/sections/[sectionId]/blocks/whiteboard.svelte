<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Card from '$lib/components/ui/card';

	import EditIcon from '@lucide/svelte/icons/edit';
	import PresentationIcon from '@lucide/svelte/icons/presentation';

	let {
		content = { whiteboardId: null, title: '' },
		onUpdate = () => {}
	} = $props();

	let isEditing = $state(false);
	
	// Local state for editing
	let title = $state(content.title || '');
	let whiteboardId = $state(content.whiteboardId);

	const { lessonId, subjectOfferingId } = $page.params;

	const createWhiteboard = async () => {
		try {
			const response = await fetch('/api/whiteboards', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					lessonId: parseInt(lessonId),
					title: title || null
				})
			});

			if (response.ok) {
				const data = await response.json();
				whiteboardId = data.whiteboardId;
				return data.whiteboardId;
			}
		} catch (error) {
			console.error('Failed to create whiteboard:', error);
		}
		return null;
	};

	const saveChanges = async () => {
		let currentWhiteboardId = whiteboardId;
		
		if (!currentWhiteboardId) {
			currentWhiteboardId = await createWhiteboard();
		}

		const newContent = { 
			whiteboardId: currentWhiteboardId, 
			title: title || ''
		};

		content = newContent;
		onUpdate(newContent);
		isEditing = false;
	};

	const openWhiteboard = async () => {
		console.log('openWhiteboard called');
		let currentWhiteboardId = whiteboardId;
		
		if (!currentWhiteboardId) {
			console.log('Creating new whiteboard...');
			currentWhiteboardId = await createWhiteboard();
			if (currentWhiteboardId) {
				const newContent = { 
					whiteboardId: currentWhiteboardId, 
					title: title || ''
				};
				content = newContent;
				onUpdate(newContent);
			}
		}

		if (currentWhiteboardId) {
			const url = `/subjects/${subjectOfferingId}/lessons/${lessonId}/whiteboard/${currentWhiteboardId}`;
			console.log('Navigating to:', url);
			goto(url);
		} else {
			console.error('Failed to get whiteboard ID');
		}
	};
</script>

<div class="flex w-full flex-col gap-4">
	{#if isEditing}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<PresentationIcon class="h-4 w-4" />
					Configure Whiteboard
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="space-y-2">
					<Label for="whiteboard-title">Whiteboard Title (Optional)</Label>
					<Input
						id="whiteboard-title"
						class="interactive"
						bind:value={title}
						placeholder="Enter whiteboard title (optional)"
					/>
				</div>

				<div class="flex gap-2">
					<Button class="interactive" onclick={saveChanges}>Save</Button>
					<Button class="interactive" variant="outline" onclick={() => (isEditing = false)}
						>Cancel</Button
					>
				</div>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="group relative">
			{#if whiteboardId}
				<div class="rounded-lg border p-6 text-center">
					<PresentationIcon class="text-muted-foreground mx-auto h-12 w-12 mb-3" />
					<h3 class="text-lg font-semibold mb-2">
						{title || 'Interactive Whiteboard'}
					</h3>
					<Button onclick={openWhiteboard} class="interactive">
						Open Whiteboard
					</Button>
				</div>
			{:else}
				<button
					type="button"
					class="flex h-32 w-full items-center justify-center rounded-lg border border-dashed cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
					onclick={openWhiteboard}
					aria-label="Create and open whiteboard"
				>
					<div class="text-center pointer-events-none">
						<PresentationIcon class="text-muted-foreground mx-auto h-12 w-12" />
						<p class="text-muted-foreground mt-2 text-sm">No whiteboard created</p>
						<p class="text-muted-foreground text-xs">Click to create and open whiteboard</p>
					</div>
				</button>
			{/if}

			<Button
				onclick={(e) => {
					e.stopPropagation();
					title = content.title || '';
					isEditing = true;
				}}
				class="interactive absolute top-2 right-2"
			>
				<EditIcon class="h-3 w-3" />
			</Button>
		</div>
	{/if}
</div>
