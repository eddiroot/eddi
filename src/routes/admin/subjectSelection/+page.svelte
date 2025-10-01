<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import { yearLevelEnum } from '$lib/enums.js';
	import { yearLevelToLabel } from '$lib/utils.js';
	import CheckSquare from '@lucide/svelte/icons/check-square';
	import Edit from '@lucide/svelte/icons/edit';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import {
		createConstraintSchema,
		deleteConstraintSchema,
		updateConstraintSchema
	} from './schema.js';

	let { data } = $props();

	// Year level and year selection
	let selectedYearLevel = $state(data.selectedYearLevel);
	let selectedYear = $state(data.selectedYear);

	// Dialog states
	let createDialogOpen = $state(false);
	let editDialogOpen = $state(false);
	let deleteDialogOpen = $state(false);
	let selectedConstraint = $state<(typeof data.constraints)[number] | null>(null);

	// Year level options (excluding none and VCE for simplicity)
	const yearLevelOptions = [
		yearLevelEnum.foundation,
		yearLevelEnum.year1,
		yearLevelEnum.year2,
		yearLevelEnum.year3,
		yearLevelEnum.year4,
		yearLevelEnum.year5,
		yearLevelEnum.year6,
		yearLevelEnum.year7,
		yearLevelEnum.year8,
		yearLevelEnum.year9,
		yearLevelEnum.year10,
		yearLevelEnum.year10A,
		yearLevelEnum.year11,
		yearLevelEnum.year12
	];

	// Filter subjects by selected year level
	const filteredSubjects = $derived(
		data.subjects.filter((s) => s.yearLevel === selectedYearLevel)
	);

	// Create form
	const createForm = superForm(data.createForm, {
		validators: zod4(createConstraintSchema),
		resetForm: true,
		onUpdated: ({ form }) => {
			if (form.valid) {
				createDialogOpen = false;
			}
		},
		onResult: ({ result }) => {
			if (result.type === 'success') {
				createDialogOpen = false;
			}
		}
	});
	const {
		form: createFormData,
		enhance: createEnhance,
		errors: createErrors
	} = createForm;

	// Set default values for create form
	$effect(() => {
		$createFormData.yearLevel = selectedYearLevel;
		$createFormData.year = selectedYear;
	});

	// Update form
	const updateForm = superForm(data.updateForm, {
		validators: zod4(updateConstraintSchema),
		resetForm: true,
		onUpdated: ({ form }) => {
			if (form.valid) {
				editDialogOpen = false;
				selectedConstraint = null;
			}
		},
		onResult: ({ result }) => {
			if (result.type === 'success') {
				editDialogOpen = false;
				selectedConstraint = null;
			}
		}
	});
	const {
		form: updateFormData,
		enhance: updateEnhance,
		errors: updateErrors
	} = updateForm;

	// Delete form
	const deleteForm = superForm(data.deleteForm, {
		validators: zod4(deleteConstraintSchema),
		resetForm: true,
		onUpdated: ({ form }) => {
			if (form.valid) {
				deleteDialogOpen = false;
				selectedConstraint = null;
			}
		},
		onResult: ({ result }) => {
			if (result.type === 'success') {
				deleteDialogOpen = false;
				selectedConstraint = null;
			}
		}
	});
	const { form: deleteFormData, enhance: deleteEnhance } = deleteForm;

	// Update URL when year level or year changes
	function updateFilters() {
		const url = new URL($page.url);
		url.searchParams.set('yearLevel', selectedYearLevel);
		url.searchParams.set('year', selectedYear.toString());
		goto(url, { keepFocus: true, noScroll: true });
	}

	function openEditDialog(constraint: (typeof data.constraints)[number]) {
		selectedConstraint = constraint;
		$updateFormData.constraintId = constraint.constraint.id;
		$updateFormData.name = constraint.constraint.name;
		$updateFormData.description = constraint.constraint.description || '';
		$updateFormData.min = constraint.constraint.min;
		$updateFormData.max = constraint.constraint.max;
		$updateFormData.subjectIds = constraint.subjects.map((s) => s.subjectId);
		editDialogOpen = true;
	}

	function openDeleteDialog(constraint: (typeof data.constraints)[number]) {
		selectedConstraint = constraint;
		$deleteFormData.constraintId = constraint.constraint.id;
		deleteDialogOpen = true;
	}

	function getSubjectName(subjectId: number): string {
		return data.subjects.find((s) => s.id === subjectId)?.name || 'Unknown';
	}
</script>

