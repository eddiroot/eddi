<script lang='ts'>
	import Input from '$lib/components/ui/input/input.svelte';
	import { ViewMode } from '$lib/utils';

	let { 
		headingSize = 1, 
		text = 'Heading goes here', 
		viewMode = ViewMode.VIEW,
		onUpdate 
	}: {
		headingSize: number;
		text: string;
		viewMode: ViewMode;
		onUpdate: (text: string) => void;
	} = $props();
	let editText = $state(text);

	function saveText() {
		text = editText;
		onUpdate(text);
	}

	// Update editText when text prop changes
	$effect(() => {
		editText = text;
	});
</script>

<div class="w-full">
	{#if viewMode === ViewMode.EDIT}
		{#if headingSize === 1}
			<input
				bind:value={editText}
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						saveText();
					}
				}}
				onblur={saveText}
				class="w-full scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl border-none shadow-none p-0 h-auto bg-transparent focus:outline-none focus:ring-0 resize-none"
				placeholder="Enter heading text..."
			/>
		{:else if headingSize === 2}
			<input
				bind:value={editText}
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						saveText();
					}
				}}
				onblur={saveText}
				class="w-full scroll-m-20 text-3xl font-semibold tracking-tight border-none shadow-none p-0 h-auto bg-transparent focus:outline-none focus:ring-0 resize-none"
				placeholder="Enter heading text..."
			/>
		{:else if headingSize === 3}
			<input
				bind:value={editText}
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						saveText();
					}
				}}
				onblur={saveText}
				class="w-full scroll-m-20 text-2xl font-semibold tracking-tight border-none shadow-none p-0 h-auto bg-transparent focus:outline-none focus:ring-0 resize-none"
				placeholder="Enter heading text..."
			/>
		{:else if headingSize === 4}
			<input
				bind:value={editText}
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						saveText();
					}
				}}
				onblur={saveText}
				class="w-full scroll-m-20 text-xl font-semibold tracking-tight border-none shadow-none p-0 h-auto bg-transparent focus:outline-none focus:ring-0 resize-none"
				placeholder="Enter heading text..."
			/>
		{:else if headingSize === 5}
			<input
				bind:value={editText}
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						saveText();
					}
				}}
				onblur={saveText}
				class="w-full scroll-m-20 text-lg font-semibold tracking-tight border-none shadow-none p-0 h-auto bg-transparent focus:outline-none focus:ring-0 resize-none"
				placeholder="Enter heading text..."
			/>
		{:else}
			<input
				bind:value={editText}
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						saveText();
					}
				}}
				onblur={saveText}
				class="w-full scroll-m-20 text-base font-semibold tracking-tight border-none shadow-none p-0 h-auto bg-transparent focus:outline-none focus:ring-0 resize-none"
				placeholder="Enter heading text..."
			/>
		{/if}
	{:else }
		{#if headingSize === 1}
			<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">{text}</h1>
		{:else if headingSize === 2}
			<h2 class="scroll-m-20 text-3xl font-semibold tracking-tight">{text}</h2>
		{:else if headingSize === 3}
			<h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">{text}</h3>
		{:else if headingSize === 4}
			<h4 class="scroll-m-20 text-xl font-semibold tracking-tight">{text}</h4>
		{:else if headingSize === 5}
			<h5 class="scroll-m-20 text-lg font-semibold tracking-tight">{text}</h5>
		{:else}
			<h6 class="scroll-m-20 text-base font-semibold tracking-tight">{text}</h6>
		{/if}
		
	{/if}
</div>
