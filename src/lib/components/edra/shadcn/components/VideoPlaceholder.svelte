<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import type { NodeViewProps } from '@tiptap/core';
	import Video from '@lucide/svelte/icons/video';
	import X from '@lucide/svelte/icons/x';
	import { NodeViewWrapper } from 'svelte-tiptap';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	const { editor }: NodeViewProps = $props();

	/**
	 * Stores the video url
	 */
	let src = $state('');
</script>

<NodeViewWrapper class="my-2 w-full">
	<Popover.Root>
		<Popover.Trigger
			class={buttonVariants({
				variant: 'outline',
				class: 'bg-muted/50 h-fit w-full p-0'
			})}
			disabled={!editor.isEditable}
		>
			<div contenteditable="false" class="flex w-full items-center justify-start p-4">
				<Video class="mr-2" />
				<span>Insert an Video</span>
			</div>
		</Popover.Trigger>
		<Popover.Content class="bg-popover shadow-lg *:my-2">
			<div class="flex items-center justify-between">
				<h1 class="text-xl font-bold">Video</h1>
				<Popover.Close>
					<X class="text-muted-foreground size-4" />
				</Popover.Close>
			</div>
			<p>Insert Video url</p>
			<Input placeholder="Enter video url..." type="url" bind:value={src} class="w-full" />
			<p class="font-bold">OR</p>
			<p>Pick a Video</p>
			<Input
				id="picture"
				type="file"
				accept="video/*"
				multiple={false}
				onchange={(e: Event) => {
					const target = e.target as HTMLInputElement;
					if (target && target.files) {
						const files = Array.from(target.files || []);
						files.map((file) => {
							const reader = new FileReader();
							reader.onload = () => {
								src = reader.result as string;
							};
							reader.readAsDataURL(file);
						});
					}
				}}
			/>
			{#if src.trim() !== ''}
				<video {src} controls class="h-fit w-fit">
					<track kind="captions" />
				</video>
				<Button onclick={() => editor.chain().focus().setVideo(src).run()}>Add Video</Button>
			{/if}
		</Popover.Content>
	</Popover.Root>
</NodeViewWrapper>
