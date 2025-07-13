<script lang="ts">
	import type { CourseMapItem } from '$lib/server/db/schema';

	let {
		item,
		isStart = true,
		weekLength = 1,
		onCourseMapItemClick
	}: {
		item: CourseMapItem;
		isStart?: boolean;
		weekLength?: number;
		onCourseMapItemClick: (item: CourseMapItem) => void;
	} = $props();

	// Use Svelte 5 $derived for reactive computations
	let itemColor = $derived(item.color || '#3B82F6');
	let itemKey = $derived(`${item.id}-${item.color}-${item.topic}`);

	let showDeleteDialog = $state(false);
	let isDeleting = $state(false);

	function handleItemClick() {
		onCourseMapItemClick(item);
	}

	function handleEdit() {
		onCourseMapItemClick(item);
	}
</script>

{#if isStart}
	<!-- Only render the item widget at the start week -->
	<div
		class="border-opacity-20 group absolute inset-0.5 cursor-pointer overflow-hidden rounded-sm border text-white shadow-sm"
		style="background-color: {itemColor}; border-color: {itemColor}; width: calc({weekLength *
			100}% - 2px); z-index: 10;"
		onclick={handleItemClick}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Enter' && handleItemClick()}
	>
		<div class="relative flex h-full min-h-0 flex-col items-center justify-center p-2 text-center">
			<!-- Title - centered and larger -->
			<div class="flex w-full items-center justify-center">
				<h4 class="flex-1 text-center text-sm leading-tight font-semibold">
					{item.topic}
				</h4>
			</div>

			<!-- Week range indicator - bottom right -->
			<div class="absolute right-1 bottom-1 text-xs font-medium opacity-70">
				{item.duration || 1}w
			</div>
		</div>
	</div>
{/if}
