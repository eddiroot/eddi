<script lang="ts">
	import { marked } from 'marked';
	import { Textarea } from '$lib/components/ui/textarea';

	let { content = '', isEditMode = true, onUpdate } = $props();
	let editContent = $state(content);

	function saveContent() {
		onUpdate(editContent);
	}

	// Update editContent when content prop changes
	$effect(() => {
		editContent = content;
	});

	const renderedMarkdown = $derived(() => {
		try {
			return marked(editContent);
		} catch (error) {
			console.error('Error rendering markdown:', error);
			return '<p>Error rendering markdown</p>';
		}
	});
</script>

<div class="w-full">
	{#if isEditMode}
		<Textarea
			bind:value={editContent}
			onblur={saveContent}
			onkeydown={(e) => {
				if (e.key === 'Tab') {
					e.preventDefault();
					const target = e.target as HTMLTextAreaElement;
					const start = target.selectionStart;
					const end = target.selectionEnd;
					editContent = editContent.substring(0, start) + '\t' + editContent.substring(end);
					// Set cursor position after the tab
					setTimeout(() => {
						target.selectionStart = target.selectionEnd = start + 1;
					}, 0);
				}
			}}
			class="min-h-32 border-dashed"
			placeholder="Enter markdown content..."
		/>
	{:else}
		<div class="prose prose-sm max-w-none dark:prose-invert">
			{@html renderedMarkdown()}
		</div>
	{/if}
</div>
