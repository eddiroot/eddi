<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Card from '$lib/components/ui/card';
	import EditIcon from '@lucide/svelte/icons/edit';
	import ImageIcon from '@lucide/svelte/icons/image';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import { ViewMode } from '$lib/utils';

	let { 
		content = { src: '', alt: 'Image', caption: '' }, 
		viewMode = ViewMode.VIEW, 
		onUpdate = () => {} 
	} = $props();
	let fileInput = $state<HTMLInputElement>();

	// Local state for editing
	let src = $state(content.src || '');
	let alt = $state(content.alt || 'Image');
	let caption = $state(content.caption || '');

	// Initialize editing state when component loads or content changes
	$effect(() => {
		if (viewMode === ViewMode.EDIT) {
			src = content.src || '';
			alt = content.alt || 'Image';
			caption = content.caption || '';
		}
	});

	function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file && file.type.startsWith('image/')) {
			const reader = new FileReader();
			reader.onload = (e) => {
				src = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	function saveChanges() {
		const newContent = { src, alt, caption };
		content = newContent;
		onUpdate(newContent);
	}
</script>

<div class="flex w-full flex-col gap-4">
	{#if viewMode === ViewMode.EDIT}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<ImageIcon class="h-4 w-4" />
					Edit Image
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="space-y-2">
					<Label for="image-src">Image URL</Label>
					<Input id="image-src" bind:value={src} onblur={saveChanges} placeholder="Enter image URL or upload file" />
				</div>

				<div class="space-y-2">
					<Label for="image-upload">Or upload image</Label>
					<div class="flex items-center gap-2">
						<input
							bind:this={fileInput}
							id="image-upload"
							type="file"
							accept="image/*"
							onchange={handleFileUpload}
							class="hidden"
						/>
						<Button
							variant="outline"
							onclick={() => fileInput?.click()}
							class="flex items-center gap-2"
						>
							<UploadIcon class="h-4 w-4" />
							Choose File
						</Button>
					</div>
				</div>

				<div class="space-y-2">
					<Label for="image-alt">Alt Text</Label>
					<Input id="image-alt" bind:value={alt} onblur={saveChanges} placeholder="Describe the image" />
				</div>

				<div class="space-y-2">
					<Label for="image-caption">Caption (optional)</Label>
					<Input id="image-caption" bind:value={caption} onblur={saveChanges} placeholder="Image caption" />
				</div>
			</Card.Content>
		</Card.Root>
	{:else}
		{#if content.src}
			<figure class="space-y-2">
				<img
					src={content.src}
					alt={content.alt}
					class="w-full rounded-lg border object-cover"
					style="max-height: 400px;"
				/>
				{#if content.caption}
					<figcaption class="text-muted-foreground text-center text-sm">
						{content.caption}
					</figcaption>
				{/if}
			</figure>
		{:else}
			<div class="flex h-48 w-full items-center justify-center rounded-lg border border-dashed">
				<div class="text-center">
					<ImageIcon class="text-muted-foreground mx-auto h-12 w-12" />
					<p class="text-muted-foreground mt-2 text-sm">No image selected</p>
					<p class="text-muted-foreground text-xs">Switch to edit mode to add an image</p>
				</div>
			</div>
		{/if}
	{/if}
</div>
