<script>
	import { Button } from '$lib/components/ui/button/index.js';
	import EditIcon from '@lucide/svelte/icons/edit';
	import Input from '$lib/components/ui/input/input.svelte';

	let { headingSize = 1, text = 'Heading goes here' } = $props();
	let isEditing = $state(false);
</script>

<div class="flex items-center gap-2">
	{#if isEditing}
		<Input bind:value={text} />
		<Button onclick={() => (isEditing = false)}>Save</Button>
	{:else}
		<Button variant="outline" onclick={() => (isEditing = true)}>
			<EditIcon class="h-3 w-3" />
		</Button>
		{#if headingSize === 1}
			<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">{text}</h1>
		{:else if headingSize === 2}
			<h2 class="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">{text}</h2>
		{:else if headingSize === 3}
			<h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">{text}</h3>
		{:else if headingSize === 4}
			<h4 class="scroll-m-20 text-xl font-semibold tracking-tight">{text}</h4>
		{:else if headingSize === 5}
			<h5 class="text-sm font-light">{text}</h5>
		{:else}
			<h6 class="text-xs font-thin">{text}</h6>
		{/if}
	{/if}
</div>
