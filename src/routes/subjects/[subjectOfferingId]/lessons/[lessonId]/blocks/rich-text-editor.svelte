<script lang="ts">
	import { untrack } from 'svelte';
	import type { Content, Editor } from '@tiptap/core';
	import EdraEditor from '$lib/components/edra/shadcn/editor.svelte';
	import EdraToolbar from '$lib/components/edra/shadcn/toolbar.svelte';

	let { initialContent = '', isEditMode = true, onUpdate } = $props();

	let content = $state<Content>(initialContent);
	let editor = $state<Editor>();

	function onUpdateHandler() {
		content = editor?.getJSON() || null;
		onUpdate(content);
	}

	$effect(() => {
		isEditMode;
		untrack(() => {
			editor?.setEditable(isEditMode);
		});
	});
</script>

<div class="z-50 size-full max-w-5xl rounded-md {isEditMode ? 'border border-dashed' : ''}">
	{#if editor && !editor.isDestroyed && isEditMode}
		<EdraToolbar
			class="bg-secondary/50 flex w-full items-center overflow-x-auto border-b border-dashed p-0.5"
			excludedCommands={['colors', 'fonts', 'headings', 'media']}
			{editor}
		/>
	{/if}
	<EdraEditor
		bind:editor
		{content}
		class="h-[30rem] max-h-screen overflow-y-scroll pr-2 pl-6"
		onUpdate={onUpdateHandler}
		showSlashCommands={false}
	/>
</div>
