<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import {
		Table,
		TableHead,
		TableBody,
		TableCell,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { convertToFullName } from '$lib/utils.js';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { UsersIcon } from '@lucide/svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { createGroupSchema } from './schema.js';
	import { invalidateAll } from '$app/navigation';
	import { yearLevelEnum } from '$lib/enums.js';

	let { data } = $props();

	let yearLevels = $derived(() => {
		return data.students
			.map((student) => student.yearLevel)
			.filter((value, index, self) => self.indexOf(value) === index);
	});

	let yearLevel = $state('');
	let createDialogOpen = $state(false);

	const form = superForm(data.createGroupForm, {
		validators: zod4(createGroupSchema),
		onResult: ({ result }) => {
			if (result.type === 'success') {
				createDialogOpen = false;
				invalidateAll();
			}
		}
	});

	const { form: formData, enhance } = form;

	// Set the year level when opening the dialog
	function openCreateDialog() {
		if (yearLevel) {
			$formData.yearLevel = yearLevel as yearLevelEnum;
		}
		createDialogOpen = true;
	}
</script>

<div class="space-y-8">
	<div class="space-y-4">
		<h2 class="text-2xl leading-tight font-bold">Groups</h2>
		<div class="flex gap-2">
			<Select.Root type="single" name="yearLevel" bind:value={yearLevel}>
				<Select.Trigger class="w-[180px]">
					{yearLevel ? `Year ${yearLevel}` : 'Select a year level'}
				</Select.Trigger>
				<Select.Content>
					{#each yearLevels() as yearLevel}
						<Select.Item value={yearLevel} label={`Year ${yearLevel}`}>
							{`Year ${yearLevel}`}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<Button
				type="button"
				onclick={openCreateDialog}
				class="flex items-center gap-2"
				disabled={!yearLevel}
			>
				<PlusIcon class="h-4 w-4" />
				Create Group
			</Button>
		</div>
		{#if yearLevel}
			{#if data.groups.length > 0}
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Group Name</TableHead>
							<TableHead>Year Level</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each data.groups as group}
							<TableRow>
								<TableCell>
									{group.name}
								</TableCell>
								<TableCell>
									{group.yearLevel}
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			{:else}
				<Card.Root>
					<Card.Content class="text-center">
						<UsersIcon class="text-muted-foreground mx-auto mb-4 h-12 w-12" />
						<Card.Title class="mb-2 text-lg">No groups yet</Card.Title>
						<Card.Description class="mb-4">
							Get started by creating your first group for students in this year level.
						</Card.Description>
					</Card.Content>
				</Card.Root>
			{/if}
		{:else}
			<Card.Root>
				<Card.Content class="text-center">
					<UsersIcon class="text-muted-foreground mx-auto mb-4 h-12 w-12" />
					<Card.Title class="mb-2 text-lg">Select a year level</Card.Title>
					<Card.Description class="mb-4">
						Please select a year level to get started with groups.
					</Card.Description>
				</Card.Content>
			</Card.Root>
		{/if}
	</div>
	<div class="space-y-4">
		<h2 class="text-2xl leading-tight font-bold">Students</h2>
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Student Name</TableHead>
					<TableHead>Year Level</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each data.students as student}
					<TableRow>
						<TableCell>
							{convertToFullName(student.firstName, student.middleName, student.lastName)}
						</TableCell>
						<TableCell>
							{student.yearLevel}
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</div>
</div>

<!-- Create Group Dialog -->
<Dialog.Root bind:open={createDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Create New Group</Dialog.Title>
		</Dialog.Header>
		<form method="POST" action="?/createGroup" use:enhance>
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="create-name">Group Name</Label>
					<Input
						id="create-name"
						name="name"
						bind:value={$formData.name}
						placeholder="Enter group name"
						required
					/>
				</div>

				<!-- Hidden field for year level -->
				<input type="hidden" name="yearLevel" bind:value={$formData.yearLevel} />
			</div>
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (createDialogOpen = false)}>
					Cancel
				</Button>
				<Button type="submit">Create Group</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
