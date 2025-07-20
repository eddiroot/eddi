<script lang="ts">
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import type { Resource } from '$lib/server/db/schema';
	
	// Icons for different resource types
	import File from '@lucide/svelte/icons/file';
	import FileImage from '@lucide/svelte/icons/file-image';
	import FileVideo from '@lucide/svelte/icons/file-video';
	import FileAudio from '@lucide/svelte/icons/file-audio';
	import FileText from '@lucide/svelte/icons/file-text';
	import Link from '@lucide/svelte/icons/link';
	import StickyNote from '@lucide/svelte/icons/sticky-note';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '$lib/components/ui/dropdown-menu';

	let {
		resources = [],
		onAddResource,
		onRemoveResource,
		onDownloadResource,
		onOpenResource
	}: {
		resources: Resource[];
		onAddResource?: () => void;
		onRemoveResource?: (resourceId: number) => void;
		onDownloadResource?: (resource: Resource) => void;
		onOpenResource?: (resource: Resource) => void;
	} = $props();

	function getResourceIcon(resourceType: string) {
		switch (resourceType) {
			case 'photo':
			case 'image':
				return FileImage;
			case 'video':
				return FileVideo;
			case 'audio':
				return FileAudio;
			case 'document':
			case 'pdf':
				return FileText;
			case 'link':
				return Link;
			case 'note':
				return StickyNote;
			default:
				return File;
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	function getResourceTypeColor(resourceType: string): string {
		switch (resourceType) {
			case 'photo':
			case 'image':
				return 'bg-purple-100 text-purple-800';
			case 'video':
				return 'bg-red-100 text-red-800';
			case 'audio':
				return 'bg-green-100 text-green-800';
			case 'document':
			case 'pdf':
				return 'bg-blue-100 text-blue-800';
			case 'link':
				return 'bg-cyan-100 text-cyan-800';
			case 'note':
				return 'bg-yellow-100 text-yellow-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}
</script>

<Popover>
	<PopoverTrigger>
		<span class="text-white hover:text-white/80 underline text-sm transition-colors cursor-pointer">
			{resources.length} Resources
		</span>
	</PopoverTrigger>
	<PopoverContent class="w-96 p-0" align="end">
		<div class="p-4">
			<div class="flex items-center justify-between mb-4">
				<h3 class="font-semibold text-lg">Resources</h3>
				{#if onAddResource}
					<Button size="sm" onclick={onAddResource} class="gap-2">
						<Plus class="w-4 h-4" />
						Add Resource
					</Button>
				{/if}
			</div>
			
			{#if resources.length === 0}
				<div class="text-center py-8 text-muted-foreground">
					<File class="w-8 h-8 mx-auto mb-2 opacity-50" />
					<p class="text-sm">No resources added yet</p>
				</div>
			{:else}
				<ScrollArea class="max-h-96">
					<div class="space-y-3">
						{#each resources as resource}
							{@const IconComponent = getResourceIcon(resource.resourceType)}
							<div class="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
								<!-- Resource Icon -->
								<div class="flex-shrink-0">
									<div class="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
										<IconComponent class="w-5 h-5 text-muted-foreground" />
									</div>
								</div>
								
								<!-- Resource Info (clickable to open) -->
								<button 
									class="flex-1 min-w-0 text-left" 
									onclick={() => onOpenResource?.(resource)}
								>
									<div class="flex items-center gap-2 mb-1">
										<h4 class="font-medium text-sm truncate hover:text-primary transition-colors">{resource.fileName}</h4>
										<Badge variant="secondary" class={getResourceTypeColor(resource.resourceType)}>
											{resource.resourceType}
										</Badge>
									</div>
									<div class="flex items-center gap-3 text-xs text-muted-foreground">
										<span>{formatFileSize(resource.fileSize)}</span>
									</div>
								</button>
								
								<!-- Actions Menu -->
								<div class="flex-shrink-0">
									<DropdownMenu>
										<DropdownMenuTrigger>
											<Button variant="ghost" size="sm" class="w-8 h-8 p-0">
												<MoreHorizontal class="w-4 h-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											{#if onRemoveResource}
												<DropdownMenuItem onclick={() => onRemoveResource?.(resource.id)} class="text-red-600">
													<Trash2 class="w-4 h-4 mr-2" />
													Remove
												</DropdownMenuItem>
											{/if}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
						{/each}
					</div>
				</ScrollArea>
			{/if}
		</div>
	</PopoverContent>
</Popover>
