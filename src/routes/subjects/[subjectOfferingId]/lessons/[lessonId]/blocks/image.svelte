<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Card from '$lib/components/ui/card';
	import EditIcon from '@lucide/svelte/icons/edit';
	import ImageIcon from '@lucide/svelte/icons/image';
	import UploadIcon from '@lucide/svelte/icons/upload';

	let { src = '', alt = 'Image', caption = '' } = $props();
	let isEditing = $state(false);
	let fileInput = $state<HTMLInputElement>();

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
</script>

<div class="flex w-full flex-col gap-4">
	{#if isEditing}
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
					<Input id="image-src" bind:value={src} placeholder="Enter image URL or upload file" />
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
					<Input id="image-alt" bind:value={alt} placeholder="Describe the image" />
				</div>

				<div class="space-y-2">
					<Label for="image-caption">Caption (optional)</Label>
					<Input id="image-caption" bind:value={caption} placeholder="Image caption" />
				</div>

				<div class="flex gap-2">
					<Button onclick={() => (isEditing = false)}>Save</Button>
					<Button variant="outline" onclick={() => (isEditing = false)}>Cancel</Button>
				</div>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="group relative">
			{#if src}
				<figure class="space-y-2">
					<img
						{src}
						{alt}
						class="w-full rounded-lg border object-cover"
						style="max-height: 400px;"
					/>
					{#if caption}
						<figcaption class="text-muted-foreground text-center text-sm">{caption}</figcaption>
					{/if}
				</figure>
			{:else}
				<div class="flex h-48 w-full items-center justify-center rounded-lg border border-dashed">
					<div class="text-center">
						<ImageIcon class="text-muted-foreground mx-auto h-12 w-12" />
						<p class="text-muted-foreground mt-2 text-sm">No image selected</p>
						<p class="text-muted-foreground text-xs">Click edit to add an image</p>
					</div>
				</div>
			{/if}

			<Button
				variant="outline"
				size="sm"
				onclick={() => (isEditing = true)}
				class="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
			>
				<EditIcon class="h-3 w-3" />
			</Button>
		</div>
	{/if}
</div>
