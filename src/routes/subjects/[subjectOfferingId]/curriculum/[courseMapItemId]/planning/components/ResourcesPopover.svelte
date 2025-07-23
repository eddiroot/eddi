<script lang="ts">
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { ResourceCard } from '$lib/components/ui/resource-card';
	import type { Resource } from '$lib/server/db/schema';
	
	// Icons
	import File from '@lucide/svelte/icons/file';
	import Plus from '@lucide/svelte/icons/plus';

	let {
		resources = [],
		onAddResource,
		onRemoveResource,
	}: {
		resources: Resource[];
		onAddResource?: () => void;
		onRemoveResource?: (resourceId: number) => void;
	} = $props();
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
							<ResourceCard
								{resource}
								variant="default"
								onRemove={(id) => id !== undefined && onRemoveResource?.(id)}
							/>
						{/each}
					</div>
				</ScrollArea>
			{/if}
		</div>
	</PopoverContent>
</Popover>
