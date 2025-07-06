<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import BuildingIcon from '@lucide/svelte/icons/building';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import MoreHorizontalIcon from '@lucide/svelte/icons/more-horizontal';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';

	const { data } = $props();
</script>

<div class="space-y-8">
	<h1 class="text-3xl font-bold tracking-tight">Campuses</h1>

	<!-- Campuses Cards -->
	<div class="space-y-4">
		{#if data.campuses.length > 0}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each data.campuses as campus}
					<Card.Root class="h-48">
						<Card.Header class="gap-4">
							<div class="flex items-center gap-3">
								<div class="bg-secondary rounded-lg p-2">
									<BuildingIcon class="text-secondary-foreground h-5 w-5" />
								</div>
								<div class="flex-1">
									<Card.Title class="text-lg font-semibold">{campus.name}</Card.Title>
								</div>
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										{#snippet child({ props })}
											<Button {...props} variant="ghost" size="sm" class="h-8 w-8 p-0">
												<span class="sr-only">Open menu</span>
												<MoreHorizontalIcon class="h-4 w-4" />
											</Button>
										{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end" class="w-[160px]">
										<DropdownMenu.Item>Edit</DropdownMenu.Item>
										<DropdownMenu.Item>Archive</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</div>
							<div class="space-y-2">
								<div class="text-muted-foreground flex items-center gap-2 text-sm">
									<MapPinIcon class="h-4 w-4" />
									<span>{campus.address}</span>
								</div>
							</div>
						</Card.Header>
					</Card.Root>
				{/each}
			</div>
		{:else}
			<div class="flex h-48 items-center justify-center rounded-lg border border-dashed">
				<div class="text-center">
					<BuildingIcon class="text-muted-foreground mx-auto h-12 w-12" />
					<h3 class="mt-2 text-sm font-semibold">No campuses</h3>
					<p class="text-muted-foreground mt-1 text-sm">Get started by creating a new campus.</p>
				</div>
			</div>
		{/if}
	</div>
</div>
