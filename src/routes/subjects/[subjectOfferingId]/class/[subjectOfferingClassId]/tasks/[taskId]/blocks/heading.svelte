<script lang="ts">
	import { ViewMode } from '../constants';

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
				class="h-auto w-full resize-none scroll-m-20 border-none bg-transparent p-0 text-4xl font-extrabold tracking-tight shadow-none focus:ring-0 focus:outline-none lg:text-5xl"
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
				class="h-auto w-full resize-none scroll-m-20 border-none bg-transparent p-0 text-3xl font-semibold tracking-tight shadow-none focus:ring-0 focus:outline-none"
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
				class="h-auto w-full resize-none scroll-m-20 border-none bg-transparent p-0 text-2xl font-semibold tracking-tight shadow-none focus:ring-0 focus:outline-none"
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
				class="h-auto w-full resize-none scroll-m-20 border-none bg-transparent p-0 text-xl font-semibold tracking-tight shadow-none focus:ring-0 focus:outline-none"
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
				class="h-auto w-full resize-none scroll-m-20 border-none bg-transparent p-0 text-lg font-semibold tracking-tight shadow-none focus:ring-0 focus:outline-none"
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
				class="h-auto w-full resize-none scroll-m-20 border-none bg-transparent p-0 text-base font-semibold tracking-tight shadow-none focus:ring-0 focus:outline-none"
				placeholder="Enter heading text..."
			/>
		{/if}
	{:else if headingSize === 1}
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
</div>
