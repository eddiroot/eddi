<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Card from '$lib/components/ui/card';
	import AudioLinesIcon from '@lucide/svelte/icons/audio-lines';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import PlayIcon from '@lucide/svelte/icons/play';
	import PauseIcon from '@lucide/svelte/icons/pause';
	import VolumeXIcon from '@lucide/svelte/icons/volume-x';
	import Volume2Icon from '@lucide/svelte/icons/volume-2';
	import { ViewMode } from '$lib/utils';

	let {
		content = { src: '', caption: '', autoplay: false, controls: true, loop: false },
		viewMode = ViewMode.VIEW,
		onUpdate = () => {}
	} = $props();
	let fileInput = $state<HTMLInputElement>();
	let audioElement = $state<HTMLAudioElement>();
	let isPlaying = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let volume = $state(1);
	let isMuted = $state(false);

	// Local state for editing
	let src = $state(content.src || '');
	let caption = $state(content.caption || '');
	let autoplay = $state(content.autoplay || false);
	let controls = $state(content.controls !== false);
	let loop = $state(content.loop || false);

	// Initialize editing state when component loads or content changes
	$effect(() => {
		if (viewMode = ViewMode.EDIT) {
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
		if (file && file.type.startsWith('audio/')) {
			const reader = new FileReader();
			reader.onload = (e) => {
				src = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	function saveChanges() {
		const newContent = { src, caption, autoplay, controls, loop };
		content = newContent;
		onUpdate(newContent);
	}

	function togglePlay() {
		if (!audioElement) return;

		if (isPlaying) {
			audioElement.pause();
		} else {
			audioElement.play();
		}
		isPlaying = !isPlaying;
	}

	function toggleMute() {
		if (!audioElement) return;

		isMuted = !isMuted;
		audioElement.muted = isMuted;
	}

	function handleTimeUpdate() {
		if (audioElement) {
			currentTime = audioElement.currentTime;
		}
	}

	function handleLoadedMetadata() {
		if (audioElement) {
			duration = audioElement.duration;
		}
	}

	function handleVolumeChange() {
		if (audioElement) {
			audioElement.volume = volume;
		}
	}

	function seek(event: Event) {
		const target = event.target as HTMLInputElement;
		const seekTime = parseFloat(target.value);
		if (audioElement) {
			audioElement.currentTime = seekTime;
			currentTime = seekTime;
		}
	}

	function formatTime(time: number) {
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}
</script>

<div class="flex w-full flex-col gap-4">
	{#if viewMode === ViewMode.EDIT}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<AudioLinesIcon class="h-4 w-4" />
					Edit Audio
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="space-y-2">
					<Label for="audio-src">Audio URL</Label>
					<Input
						id="audio-src"
						bind:value={src}
						onblur={saveChanges}
						placeholder="Enter audio URL or upload file"
					/>
				</div>

				<div class="space-y-2">
					<Label for="audio-upload">Or upload audio</Label>
					<div class="flex items-center gap-2">
						<input
							bind:this={fileInput}
							id="audio-upload"
							type="file"
							accept="audio/*"
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
					<Label for="audio-caption">Caption (optional)</Label>
					<Input
						id="audio-caption"
						bind:value={caption}
						onblur={saveChanges}
						placeholder="Audio caption"
					/>
				</div>

				<div class="space-y-2">
					<Label>Audio Options</Label>
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
	{:else if content.src}
		<figure class="space-y-2">
			{#if content.controls}
				<!-- Custom Audio Player -->
				<div class="bg-card w-full rounded-lg border p-4">
					<audio
						bind:this={audioElement}
						src={content.src}
						autoplay={content.autoplay}
						loop={content.loop}
						ontimeupdate={handleTimeUpdate}
						onloadedmetadata={handleLoadedMetadata}
						onplay={() => (isPlaying = true)}
						onpause={() => (isPlaying = false)}
						class="hidden"
					>
						Your browser does not support the audio element.
					</audio>

					<div class="flex items-center gap-4">
						<Button variant="outline" size="sm" onclick={togglePlay} disabled={!content.src}>
							{#if isPlaying}
								<PauseIcon class="h-4 w-4" />
							{:else}
								<PlayIcon class="h-4 w-4" />
							{/if}
						</Button>

						<div class="flex flex-1 items-center gap-2">
							<span class="text-muted-foreground text-xs">
								{formatTime(currentTime)}
							</span>
							<input
								type="range"
								min="0"
								max={duration || 0}
								value={currentTime}
								oninput={seek}
								class="flex-1"
							/>
							<span class="text-muted-foreground text-xs">
								{formatTime(duration)}
							</span>
						</div>

						<div class="flex items-center gap-2">
							<Button variant="ghost" size="sm" onclick={toggleMute}>
								{#if isMuted}
									<VolumeXIcon class="h-4 w-4" />
								{:else}
									<Volume2Icon class="h-4 w-4" />
								{/if}
							</Button>
							<input
								type="range"
								min="0"
								max="1"
								step="0.1"
								bind:value={volume}
								oninput={handleVolumeChange}
								class="w-16"
							/>
						</div>
					</div>
				</div>
			{:else}
				<audio
					src={content.src}
					controls={content.controls}
					autoplay={content.autoplay}
					loop={content.loop}
					class="w-full"
				>
					Your browser does not support the audio element.
				</audio>
			{/if}

			{#if content.caption}
				<figcaption class="text-muted-foreground text-center text-sm">
					{content.caption}
				</figcaption>
			{/if}
		</figure>
	{:else}
		<div class="flex h-24 w-full items-center justify-center rounded-lg border border-dashed">
			<div class="text-center">
				<AudioLinesIcon class="text-muted-foreground mx-auto h-8 w-8" />
				<p class="text-muted-foreground mt-1 text-sm">No audio selected</p>
				<p class="text-muted-foreground text-xs">Switch to edit mode to add audio</p>
			</div>
		</div>
	{/if}
</div>
