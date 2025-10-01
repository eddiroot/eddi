<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Autocomplete from '$lib/components/autocomplete.svelte';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { Badge } from '$lib/components/ui/badge';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select/index.js';
	import { yearLevelEnum } from '$lib/enums';
	import { convertToFullName, yearLevelToLabel } from '$lib/utils';
	import InfoIcon from '@lucide/svelte/icons/info';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import UsersIcon from '@lucide/svelte/icons/users';
	import WandSparkles from '@lucide/svelte/icons/wand-sparkles';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { createGroupSchema, randomlyAssignSchema } from './schema';

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
	let infoDialogOpen = $state(false);
	let pageInfo = $state('');
	let autoCreating = $state(false);

	let filteredGroups = $derived(() => {
		if (!yearLevel) return [];
		return data.groups.filter((group) => group.yearLevel === yearLevel);
	});

	let filteredStudents = $derived(() => {
		if (!yearLevel) return [];
		return data.students.filter((student) => student.yearLevel === yearLevel);
	});

	// Get student options for a specific group (exclude students already in that group)
	function getStudentOptionsForGroup(groupId: number) {
		if (!yearLevel) return [];
		
		const studentsInGroup = data.studentsByGroupId[groupId] || [];
		const studentIdsInGroup = new Set(studentsInGroup.map(s => s.id));
		
		// Get all students for the year level, excluding those already in this specific group
		const availableStudents = data.students.filter(
			(student) => student.yearLevel === yearLevel && !studentIdsInGroup.has(student.id)
		);
		
		return availableStudents.map((student) => ({
			value: student.id,
			label: convertToFullName(student.firstName, student.middleName, student.lastName)
		}));
	}

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

	// Auto-create groups based on subjects
	async function autoCreateGroups() {
		if (!yearLevel) return;

		autoCreating = true;
		try {
			const formData = new FormData();
			formData.append('yearLevel', yearLevel);

			const response = await fetch('?/autoCreateGroups', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				await invalidateAll();
			}
		} catch (error) {
			console.error('Error auto-creating groups:', error);
		} finally {
			autoCreating = false;
		}
	}

	// Add student to group
	async function addStudentToGroup(groupId: number, userId: string) {
		try {
			const formData = new FormData();
			formData.append('groupId', groupId.toString());
			formData.append('userId', userId);

			const response = await fetch('?/addStudent', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				await invalidateAll();
			}
		} catch (error) {
			console.error('Error adding student to group:', error);
		}
	}

	// Remove student from group
	async function removeStudentFromGroup(groupId: number, userId: string) {
		try {
			const formData = new FormData();
			formData.append('groupId', groupId.toString());
			formData.append('userId', userId);

			const response = await fetch('?/removeStudent', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				await invalidateAll();
			}
		} catch (error) {
			console.error('Error removing student from group:', error);
		}
	}

	// Delete group
	async function deleteGroup(groupId: number) {
		if (!confirm('Are you sure you want to delete this group? All students will be unassigned.')) {
			return;
		}

		try {
			const formData = new FormData();
			formData.append('groupId', groupId.toString());

			const response = await fetch('?/deleteGroup', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				await invalidateAll();
			}
		} catch (error) {
			console.error('Error deleting group:', error);
		}
	}
</script><div class="space-y-8">
	<div class="flex justify-between items-start mb-4">
		<div></div>
		<div class="flex gap-2">
			<Button
				type="button"
				variant="outline"
				onclick={autoCreateGroups}
				disabled={!yearLevel || autoCreating}
			>
				<WandSparkles class="h-4 w-4 mr-2" />
				{autoCreating ? 'Creating...' : 'Auto Create Groups'}
			</Button>
			<Button
				type="button"
				variant="outline"
				size="icon"
				onclick={() => (infoDialogOpen = true)}
				class="ml-auto"
			>
				<InfoIcon class="h-4 w-4" />
			</Button>
		</div>
	</div>
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
				<Accordion.Root type="single" class="w-full">
					{#each filteredGroups() as group}
						{@const groupStudents = data.studentsByGroupId[group.id] || []}
						<Accordion.Item value="group-{group.id}">
							<Accordion.Trigger class="w-full hover:no-underline">
								<div class="flex w-full items-center justify-between pr-4">
									<div class="flex items-center gap-4">
										<h3 class="text-lg font-semibold">{group.name}</h3>
										<Badge variant="outline" class="text-xs">
											{groupStudents.length} students
										</Badge>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onclick={(e) => {
											e.stopPropagation();
											deleteGroup(group.id);
										}}
										class="text-destructive hover:text-destructive"
									>
										<Trash2Icon class="h-4 w-4" />
									</Button>
								</div>
							</Accordion.Trigger>

							<Accordion.Content>
								<!-- Add Student Section -->
								<div class="mb-4 flex gap-2">
									<div class="flex-1">
										{#key group.id}
											<Autocomplete
												options={getStudentOptionsForGroup(group.id)}
												placeholder="Add student to group..."
												searchPlaceholder="Search students..."
												emptyText="No available students found."
												onselect={(option) => addStudentToGroup(group.id, option.value as string)}
											/>
										{/key}
									</div>
								</div>

								<!-- Students List -->
								{#if groupStudents.length > 0}
									<div class="space-y-2">
										{#each groupStudents as student}
											<div
												class="bg-background flex items-center justify-between rounded-lg border p-3"
											>
												<span class="font-medium">
													{convertToFullName(student.firstName, student.middleName, student.lastName)}
												</span>
												<Button
													variant="ghost"
													size="sm"
													onclick={() => removeStudentFromGroup(group.id, student.id)}
												>
													<Trash2Icon class="h-4 w-4" />
												</Button>
											</div>
										{/each}
									</div>
								{:else}
									<div class="text-muted-foreground text-center text-sm">
										No students in this group yet.
									</div>
								{/if}
							</Accordion.Content>
						</Accordion.Item>
					{/each}
				</Accordion.Root>
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

<!-- Page Information Dialog -->
<Dialog.Root bind:open={infoDialogOpen}>
	<Dialog.Content class="sm:max-w-[1000px] sm:max-h-[1000px]">
		<Dialog.Header>
			<Dialog.Title>Page Information</Dialog.Title>
			<Dialog.Description>
				Important information about managing students and groups in this timetable:
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid gap-2">
				<Label for="page-info">Information</Label>
				<p
					class="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					placeholder="Type important information about this page here..."
				>
			For a highschool model where there are no groupings of students and hence why no shared classes, its important to follow the following structure for grouping the students:
			1. Create groups that represent the classes or subjects that students will be attending. 
				- For example, if there is a Year 10 English class, create a group named "Year 10 English".
			2. Assign students to these groups based on the classes they are enrolled in. 
				- A student taking Year 10 English and Year 10 Math would be assigned to both the "Year 10 English" and "Year 10 Math" groups.
			3. When creating activities, link them to the appropriate groups.
				- For instance, the activity for the Year 10 English class should be associated with the "Year 10 English" group.
			
			NOTE: The more groups the better, so if you have 60 students that need to do english, however you can only have 30 studnets per class then you should
			have 2 groups of "Year 10 English A" and "Year 10 English B" to ensure the students can be split into different classes.
			</p>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
