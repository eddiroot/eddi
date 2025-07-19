<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Card from '$lib/components/ui/card';
	import EditIcon from '@lucide/svelte/icons/edit';
	import FilmIcon from '@lucide/svelte/icons/film';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import { ViewMode } from '$lib/utils';
	import { vi } from 'zod/v4/locales';

	let {
		content = { src: '', caption: '', autoplay: false, controls: true, loop: false },
		viewMode = ViewMode.VIEW,
		onUpdate = () => {}
	} = $props();
	let fileInput = $state<HTMLInputElement>();

	// Local state for editing
	let src = $state(content.src || '');
	let caption = $state(content.caption || '');
	let autoplay = $state(content.autoplay || false);
	let controls = $state(content.controls !== false);
	let loop = $state(content.loop || false);

	// Initialize editing state when component loads or content changes
	$effect(() => {
		if (viewMode === ViewMode.EDIT) {
			src = content.src || '';
			caption = content.caption || '';
			autoplay = content.autoplay || false;
			controls = content.controls !== false;
			loop = content.loop || false;
		}
	});

	function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file && file.type.startsWith('video/')) {
			const reader = new FileReader();
			reader.onload = (e) => {
				src = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	function isYouTubeUrl(url: string) {
		return url.includes('youtube.com') || url.includes('youtu.be');
	}

	function getYouTubeEmbedUrl(url: string) {
		const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
		const match = url.match(regex);
		return match ? `https://www.youtube.com/embed/${match[1]}` : url;
	}

	function saveChanges() {
		const newContent = { src, caption, autoplay, controls, loop };
		content = newContent;
		onUpdate(newContent);
	}
</script>

<div class="flex w-full flex-col gap-4">
	{#if viewMode === ViewMode.EDIT}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<FilmIcon class="h-4 w-4" />
					Edit Video
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="space-y-2">
					<Label for="video-src">Video URL</Label>
					<Input
						id="video-src"
						bind:value={src}
						onblur={saveChanges}
						placeholder="Enter video URL (YouTube, Vimeo, or direct link)"
					/>
				</div>

				<div class="space-y-2">
					<Label for="video-upload">Or upload video</Label>
					<div class="flex items-center gap-2">
						<input
							bind:this={fileInput}
							id="video-upload"
							type="file"
							accept="video/*"
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
					<Label for="video-caption">Caption (optional)</Label>
					<Input id="video-caption" bind:value={caption} onblur={saveChanges} placeholder="Video caption" />
				</div>

				<div class="space-y-2">
					<Label>Video Options</Label>
					<div class="flex flex-col gap-2">
						<label class="flex items-center gap-2">
							<input type="checkbox" bind:checked={controls} onchange={saveChanges} />
							<span class="text-sm">Show controls</span>
						</label>
						<label class="flex items-center gap-2">
							<input type="checkbox" bind:checked={autoplay} onchange={saveChanges} />
							<span class="text-sm">Autoplay</span>
						</label>
						<label class="flex items-center gap-2">
							<input type="checkbox" bind:checked={loop} onchange={saveChanges} />
							<span class="text-sm">Loop</span>
						</label>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	{:else}
		{#if content.src}
			<figure class="space-y-2">
				{#if isYouTubeUrl(content.src)}
					<div class="relative aspect-video w-full overflow-hidden rounded-lg border">
						<iframe
							src={getYouTubeEmbedUrl(content.src)}
							title="YouTube video"
							frameborder="0"
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowfullscreen
							class="h-full w-full"
						></iframe>
					</div>
				{:else}
					<video
						src={content.src}
						controls={content.controls}
						autoplay={content.autoplay}
						loop={content.loop}
						class="w-full rounded-lg border"
						style="max-height: 400px;"
					>
						<track kind="captions" />
						Your browser does not support the video tag.
					</video>
				{/if}
				{#if content.caption}
					<figcaption class="text-muted-foreground text-center text-sm">
						{content.caption}
					</figcaption>
				{/if}
			</figure>
		{:else}
			<div class="flex h-48 w-full items-center justify-center rounded-lg border border-dashed">
				<div class="text-center">
					<FilmIcon class="text-muted-foreground mx-auto h-12 w-12" />
					<p class="text-muted-foreground mt-2 text-sm">No video selected</p>
					<p class="text-muted-foreground text-xs">Switch to edit mode to add a video</p>
				</div>
			</div>
		{/if}
	{/if}
</div>
