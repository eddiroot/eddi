<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '$lib/components/ui/dropdown-menu';
	import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { MoreHorizontal, Edit, Trash2, Loader2 } from 'lucide-svelte';
	import EditCourseMapItemDialog from './EditCourseMapItemDialog.svelte';
	import type { CourseMapItem } from '$lib/server/db/schema';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	export let item: CourseMapItem;
	export let isStart: boolean = true; // Whether this is the start week of the item
	export let weekLength: number = 1; // How many weeks this item spans in this cell

	let showEditDialog = false;
	let showDeleteDialog = false;
	let isDeleting = false;

	function handleEdit() {
		showEditDialog = true;
	}
</script>

{#if isStart}
	<!-- Only render the item widget at the start week -->
	<div 
		class="absolute inset-0.5 bg-primary text-primary-foreground rounded-sm border border-primary/20 group cursor-pointer overflow-hidden shadow-sm"
		style="width: calc({weekLength * 100}% - 2px); z-index: 10;"
	>
		<div class="relative h-full p-2 flex flex-col justify-between min-h-0">
			<!-- Title -->
			<div class="flex items-start justify-between gap-1 min-h-0">
				<h4 class="text-xs font-medium leading-tight truncate flex-1 min-w-0">
					{item.title}
				</h4>
				
				<DropdownMenu>
					<DropdownMenuTrigger>
						<Button variant="ghost" size="sm" class="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-primary-foreground hover:bg-primary-foreground/20">
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

<!-- Edit Dialog -->
{#if showEditDialog}
	<EditCourseMapItemDialog 
		{item}
		bind:open={showEditDialog}
	/>
{/if}

<!-- Delete Confirmation Dialog -->
<Dialog bind:open={showDeleteDialog}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Delete Course Map Item</DialogTitle>
			<DialogDescription>
				Are you sure you want to delete "{item.title}"? This action cannot be undone.
			</DialogDescription>
		</DialogHeader>
		
		<form 
			method="POST" 
			action="?/delete"
			use:enhance={() => {
				isDeleting = true;
				return ({ result }) => {
					isDeleting = false;
					if (result.type === 'success') {
						toast.success('Course map item deleted successfully');
						showDeleteDialog = false;
						invalidateAll();
					} else if (result.type === 'failure') {
						const message = (result.data as any)?.message || 'Failed to delete course map item';
						toast.error(String(message));
					}
				};
			}}
		>
			<input type="hidden" name="id" value={item.id} />
			
			<div class="flex justify-end gap-3 pt-4">
				<Button type="button" variant="outline" onclick={() => showDeleteDialog = false} disabled={isDeleting}>
					Cancel
				</Button>
				<Button type="submit" variant="destructive" disabled={isDeleting}>
					{#if isDeleting}
						<Loader2 class="h-4 w-4 mr-2 animate-spin" />
					{/if}
					Delete
				</Button>
			</div>
		</form>
	</DialogContent>
</Dialog>
