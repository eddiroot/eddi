<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import BuildingIcon from '@lucide/svelte/icons/building';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import MoreHorizontalIcon from '@lucide/svelte/icons/more-horizontal';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	const { data } = $props();

	let editDialogOpen = $state(false);
	let selectedCampus = $state<any>(null);
	let archiveDialogOpen = $state(false);

	// Form data
	let editFormData = $state({
		campusId: 0,
		name: '',
		address: '',
		description: ''
	});

	function openEditDialog(campus: any) {
		selectedCampus = campus;
		editFormData = {
			campusId: campus.id,
			name: campus.name,
			address: campus.address,
			description: campus.description || ''
		};
		editDialogOpen = true;
	}

	function openArchiveDialog(campus: any) {
		selectedCampus = campus;
		archiveDialogOpen = true;
	}
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
										<DropdownMenu.Item onclick={() => openEditDialog(campus)}>
											Edit
										</DropdownMenu.Item>
										<DropdownMenu.Item
											onclick={() => openArchiveDialog(campus)}
											class="text-destructive focus:text-destructive"
										>
											Archive
										</DropdownMenu.Item>
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

<!-- Edit Campus Modal -->
<Dialog.Root bind:open={editDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Edit Campus</Dialog.Title>
			<Dialog.Description>
				Make changes to the campus information here. Click save when you're done.
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/editCampus"
			use:enhance={({ formData }) => {
				return async ({ result }) => {
					if (result.type === 'success') {
						editDialogOpen = false;
						await invalidateAll();
					} else if (result.type === 'failure') {
						console.error('Failed to update campus');
					}
				};
			}}
		>
			<div class="grid gap-4 py-4">
				<input type="hidden" name="campusId" bind:value={editFormData.campusId} />

				<div class="grid gap-2">
					<Label for="name">Campus Name</Label>
					<Input id="name" name="name" bind:value={editFormData.name} required />
				</div>

				<div class="grid gap-2">
					<Label for="address">Address</Label>
					<Input id="address" name="address" bind:value={editFormData.address} required />
				</div>

				<div class="grid gap-2">
					<Label for="description">Description (Optional)</Label>
					<Textarea id="description" name="description" bind:value={editFormData.description} />
				</div>
			</div>
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (editDialogOpen = false)}>
					Cancel
				</Button>
				<Button type="submit">Save Changes</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Archive Campus Modal -->
<Dialog.Root bind:open={archiveDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Archive Campus</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to archive "{selectedCampus?.name}"? This action will hide the campus
				from the active list but can be undone later.
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/archiveCampus"
			use:enhance={({ formData }) => {
				formData.set('campusId', selectedCampus?.id.toString());
				return async ({ result }) => {
					if (result.type === 'success') {
						archiveDialogOpen = false;
					}
				};
			}}
		>
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (archiveDialogOpen = false)}>
					Cancel
				</Button>
				<Button type="submit" variant="destructive">Archive Campus</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
