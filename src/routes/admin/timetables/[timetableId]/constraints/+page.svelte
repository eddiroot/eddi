<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import XIcon from '@lucide/svelte/icons/x';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import EditIcon from '@lucide/svelte/icons/edit';
	import TrashIcon from '@lucide/svelte/icons/trash';
	
	// Import constraint form mapping utilities
	import { 
		getConstraintFormComponent, 
		hasCustomForm
	} from '$lib/constraint-form-mapping';
	
	// Fallback generic form
	import type { Constraint, TimetableConstraint } from '$lib/server/db/schema/timetables';

	let { data } = $props();
	let { 
		user, 
		timetableId, 
		currentTimeConstraints, 
		currentSpaceConstraints,
		availableTimeConstraints,
		availableSpaceConstraints,
	} = data;

	// Modal state
	let addConstraintModalOpen = $state(false);
	let constraintToAdd = $state<Constraint | null>(null);

	// Form handlers
	function openAddConstraintModal(constraint: Constraint) {
		constraintToAdd = constraint;
		addConstraintModalOpen = true;
	}

	function closeAddConstraintModal() {
		addConstraintModalOpen = false;
		constraintToAdd = null;
	}

	// Handle adding a constraint to the timetable
	async function handleAddConstraint(formData: Record<string, unknown>) {
		if (!constraintToAdd) return;

		try {
			const response = await fetch(`/admin/timetables/${timetableId}/constraints`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					constraintId: constraintToAdd.id,
					parameters: formData
				})
			});

			const result = await response.json();

			if (result.success) {
				// Refresh the page to show the updated constraints
				window.location.reload();
			} else {
				console.error('Failed to add constraint:', result.error);
				// You might want to show a toast notification here
			}
		} catch (error) {
			console.error('Error adding constraint:', error);
			// You might want to show a toast notification here
		} finally {
			closeAddConstraintModal();
		}
	}

	// Get the appropriate form component for a constraint using the mapping
	function getFormComponent(constraint: Constraint) {
		return getConstraintFormComponent(constraint.FETName);
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl leading-tight font-bold">Timetabling Constraints</h1>
		<div class="text-sm text-muted-foreground">
			Timetable ID: {timetableId}
		</div>
	</div>

	<!-- Assigned Time Constraints Section -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="text-xl leading-tight font-bold">Active Time Constraints</h2>
			<span class="text-sm text-muted-foreground">
				{currentTimeConstraints.length} constraints assigned
			</span>
		</div>
		<Card.Root>
			<Card.Content class="p-4">
				{#if currentTimeConstraints.length === 0}
					<p class="text-center text-muted-foreground py-8">
						No time constraints assigned to this timetable yet.
					</p>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full border-collapse">
							<thead>
								<tr class="border-b">
									<th class="px-4 py-2 text-left">Constraint Name</th>
									<th class="px-4 py-2 text-left">Description</th>
									<th class="px-4 py-2 text-left">Active</th>
									<th class="px-4 py-2 text-left">Actions</th>
								</tr>
							</thead>
							<tbody>
								{#each currentTimeConstraints as constraint}
									<tr class="hover:bg-muted/50 border-b">
										<td class="px-4 py-2 font-medium">{constraint.friendlyName}</td>
										<td class="px-4 py-2 text-sm text-muted-foreground max-w-md">
											{constraint.description}
										</td>
										<td class="px-4 py-2">
											<Checkbox
												checked={constraint.active}
												onCheckedChange={() => console.log('Toggle active state', constraint)}
											/>
										</td>
										<td class="px-4 py-2">
											<div class="flex gap-2">
												<Button 
													variant="ghost" 
													size="sm" 
													onclick={() => console.log('Edit', constraint)}
												>
													<EditIcon class="h-4 w-4" />
												</Button>
												<Button 
													variant="ghost" 
													size="sm" 
													onclick={() => console.log('Remove', constraint)}
												>
													<TrashIcon class="h-4 w-4" />
												</Button>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Available Time Constraints Section -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="text-xl leading-tight font-bold">Available Time Constraints</h2>
			<span class="text-sm text-muted-foreground">
				{availableTimeConstraints.length} constraints available
			</span>
		</div>
		<Card.Root>
			<Card.Content class="p-4">
				{#if availableTimeConstraints.length === 0}
					<p class="text-center text-muted-foreground py-8">
						All time constraints are already assigned to this timetable.
					</p>
				{:else}
					<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{#each availableTimeConstraints as constraint}
							<div class="border rounded-lg p-4 space-y-3">
								<div>
									<h3 class="font-semibold">{constraint.friendlyName}</h3>
									<p class="text-sm text-muted-foreground mt-1">
										{constraint.description}
									</p>
								</div>
								<Button 
									size="sm" 
									class="w-full"
									onclick={() => openAddConstraintModal(constraint)}
								>
									<PlusIcon class="h-4 w-4 mr-2" />
									Add Constraint
								</Button>
							</div>
						{/each}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Assigned Space Constraints Section -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="text-xl leading-tight font-bold">Active Space Constraints</h2>
			<span class="text-sm text-muted-foreground">
				{currentSpaceConstraints.length} constraints assigned
			</span>
		</div>
		<Card.Root>
			<Card.Content class="p-4">
				{#if currentSpaceConstraints.length === 0}
					<p class="text-center text-muted-foreground py-8">
						No space constraints assigned to this timetable yet.
					</p>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full border-collapse">
							<thead>
								<tr class="border-b">
									<th class="px-4 py-2 text-left">Constraint Name</th>
									<th class="px-4 py-2 text-left">Description</th>
									<th class="px-4 py-2 text-left">Active</th>
									<th class="px-4 py-2 text-left">Actions</th>
								</tr>
							</thead>
							<tbody>
								{#each currentSpaceConstraints as constraint}
									<tr class="hover:bg-muted/50 border-b">
										<td class="px-4 py-2 font-medium">{constraint.friendlyName}</td>
										<td class="px-4 py-2 text-sm text-muted-foreground max-w-md">
											{constraint.description}
										</td>
										<td class="px-4 py-2">
											<Checkbox
												checked={constraint.active}
												onCheckedChange={() => console.log('Toggle active state', constraint)}
											/>
										</td>
										<td class="px-4 py-2">
											<div class="flex gap-2">
												<Button 
													variant="ghost" 
													size="sm" 
													onclick={() => console.log('Edit', constraint)}
												>
													<EditIcon class="h-4 w-4" />
												</Button>
												<Button 
													variant="ghost" 
													size="sm" 
													onclick={() => console.log('Remove', constraint)}
												>
													<TrashIcon class="h-4 w-4" />
												</Button>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>

		<!-- Available Space Constraints Section -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="text-xl leading-tight font-bold">Available Space Constraints</h2>
			<span class="text-sm text-muted-foreground">
				{availableSpaceConstraints.length} constraints available
			</span>
		</div>
		<Card.Root>
			<Card.Content class="p-4">
				{#if availableSpaceConstraints.length === 0}
					<p class="text-center text-muted-foreground py-8">
						All space constraints are already assigned to this timetable.
					</p>
				{:else}
					<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{#each availableSpaceConstraints as constraint}
							<div class="border rounded-lg p-4 space-y-3">
								<div>
									<h3 class="font-semibold">{constraint.friendlyName}</h3>
									<p class="text-sm text-muted-foreground mt-1">
										{constraint.description}
									</p>
								</div>
								<Button 
									size="sm" 
									class="w-full"
									onclick={() => openAddConstraintModal(constraint)}
								>
									<PlusIcon class="h-4 w-4 mr-2" />
									Add Constraint
								</Button>
							</div>
						{/each}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>

<!-- Add Constraint Modal -->
<Dialog.Root bind:open={addConstraintModalOpen}>
	<Dialog.Content class="max-w-2xl max-h-[80vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>Add Constraint: {constraintToAdd?.friendlyName}</Dialog.Title>
			<Dialog.Description>
				Configure the parameters for this constraint and add it to your timetable.
			</Dialog.Description>
		</Dialog.Header>
		{#if constraintToAdd}
			{@const FormComponent = getFormComponent(constraintToAdd)}
			<FormComponent 
				onSubmit={handleAddConstraint}
				onCancel={closeAddConstraintModal}
			/>
		{/if}
	</Dialog.Content>
</Dialog.Root>
