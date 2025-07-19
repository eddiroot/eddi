<script lang="ts">
	import { untrack } from 'svelte';
	import type { Content, Editor } from '@tiptap/core';
	import EdraEditor from '$lib/components/edra/shadcn/editor.svelte';
	import EdraToolbar from '$lib/components/edra/shadcn/toolbar.svelte';
	import { ViewMode } from '$lib/utils';

	let { 
		initialContent = '', 
		viewMode = ViewMode.VIEW, 
		onUpdate 
	} = $props();

	let content = $state<Content>(initialContent);
	let editor = $state<Editor>();

	function onUpdateHandler() {
		if (editor && !editor.isDestroyed) {
			content = editor.getJSON() || null;
			onUpdate(content);
		}
	}

	$effect(() => {
		viewMode;
		untrack(() => {
			if (editor && !editor.isDestroyed) {
				editor.setEditable(viewMode === ViewMode.EDIT);
			}
		});
	});
</script>

<div class="z-50 w-full {viewMode === ViewMode.EDIT ? 'rounded-md border' : ''}">
	{#if editor && !editor.isDestroyed && viewMode === ViewMode.EDIT}
		<EdraToolbar
			class="bg-background flex w-full items-center overflow-x-auto rounded-t-md border-b p-0.5"
			excludedCommands={['colors', 'fonts', 'headings', 'media']}
			{editor}
		/>
	{/if}
	<EdraEditor
		bind:editor
		{content}
		class={viewMode === ViewMode.EDIT ? 'h-[30rem] pr-4 pl-4 overflow-y-scroll' : 'h-min overflow-y-scroll'}
		editorClass={viewMode === ViewMode.EDIT ? '' : 'px-0 py-0'}
		onUpdate={onUpdateHandler}
		showSlashCommands={false}
	/>
</div>
