<script lang="ts">
	import type { Editor } from 'svelte-tiptap';
	import { onMount } from 'svelte';
	import { initiateEditor } from '../editor.js';

	import '../editor.css';
	import './style.css';
	import '../onedark.css';

	import 'katex/dist/katex.min.css';
	import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
	import CodeExtended from './components/CodeExtended.svelte';
	import { all, createLowlight } from 'lowlight';
	import { SvelteNodeViewRenderer } from 'svelte-tiptap';
	import { ImagePlaceholder } from '../extensions/image/ImagePlaceholder.js';
	import ImagePlaceholderComponent from './components/ImagePlaceholder.svelte';
	import { AudioPlaceholder } from '../extensions/audio/AudioPlaceholder.js';
	import AudioPlaceholderComponent from './components/AudioPlaceholder.svelte';
	import { VideoPlaceholder } from '../extensions/video/VideoPlaceholder.js';
	import VideoPlaceholderComponent from './components/VideoPlaceholder.svelte';
	import { ImageExtended } from '../extensions/image/ImageExtended.js';
	import { VideoExtended } from '../extensions/video/VideoExtended.js';
	import { AudioExtended } from '../extensions/audio/AudiExtended.js';
	import ImageExtendedComponent from './components/ImageExtended.svelte';
	import VideoExtendedComponent from './components/VideoExtended.svelte';
	import AudioExtendedComponent from './components/AudioExtended.svelte';
	import LinkMenu from './menus/link-menu.svelte';
	import TableColMenu from './menus/table-col-menu.svelte';
	import TableRowMenu from './menus/table-row-menu.svelte';
	import slashcommand from '../extensions/slash-command/slashcommand.js';
	import SlashCommandList from './components/SlashCommandList.svelte';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import { focusEditor, type EdraProps } from '../utils.js';
	import { cn } from '$lib/utils.js';
	import { IFramePlaceholder } from '../extensions/iframe/IFramePlaceholder.js';
	import IFramePlaceholderComponent from './components/IFramePlaceholder.svelte';
	import { IFrameExtended } from '../extensions/iframe/IFrameExtended.js';
	import IFrameExtendedComponent from './components/IFrameExtended.svelte';

	const lowlight = createLowlight(all);

	let {
		class: className = '',
		editorClass = '',
		content = undefined,
		limit = undefined,
		editable = true,
		editor = $bindable<Editor | undefined>(),
		showSlashCommands = true,
		showLinkBubbleMenu = true,
		showTableBubbleMenu = true,
		onUpdate,
		children
	}: EdraProps = $props();

	let element = $state<HTMLElement>();

	onMount(() => {
		editor = initiateEditor(
			element,
			content,
			limit,
			[
				CodeBlockLowlight.configure({
					lowlight
				}).extend({
					addNodeView() {
						return SvelteNodeViewRenderer(CodeExtended);
					}
				}),
				AudioPlaceholder(AudioPlaceholderComponent),
				ImagePlaceholder(ImagePlaceholderComponent),
				IFramePlaceholder(IFramePlaceholderComponent),
				IFrameExtended(IFrameExtendedComponent),
				VideoPlaceholder(VideoPlaceholderComponent),
				ImageExtended(ImageExtendedComponent),
				VideoExtended(VideoExtendedComponent),
				AudioExtended(AudioExtendedComponent),
				...(showSlashCommands ? [slashcommand(SlashCommandList)] : [])
			],
			{
				editable,
				onUpdate,
				onTransaction(props) {
					editor = undefined;
					editor = props.editor;
				}
			}
		);
		return () => editor?.destroy();
	});
</script>

<div class={cn('edra', className)}>
	{@render children?.()}
	{#if editor}
		{#if showLinkBubbleMenu}
			<LinkMenu editor={editor as Editor} />
		{/if}
		{#if showTableBubbleMenu}
			<TableColMenu editor={editor as Editor} />
			<TableRowMenu editor={editor as Editor} />
		{/if}
	{/if}
	{#if !editor}
		<div class="flex size-full items-center justify-center gap-4 text-xl">
			<LoaderCircle class="animate-spin" /> Loading...
		</div>
	{/if}
	<div
		bind:this={element}
		role="button"
		tabindex="0"
		onclick={(event) => focusEditor(editor, event)}
		onkeydown={(event) => {
			if (event.key === 'Enter' || event.key === ' ') {
				focusEditor(editor, event);
			}
		}}
		class={cn(
			'edra-editor prose dark:prose-invert h-full min-w-full cursor-auto px-2 py-2 *:outline-none',
			editorClass
		)}
	></div>
</div>
