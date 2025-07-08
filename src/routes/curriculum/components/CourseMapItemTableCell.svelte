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

	export let item: CourseMapItem;
	export let isStart: boolean = true; // Whether this is the start week of the item
	export let weekLength: number = 1; // How many weeks this item spans in this cell
	export let onCourseMapItemClick: (item: CourseMapItem) => void;

	let showDeleteDialog = false;
	let isDeleting = false;

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
		class="absolute inset-0.5 bg-primary text-primary-foreground rounded-sm border border-primary/20 group cursor-pointer overflow-hidden shadow-sm"
		style="width: calc({weekLength * 100}% - 2px); z-index: 10;"
		onclick={handleItemClick}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Enter' && handleItemClick()}
	>
		<div class="relative h-full p-2 flex flex-col justify-between min-h-0">
			<!-- Title -->
			<div class="flex items-start justify-between gap-1 min-h-0">
				<h4 class="text-xs font-medium leading-tight truncate flex-1 min-w-0">
					{item.title}
				</h4>
				
				<DropdownMenu>
					<DropdownMenuTrigger>
						<Button 
							variant="ghost" 
							size="sm" 
							class="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-primary-foreground hover:bg-primary-foreground/20"
							onclick={(e) => e.stopPropagation()}
						>
							<MoreHorizontal class="h-3 w-3" />
							<span class="sr-only">Open menu</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onclick={handleEdit}>
							<Edit class="h-4 w-4 mr-2" />
							Edit
						</DropdownMenuItem>
						<DropdownMenuItem onclick={() => showDeleteDialog = true} class="text-destructive">
							<Trash2 class="h-4 w-4 mr-2" />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<!-- Content area - flexible based on available space -->
			<div class="flex-1 min-h-0 flex flex-col justify-center">
				<!-- Description (if short enough and there's space) -->
				{#if item.description && item.description.length < 25}
					<p class="text-[10px] opacity-80 truncate leading-tight">
						{item.description}
					</p>
				{/if}
			</div>

			<!-- Week range indicator -->
			<div class="text-[9px] opacity-70 font-medium">
				{item.lengthInWeeks}w
			</div>
		</div>
	</div>
{/if}