<div class="flex h-full flex-col space-y-4">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold tracking-tight">Subject Selection Constraints</h1>
		<Button onclick={() => (createDialogOpen = true)}>
			<Plus />
			Add Constraint
		</Button>
	</div>

	<!-- Filters -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Filters</Card.Title>
			<Card.Description>Select year level and year to view constraints</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div class="space-y-2">
					<Label>Year Level</Label>
					<Select.Root
						type="single"
						name="yearLevel"
						bind:value={selectedYearLevel}
						onOpenChange={() => updateFilters()}
					>
						<Select.Trigger class="w-full">
							{yearLevelToLabel(selectedYearLevel)}
						</Select.Trigger>
						<Select.Content>
							{#each yearLevelOptions as yearLevel}
								<Select.Item value={yearLevel} label={yearLevelToLabel(yearLevel)}>
									{yearLevelToLabel(yearLevel)}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div class="space-y-2">
					<Label for="year">Year</Label>
					<Input
						id="year"
						type="number"
						bind:value={selectedYear}
						onblur={updateFilters}
						min="2020"
						max="2100"
					/>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Constraints List -->
	<div class="grid gap-4">
		{#if data.constraints.length === 0}
			<Card.Root>
				<Card.Content class="flex flex-col items-center justify-center py-12">
					<CheckSquare class="mb-4 opacity-50" size={48} />
					<p class="text-muted-foreground">
						No constraints defined for {yearLevelToLabel(selectedYearLevel)} in {selectedYear}
					</p>
					<Button class="mt-4" onclick={() => (createDialogOpen = true)}>
						<Plus />
						Create First Constraint
					</Button>
				</Card.Content>
			</Card.Root>
		{:else}
			{#each data.constraints as constraint}
				<Card.Root>
					<Card.Header>
						<div class="flex items-start justify-between">
							<div>
								<Card.Title>{constraint.constraint.name}</Card.Title>
								{#if constraint.constraint.description}
									<Card.Description class="mt-2">
										{constraint.constraint.description}
									</Card.Description>
								{/if}
							</div>
							<div class="flex gap-2">
								<Button variant="ghost" size="icon" onclick={() => openEditDialog(constraint)}>
									<Edit />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									onclick={() => openDeleteDialog(constraint)}
								>
									<Trash2 />
								</Button>
							</div>
						</div>
					</Card.Header>
					<Card.Content>
						<div class="space-y-4">
							<div class="grid grid-cols-2 gap-4 text-sm">
								<div>
									<span class="font-medium">Minimum:</span>
									{constraint.constraint.min}
								</div>
								<div>
									<span class="font-medium">Maximum:</span>
									{constraint.constraint.max ?? 'No limit'}
								</div>
							</div>

							<div>
								<div class="mb-2 text-sm font-medium">Subjects:</div>
								<div class="flex flex-wrap gap-2">
									{#each constraint.subjects as subject}
										<span
											class="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
										>
											{getSubjectName(subject.subjectId)}
										</span>
									{/each}
								</div>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		{/if}
	</div>
</div>

<!-- Create Constraint Dialog -->
<Dialog.Root bind:open={createDialogOpen}>
	<Dialog.Content class="max-h-[90vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>Create Constraint</Dialog.Title>
			<Dialog.Description>
				Add a new subject selection constraint for {yearLevelToLabel(selectedYearLevel)} in {selectedYear}
			</Dialog.Description>
		</Dialog.Header>

		<form method="POST" action="?/create" use:createEnhance class="space-y-4">
			<input type="hidden" name="yearLevel" bind:value={$createFormData.yearLevel} />
			<input type="hidden" name="year" bind:value={$createFormData.year} />

			<Form.Field form={createForm} name="name">
				<Form.Control>
					{#snippet children({ props })}
						<Label for={props.id}>Constraint Name</Label>
						<Input
							{...props}
							bind:value={$createFormData.name}
							placeholder="e.g., Language requirement"
							class="mt-1"
						/>
					{/snippet}
				</Form.Control>
				{#if $createErrors.name}
					<Form.FieldErrors />
				{/if}
			</Form.Field>

			<Form.Field form={createForm} name="description">
				<Form.Control>
					{#snippet children({ props })}
						<Label for={props.id}>Description (optional)</Label>
						<Textarea
							{...props}
							bind:value={$createFormData.description}
							placeholder="Describe the constraint..."
							class="mt-1"
						/>
					{/snippet}
				</Form.Control>
				{#if $createErrors.description}
					<Form.FieldErrors />
				{/if}
			</Form.Field>

			<div class="grid grid-cols-2 gap-4">
				<Form.Field form={createForm} name="min">
					<Form.Control>
						{#snippet children({ props })}
							<Label for={props.id}>Minimum</Label>
							<Input {...props} type="number" bind:value={$createFormData.min} class="mt-1" />
						{/snippet}
					</Form.Control>
					{#if $createErrors.min}
						<Form.FieldErrors />
					{/if}
				</Form.Field>

				<Form.Field form={createForm} name="max">
					<Form.Control>
						{#snippet children({ props })}
							<Label for={props.id}>Maximum (optional)</Label>
							<Input
								{...props}
								type="number"
								bind:value={$createFormData.max}
								placeholder="No limit"
								class="mt-1"
							/>
						{/snippet}
					</Form.Control>
					{#if $createErrors.max}
						<Form.FieldErrors />
					{/if}
				</Form.Field>
			</div>

			<Form.Field form={createForm} name="subjectIds">
				<Form.Control>
					{#snippet children({ props })}
						<Label for={props.id}>Subjects</Label>
						<div class="mt-1 space-y-2">
							{#if filteredSubjects.length === 0}
								<p class="text-sm text-muted-foreground">
									No subjects available for {yearLevelToLabel(selectedYearLevel)}
								</p>
							{:else}
								{#each filteredSubjects as subject}
									<label class="flex items-center space-x-2">
										<input
											type="checkbox"
											name="subjectIds"
											value={subject.id}
											checked={$createFormData.subjectIds?.includes(subject.id)}
											onchange={(e) => {
												const target = e.currentTarget;
												if (target.checked) {
													$createFormData.subjectIds = [
														...($createFormData.subjectIds || []),
														subject.id
													];
												} else {
													$createFormData.subjectIds = (
														$createFormData.subjectIds || []
													).filter((id) => id !== subject.id);
												}
											}}
											class="rounded border-gray-300"
										/>
										<span class="text-sm">{subject.name}</span>
									</label>
								{/each}
							{/if}
						</div>
					{/snippet}
				</Form.Control>
				{#if $createErrors.subjectIds}
					<Form.FieldErrors />
				{/if}
			</Form.Field>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (createDialogOpen = false)}>
					Cancel
				</Button>
				<Button type="submit">Create Constraint</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit Constraint Dialog -->
<Dialog.Root bind:open={editDialogOpen}>
	<Dialog.Content class="max-h-[90vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>Edit Constraint</Dialog.Title>
			<Dialog.Description>Update the constraint details</Dialog.Description>
		</Dialog.Header>

		<form method="POST" action="?/update" use:updateEnhance class="space-y-4">
			<input type="hidden" name="constraintId" bind:value={$updateFormData.constraintId} />

			<Form.Field form={updateForm} name="name">
				<Form.Control>
					{#snippet children({ props })}
						<Label for={props.id}>Constraint Name</Label>
						<Input {...props} bind:value={$updateFormData.name} class="mt-1" />
					{/snippet}
				</Form.Control>
				{#if $updateErrors.name}
					<Form.FieldErrors />
				{/if}
			</Form.Field>

			<Form.Field form={updateForm} name="description">
				<Form.Control>
					{#snippet children({ props })}
						<Label for={props.id}>Description (optional)</Label>
						<Textarea {...props} bind:value={$updateFormData.description} class="mt-1" />
					{/snippet}
				</Form.Control>
				{#if $updateErrors.description}
					<Form.FieldErrors />
				{/if}
			</Form.Field>

			<div class="grid grid-cols-2 gap-4">
				<Form.Field form={updateForm} name="min">
					<Form.Control>
						{#snippet children({ props })}
							<Label for={props.id}>Minimum</Label>
							<Input {...props} type="number" bind:value={$updateFormData.min} class="mt-1" />
						{/snippet}
					</Form.Control>
					{#if $updateErrors.min}
						<Form.FieldErrors />
					{/if}
				</Form.Field>

				<Form.Field form={updateForm} name="max">
					<Form.Control>
						{#snippet children({ props })}
							<Label for={props.id}>Maximum (optional)</Label>
							<Input {...props} type="number" bind:value={$updateFormData.max} class="mt-1" />
						{/snippet}
					</Form.Control>
					{#if $updateErrors.max}
						<Form.FieldErrors />
					{/if}
				</Form.Field>
			</div>

			<Form.Field form={updateForm} name="subjectIds">
				<Form.Control>
					{#snippet children({ props })}
						<Label for={props.id}>Subjects</Label>
						<div class="mt-1 space-y-2">
							{#if filteredSubjects.length === 0}
								<p class="text-sm text-muted-foreground">
									No subjects available for {yearLevelToLabel(selectedYearLevel)}
								</p>
							{:else}
								{#each filteredSubjects as subject}
									<label class="flex items-center space-x-2">
										<input
											type="checkbox"
											name="subjectIds"
											value={subject.id}
											checked={$updateFormData.subjectIds?.includes(subject.id)}
											onchange={(e) => {
												const target = e.currentTarget;
												if (target.checked) {
													$updateFormData.subjectIds = [
														...($updateFormData.subjectIds || []),
														subject.id
													];
												} else {
													$updateFormData.subjectIds = (
														$updateFormData.subjectIds || []
													).filter((id) => id !== subject.id);
												}
											}}
											class="rounded border-gray-300"
										/>
										<span class="text-sm">{subject.name}</span>
									</label>
								{/each}
							{/if}
						</div>
					{/snippet}
				</Form.Control>
				{#if $updateErrors.subjectIds}
					<Form.FieldErrors />
				{/if}
			</Form.Field>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (editDialogOpen = false)}>
					Cancel
				</Button>
				<Button type="submit">Update Constraint</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Constraint Dialog -->
<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete Constraint</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete "{selectedConstraint?.constraint.name}"? This action
				cannot be undone.
			</Dialog.Description>
		</Dialog.Header>

		<form method="POST" action="?/delete" use:deleteEnhance>
			<input type="hidden" name="constraintId" bind:value={$deleteFormData.constraintId} />

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (deleteDialogOpen = false)}>
					Cancel
				</Button>
				<Button type="submit" variant="destructive">Delete</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
