<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Card from '$lib/components/ui/card';
	import { ViewMode } from '$lib/utils';

	import EditIcon from '@lucide/svelte/icons/edit';
	import PresentationIcon from '@lucide/svelte/icons/presentation';

	let { content = { whiteboardId: null, title: '' }, viewMode = ViewMode.VIEW, onUpdate = () => {} } = $props();

	// Local state for editing
	let title = $state(content.title || '');
	let whiteboardId = $state(content.whiteboardId);

	// Initialize editing state when component loads or content changes
	$effect(() => {
		if (viewMode === ViewMode.EDIT) {
			title = content.title || '';
			whiteboardId = content.whiteboardId;
		}
	});

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
	{#if viewMode === ViewMode.EDIT}
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
						bind:value={title}
						onblur={saveChanges}
						placeholder="Enter whiteboard title (optional)"
					/>
				</div>
			</Card.Content>
		</Card.Root>
	{:else}
		{#if whiteboardId}
			<div class="rounded-lg border p-6 text-center">
				<PresentationIcon class="text-muted-foreground mx-auto mb-3 h-12 w-12" />
				<h3 class="mb-2 text-lg font-semibold break-words">
					{title || 'Interactive Whiteboard'}
				</h3>
				<Button class="w-full mt-6" onclick={openWhiteboard}>
					Open Whiteboard
				</Button>
			</div>
		{:else}
			<button
				type="button"
				class="focus:ring-primary flex h-32 w-full cursor-pointer items-center justify-center rounded-lg border border-dashed focus:ring-2 focus:outline-none"
				onclick={openWhiteboard}
				aria-label="Create and open whiteboard"
			>
				<div class="pointer-events-none text-center">
					<PresentationIcon class="text-muted-foreground mx-auto h-12 w-12" />
					<p class="text-muted-foreground mt-2 text-sm">No whiteboard created</p>
					<p class="text-muted-foreground text-xs">Click to create and open whiteboard</p>
				</div>
			</button>
		{/if}
	{/if}
</div>
