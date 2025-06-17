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
			<h1 class="text-2xl font-bold">{text}</h1>
		{:else if headingSize === 2}
			<h2 class="text-xl font-semibold">{text}</h2>
		{:else if headingSize === 3}
			<h3 class="text-lg font-medium">{text}</h3>
		{:else if headingSize === 4}
			<h4 class="text-base font-normal">{text}</h4>
		{:else if headingSize === 5}
			<h5 class="text-sm font-light">{text}</h5>
		{:else}
			<h6 class="text-xs font-thin">{text}</h6>
		{/if}
	{/if}
</div>
