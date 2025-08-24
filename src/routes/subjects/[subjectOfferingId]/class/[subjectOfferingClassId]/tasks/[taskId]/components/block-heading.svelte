<script lang="ts">
	import { ViewMode, type HeadingBlockProps } from '$lib/schemas/taskSchema';

	let { initialConfig, onConfigUpdate, viewMode }: HeadingBlockProps = $props();

	let config = $state(initialConfig);

	// Do not remove. Updates config state when block order is changed.
	$effect(() => {
		config = initialConfig;
	});

	const getClassesBySize = (size: number): string => {
		const coreClasses =
			'h-auto w-full resize-none scroll-m-20 border-none bg-transparent p-0 shadow-none focus:ring-0 focus:outline-none tracking-tight ';
		switch (size) {
			case 1:
				return coreClasses + 'text-4xl font-extrabold lg:text-5xl';
			case 2:
				return coreClasses + 'text-3xl font-semibold';
			case 3:
				return coreClasses + 'text-2xl font-semibold';
			case 4:
				return coreClasses + 'text-xl font-semibold';
			case 5:
				return coreClasses + 'text-lg font-semibold';
			case 6:
				return coreClasses + 'text-base font-semibold';
			default:
				return coreClasses + '';
		}
	};
</script>

<div class="w-full">
	{#if viewMode === ViewMode.CONFIGURE}
		<input
			bind:value={config.text}
			onkeydown={(e) => {
				if (e.key === 'Enter') {
					onConfigUpdate(config);
				}
			}}
			onblur={() => onConfigUpdate(config)}
			class={getClassesBySize(config.size)}
			placeholder="Enter heading text..."
		/>
	{:else if config.size === 1}
		<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">{config.text}</h1>
	{:else if config.size === 2}
		<h2 class="scroll-m-20 text-3xl font-semibold tracking-tight">{config.text}</h2>
	{:else if config.size === 3}
		<h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">{config.text}</h3>
	{:else if config.size === 4}
		<h4 class="scroll-m-20 text-xl font-semibold tracking-tight">{config.text}</h4>
	{:else if config.size === 5}
		<h5 class="scroll-m-20 text-lg font-semibold tracking-tight">{config.text}</h5>
	{:else if config.size === 6}
		<h6 class="scroll-m-20 text-base font-semibold tracking-tight">{config.text}</h6>
	{/if}
</div>
