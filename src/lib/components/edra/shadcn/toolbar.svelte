<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import { commands } from '../commands/commands.js';
	import EdraToolBarIcon from './components/EdraToolBarIcon.svelte';
	import QuickColor from './components/QuickColor.svelte';
	import FontSize from './components/FontSize.svelte';
	import SearchAndReplace from './components/SearchAndReplace.svelte';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	interface Props {
		class?: string;
		editor: Editor;
		excludedCommands?: string[];
		children?: Snippet<[]>;
	}

	const defaultExcludedCommands = ['colors', 'fonts'];

	const {
		class: className = '',
		editor,
		children,
		excludedCommands = defaultExcludedCommands
	}: Props = $props();
</script>

<div
	class={cn(
		'edra-toolbar flex h-fit w-fit items-center gap-1 overflow-x-auto overflow-y-hidden border-b',
		className
	)}
>
	{#if children}
		{@render children()}
	{:else}
		{#each Object.keys(commands).filter((key) => !excludedCommands.includes(key)) as keys}
			{@const groups = commands[keys].commands}
			{#each groups as command}
				<EdraToolBarIcon {command} {editor} />
			{/each}
		{/each}
		<FontSize {editor} />
		<QuickColor {editor} />
		<SearchAndReplace {editor} />
	{/if}
</div>
