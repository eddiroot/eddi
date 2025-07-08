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

<div class="z-50 w-full rounded-md {isEditMode ? 'border' : ''}">
	{#if editor && !editor.isDestroyed && isEditMode}
		<EdraToolbar
			class="bg-background flex w-full items-center overflow-x-auto rounded-t-md border-b p-0.5"
			excludedCommands={['colors', 'fonts', 'headings', 'media']}
			{editor}
		/>
	{/if}
	<EdraEditor
		bind:editor
		{content}
		class="{isEditMode ? 'h-[30rem] pr-4 pl-4' : 'h-min'} overflow-y-scroll"
		editorClass={isEditMode ? '' : 'px-0 py-0'}
		onUpdate={onUpdateHandler}
		showSlashCommands={false}
	/>
</div>
