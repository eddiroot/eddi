<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Card from '$lib/components/ui/card';
	import EditIcon from '@lucide/svelte/icons/edit';
	import FilmIcon from '@lucide/svelte/icons/film';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import PlayIcon from '@lucide/svelte/icons/play';

	let { src = '', caption = '', autoplay = false, controls = true, loop = false } = $props();
	let isEditing = $state(false);
	let fileInput = $state<HTMLInputElement>();

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
</script>

<div class="flex w-full flex-col gap-4">
	{#if isEditing}
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
					<Input id="video-caption" bind:value={caption} placeholder="Video caption" />
				</div>

				<div class="space-y-2">
					<Label>Video Options</Label>
					<div class="flex flex-col gap-2">
						<label class="flex items-center gap-2">
							<input type="checkbox" bind:checked={controls} />
							<span class="text-sm">Show controls</span>
						</label>
						<label class="flex items-center gap-2">
							<input type="checkbox" bind:checked={autoplay} />
							<span class="text-sm">Autoplay</span>
						</label>
						<label class="flex items-center gap-2">
							<input type="checkbox" bind:checked={loop} />
							<span class="text-sm">Loop</span>
						</label>
					</div>
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
					{#if isYouTubeUrl(src)}
						<div class="relative aspect-video w-full overflow-hidden rounded-lg border">
							<iframe
								src={getYouTubeEmbedUrl(src)}
								title="YouTube video"
								frameborder="0"
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowfullscreen
								class="h-full w-full"
							></iframe>
						</div>
					{:else}
						<video
							{src}
							{controls}
							{autoplay}
							{loop}
							class="w-full rounded-lg border"
							style="max-height: 400px;"
						>
							<track kind="captions" />
							Your browser does not support the video tag.
						</video>
					{/if}
					{#if caption}
						<figcaption class="text-muted-foreground text-center text-sm">{caption}</figcaption>
					{/if}
				</figure>
			{:else}
				<div class="flex h-48 w-full items-center justify-center rounded-lg border border-dashed">
					<div class="text-center">
						<FilmIcon class="text-muted-foreground mx-auto h-12 w-12" />
						<p class="text-muted-foreground mt-2 text-sm">No video selected</p>
						<p class="text-muted-foreground text-xs">Click edit to add a video</p>
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
