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
	import { convertToFullName, yearLevelToLabel } from '$lib/utils';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { ShuffleIcon, UsersIcon } from '@lucide/svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { createGroupSchema, randomlyAssignSchema } from './schema';
	import { invalidateAll } from '$app/navigation';
	import { yearLevelEnum } from '$lib/enums';

	let { data } = $props();

	let yearLevels = $derived(() => {
		return data.students
			.map((student) => student.yearLevel)
			.filter((value, index, self) => self.indexOf(value) === index)
			.sort();
	});

	let yearLevel = $state(data.defaultYearLevel);
	let createDialogOpen = $state(false);
	let randomAssignDialogOpen = $state(false);

	let filteredGroups = $derived(() => {
		if (!yearLevel) return [];
		return data.groups.filter((group) => group.yearLevel === yearLevel);
	});

	let filteredStudents = $derived(() => {
		if (!yearLevel) return [];
		return data.students.filter((student) => student.yearLevel === yearLevel);
	});

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

	const randomAssignForm = superForm(data.randomlyAssignForm, {
		validators: zod4(randomlyAssignSchema),
		onResult: ({ result }) => {
			if (result.type === 'success') {
				randomAssignDialogOpen = false;
				invalidateAll();
			}
		}
	});

	const { form: randomAssignFormData, enhance: randomAssignEnhance } = randomAssignForm;

	// Set the year level when opening the dialog
	function openCreateDialog() {
		if (yearLevel) {
			$formData.yearLevel = yearLevel as yearLevelEnum;
		}
		createDialogOpen = true;
	}

	// Set the year level when opening the random assign dialog
	function openRandomAssignDialog() {
		if (yearLevel) {
			$randomAssignFormData.yearLevel = yearLevel as yearLevelEnum;
		}
		randomAssignDialogOpen = true;
	}
</script>

<div class="space-y-8">
	<div class="space-y-4">
		<h2 class="text-2xl leading-tight font-bold">Groups</h2>
		<div class="flex gap-2">
			<Select.Root type="single" name="yearLevel" bind:value={yearLevel}>
				<Select.Trigger class="w-[180px]">
					{yearLevel ? yearLevelToLabel(yearLevel) : 'Select a year level'}
				</Select.Trigger>
				<Select.Content>
					{#each yearLevels() as yearLevelValue}
						<Select.Item value={yearLevelValue} label={yearLevelToLabel(yearLevelValue)}>
							{yearLevelToLabel(yearLevelValue)}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<Button type="button" onclick={openCreateDialog} disabled={!yearLevel}>
				<PlusIcon />
				Create Group
			</Button>
		</div>
		{#if yearLevel}
			{#if filteredGroups().length > 0}
				<ol class="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
					{#each filteredGroups() as group}
						<li
							class="border-border bg-card flex min-h-10 w-full items-center justify-between rounded-lg border-2 px-4 py-3 transition-colors"
						>
							<span class="font-semibold">
								{group.name}
							</span>
						</li>
					{/each}
				</ol>
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
						Please select a year level to see its groups.
					</Card.Description>
				</Card.Content>
			</Card.Root>
		{/if}
	</div>
	<div class="space-y-4">
		<div class="flex justify-between">
			<h2 class="text-2xl leading-tight font-bold">Students</h2>
			{#if yearLevel}
				{#if filteredStudents().length > 0}
					<Button
						type="button"
						onclick={openRandomAssignDialog}
						disabled={!yearLevel || filteredGroups().length === 0}
					>
						<ShuffleIcon />
						Assign Groups
					</Button>
				{/if}
			{/if}
		</div>
		{#if yearLevel}
			{#if filteredStudents().length > 0}
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Group</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each filteredStudents() as student}
							<TableRow>
								<TableCell>
									{convertToFullName(student.firstName, student.middleName, student.lastName)}
								</TableCell>
								<TableCell>
									{student.groupName || 'No group assigned'}
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			{:else}
				<Card.Root>
					<Card.Content class="text-center">
						<UsersIcon class="text-muted-foreground mx-auto mb-4 h-12 w-12" />
						<Card.Title class="mb-2 text-lg">No students found</Card.Title>
						<Card.Description class="mb-4">
							There are no students in this year level.
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
						Please select a year level to see students.
					</Card.Description>
				</Card.Content>
			</Card.Root>
		{/if}
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

<!-- Random Assignment Dialog -->
<Dialog.Root bind:open={randomAssignDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Randomly Assign Students</Dialog.Title>
			<Dialog.Description>
				This will randomly assign the {data.students.length} students in {yearLevelToLabel(
					yearLevel
				)} to the {filteredGroups().length} groups as evenly as possible.
			</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/randomlyAssign" use:randomAssignEnhance>
			<input type="hidden" name="yearLevel" bind:value={$randomAssignFormData.yearLevel} />
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (randomAssignDialogOpen = false)}>
					Cancel
				</Button>
				<Button type="submit">Randomly Assign</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
