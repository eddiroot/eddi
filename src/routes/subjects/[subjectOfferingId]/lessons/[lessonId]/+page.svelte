<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';

	let items = $state<{ id: string }[]>([]);

	function handleDrop(state: DragDropState<{ id: string }>) {
		const { draggedItem, sourceContainer, targetContainer } = state;
		if (!targetContainer || sourceContainer === targetContainer) return;
		items = items.filter((item) => item !== draggedItem);
		items = [...items, draggedItem];
	}

	function handleDragEnter(state: DragDropState<{ id: string }>) {}
	function handleDragLeave(state: DragDropState<{ id: string }>) {}
</script>

<div class="grid h-full grid-cols-[1fr_300px]">
	<div
		class="flex h-full flex-col border"
		use:droppable={{
			container: 'blocksColumn',
			callbacks: { onDrop: handleDrop, onDragEnter: handleDragEnter, onDragLeave: handleDragLeave }
		}}
	>
		{#each items as item}
			<div class="border-b p-4 last:border-b-0">
				{item.id}
			</div>
		{/each}
	</div>
	<div class="grid grid-cols-2 grid-rows-12 gap-2 p-4">
		<div
			class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
			use:draggable={{ container: 'blockSelectionMenu', dragData: { id: 'h1' } }}
		>
			h1
		</div>
		<div
			class={`aspect-square h-full w-full ${buttonVariants({ variant: 'outline' })}`}
			use:draggable={{ container: 'blockSelectionMenu', dragData: { id: 'h2' } }}
		>
			h2
		</div>
	</div>
</div>
