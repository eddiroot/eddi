<script lang="ts">
	import { marked } from 'marked';

	let { content = '', onUpdate = () => {} } = $props();
	let markdownContent = $state(content);

	// Debounce function to avoid too many API calls
	let debounceTimer: ReturnType<typeof setTimeout>;
	function debounceUpdate(newContent: string) {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			onUpdate(newContent);
		}, 1000);
	}

	// Update content when markdownContent changes
	$effect(() => {
		if (markdownContent !== content) {
			debounceUpdate(markdownContent);
		}
	});
</script>

<div class="flex h-80 flex-col space-y-4">
	<div class="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2 lg:gap-4">
		<!-- Editor Section -->
		<div class="flex flex-col">
			<p class="text-muted-foreground mb-2 text-sm font-medium">Editor</p>
			<textarea
				bind:value={markdownContent}
				class="bg-background border-input focus:ring-ring w-full flex-1 resize-none overflow-auto rounded-md border p-3 font-mono text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
				placeholder="Start typing your markdown..."
			></textarea>
		</div>

		<!-- Preview Section -->
		<div class="flex flex-col">
			<p class="text-muted-foreground mb-2 text-sm font-medium">Preview</p>
			<div
				class="bg-background border-input prose prose-sm w-full max-w-none flex-1 overflow-auto rounded-md border p-3 text-sm"
			>
				{@html marked.parse(markdownContent)}
			</div>
		</div>
	</div>
</div>
