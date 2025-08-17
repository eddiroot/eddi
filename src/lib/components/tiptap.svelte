<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import { cn } from '$lib/utils.js';
	import StarterKit from '@tiptap/starter-kit';
	import { Button } from '$lib/components/ui/button';
	import {
		BoldIcon,
		ItalicIcon,
		CodeIcon,
		QuoteIcon,
		PilcrowIcon,
		ListIcon,
		ListOrderedIcon
	} from '@lucide/svelte';

	let {
		content,
		isEditable,
		onUpdate,
		class: className
	}: {
		content: string;
		isEditable: boolean;
		onUpdate: (content: string) => void;
		class?: string;
	} = $props();

	let element: HTMLDivElement;
	let editorBox = $state.raw<{ current: Editor }>();

	onMount(() => {
		editorBox = {
			current: new Editor({
				element,
				extensions: [StarterKit],
				content,
				editable: isEditable,
				onTransaction: () => {
					editorBox = { current: editorBox!.current };
				},
				onUpdate: ({ editor }) => {
					onUpdate(editor.getHTML());
				},
				editorProps: {
					attributes: {
						class: cn(className, 'p-6 prose dark:prose-invert focus:outline-none min-h-32')
					}
				}
			})
		};
	});

	onDestroy(() => {
		if (editorBox?.current) {
			editorBox.current.destroy();
		}
	});

	// Do not remove
	// This is necessary to ensure that the editor is editable when the `isEditable` prop changes
	$effect(() => {
		if (isEditable && editorBox?.current) {
			editorBox.current.setEditable(true);
		} else if (editorBox?.current) {
			editorBox.current.setEditable(false);
		}
	});
</script>

<div class="rounded-md border">
	{#if editorBox?.current && isEditable}
		<div class="flex items-center gap-x-1 border-b px-6 py-4">
			<Button
				onclick={() => editorBox?.current.chain().focus().setParagraph().run()}
				variant={editorBox.current.isActive('paragraph') ? 'default' : 'ghost'}
			>
				<PilcrowIcon />
			</Button>
			<Button
				onclick={() => editorBox?.current.chain().focus().toggleBold().run()}
				variant={editorBox.current.isActive('bold') ? 'default' : 'ghost'}
			>
				<BoldIcon />
			</Button>
			<Button
				onclick={() => editorBox?.current.chain().focus().toggleItalic().run()}
				variant={editorBox.current.isActive('italic') ? 'default' : 'ghost'}
			>
				<ItalicIcon />
			</Button>
			<Button
				onclick={() => editorBox?.current.chain().focus().toggleCodeBlock().run()}
				variant={editorBox.current.isActive('codeBlock') ? 'default' : 'ghost'}
			>
				<CodeIcon />
			</Button>
			<Button
				onclick={() => editorBox?.current.chain().focus().toggleBlockquote().run()}
				variant={editorBox.current.isActive('blockquote') ? 'default' : 'ghost'}
			>
				<QuoteIcon />
			</Button>
			<Button
				onclick={() => editorBox?.current.chain().focus().toggleBulletList().run()}
				variant={editorBox.current.isActive('bulletList') ? 'default' : 'ghost'}
			>
				<ListIcon />
			</Button>
			<Button
				onclick={() => editorBox?.current.chain().focus().toggleOrderedList().run()}
				variant={editorBox.current.isActive('orderedList') ? 'default' : 'ghost'}
			>
				<ListOrderedIcon />
			</Button>
		</div>
	{/if}

	<div bind:this={element}></div>
</div>
