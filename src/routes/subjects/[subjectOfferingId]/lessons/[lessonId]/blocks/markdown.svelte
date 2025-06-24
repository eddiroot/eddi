<script lang="ts">
	import { marked } from 'marked';
	import Button from '$lib/components/ui/button/button.svelte';
	import BoldIcon from '@lucide/svelte/icons/bold';
	import ItalicIcon from '@lucide/svelte/icons/italic';
	import UnderlineIcon from '@lucide/svelte/icons/underline';
	import StrikethroughIcon from '@lucide/svelte/icons/strikethrough';
	import ListIcon from '@lucide/svelte/icons/list';
	import OrderedListIcon from '@lucide/svelte/icons/list-ordered';

	let markdownContent = $state('');
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center gap-1">
		<Button size="icon" variant="outline">
			<BoldIcon />
		</Button>
		<Button size="icon" variant="outline">
			<ItalicIcon />
		</Button>
		<Button size="icon" variant="outline">
			<UnderlineIcon />
		</Button>
		<Button size="icon" variant="outline">
			<StrikethroughIcon />
		</Button>
		<div class="bg-border mx-2 h-6 w-px"></div>
		<Button size="icon" variant="outline">
			<ListIcon />
		</Button>
		<Button size="icon" variant="outline">
			<OrderedListIcon />
		</Button>
	</div>
	<div>
		<div class="grid h-48 grid-cols-1 lg:grid-cols-2 lg:gap-4">
			<!-- Editor Section -->
			<div>
				<p class="text-muted-foreground text-sm font-medium">Editor</p>
				<div class="h-full pt-2">
					<div
						contenteditable
						bind:innerText={markdownContent}
						class="bg-background border-input focus:ring-ring h-full w-full resize-none overflow-auto rounded-md border p-3 font-mono text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
						placeholder="Start typing your markdown..."
					>
						{markdownContent}
					</div>
				</div>
			</div>

			<!-- Preview Section -->
			<div>
				<p class="text-muted-foreground text-sm font-medium">Preview</p>
				<div class="h-full pt-2">
					<div
						class="bg-muted/20 border-input prose prose-sm h-full w-full max-w-none overflow-auto rounded-md border p-3 text-sm"
					>
						{@html marked.parse(markdownContent)}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
