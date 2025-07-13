<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '$lib/components/ui/dropdown-menu';
	import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import MoreHorizontal from 'lucide-svelte/icons/more-horizontal';
	import Edit from 'lucide-svelte/icons/edit';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import type { CourseMapItem } from '$lib/server/db/schema';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation'; 
	import { toast } from 'svelte-sonner';

	// Use Svelte 5 $props() for component props
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
		class="absolute inset-0.5 text-white rounded-sm border border-opacity-20 group cursor-pointer overflow-hidden shadow-sm"
		style="background-color: {itemColor}; border-color: {itemColor}; width: calc({weekLength * 100}% - 2px); z-index: 10;"
		onclick={handleItemClick}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Enter' && handleItemClick()}
	>
		<div class="relative h-full p-2 flex flex-col justify-center items-center text-center min-h-0">
			<!-- Title - centered and larger -->
			<div class="flex items-center justify-center w-full">
				<h4 class="text-sm font-semibold leading-tight text-center flex-1">
					{item.topic}
				</h4>
				
			</div>

			<!-- Week range indicator - bottom right -->
			<div class="text-xs opacity-70 font-medium absolute bottom-1 right-1">
				{item.duration || 1}w
			</div>
		</div>
	</div>
{/if}