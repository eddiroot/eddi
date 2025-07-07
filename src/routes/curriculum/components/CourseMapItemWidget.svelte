<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '$lib/components/ui/dropdown-menu';
	import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { MoreHorizontal, Edit, Trash2, Loader2 } from 'lucide-svelte';
	import { formatWeekRange, formatDuration, getYearLevelColor } from '../curriculum-utils';
	import EditCourseMapItemDialog from './EditCourseMapItemDialog.svelte';
	import type { CourseMapItem } from '$lib/server/db/schema';
	import type { PageData } from '../$types';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	export let item: CourseMapItem;

	let showEditDialog = false;
	let showDeleteDialog = false;
	let isDeleting = false;

	function handleEdit() {
		showEditDialog = true;
	}

	$: yearLevelColor = getYearLevelColor(item.yearLevel);
	$: weekRange = formatWeekRange(item.startWeekNumber, item.lengthInWeeks);
	$: duration = formatDuration(item.lengthInWeeks);
</script>

<div class="course-map-item group relative">
	<div class="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
		<!-- Header with title and menu -->
		<div class="flex items-start justify-between gap-2 mb-2">
			<h4 class="font-medium text-sm leading-tight line-clamp-2 flex-1">
				{item.title}
			</h4>
			
			<DropdownMenu>
				<DropdownMenuTrigger>
					<Button variant="ghost" size="sm" class="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
						<MoreHorizontal class="h-4 w-4" />
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

		<!-- Description -->
		{#if item.description}
			<p class="text-xs text-muted-foreground mb-3 line-clamp-2">
				{item.description}
			</p>
		{/if}

		<!-- Footer with badges -->
		<div class="flex items-center justify-between gap-2 text-xs">
			<Badge variant="secondary" class={yearLevelColor}>
				Year {item.yearLevel}
			</Badge>
			
			<div class="flex items-center gap-1 text-muted-foreground">
				<span>{weekRange}</span>
				<span>•</span>
				<span>{duration}</span>
			</div>
		</div>
	</div>
</div>

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

<style>
	.course-map-item {
		min-height: 80px;
	}
	
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
