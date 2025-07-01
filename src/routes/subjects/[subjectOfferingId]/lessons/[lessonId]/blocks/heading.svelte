<script>
	import { Button } from '$lib/components/ui/button/index.js';
	import EditIcon from '@lucide/svelte/icons/edit';
	import Input from '$lib/components/ui/input/input.svelte';

	let { headingSize = 1, text = 'Heading goes here', onUpdate } = $props();
	let isEditing = $state(false);
	let editText = $state(text);

	function saveText() {
		isEditing = false;
		text = editText;
		onUpdate(text);
	}
</script>

<div class="flex w-full items-center justify-between gap-2">
	{#if isEditing}
		<Input
			bind:value={editText}
			onkeydown={(e) => {
				if (e.key === 'Enter') {
					saveText();
				} else if (e.key === 'Escape') {
					isEditing = false;
					editText = text;
				}
			}}
		/>
		<Button onclick={saveText}>Save</Button>
	{:else}
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
			<h5 class="scroll-m-20 text-base font-semibold tracking-tight">{text}</h5>
		{/if}
		<Button
			variant="outline"
			onclick={() => {
				editText = text;
				isEditing = true;
			}}
		>
			<EditIcon />
		</Button>
	{/if}
</div>
