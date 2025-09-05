<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import ArchiveIcon from '@lucide/svelte/icons/archive';
	import type { PageData } from './$types.js';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { createTimetableSchema } from './schema.js';

	let { data }: { data: PageData } = $props();

	let dialogOpen = $state(false);

	const form = superForm(data.createTimetableForm, {
		validators: zod4(createTimetableSchema),
		onResult: () => {
			dialogOpen = false;
		}
	});

	const { form: formData, enhance, constraints } = form;
</script>

<div class="mb-6 flex items-center justify-between">
	<div>
		<h1 class="text-2xl font-bold">Timetables</h1>
		<p class="text-muted-foreground mt-1">Manage your school timetables</p>
	</div>
	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>
			<PlusIcon />
			Create New</Dialog.Trigger
		>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>Create New Timetable</Dialog.Title>
			</Dialog.Header>
			<form method="POST" action="?/createTimetable" use:enhance>
				<div class="grid gap-4 py-4">
					<Form.Field {form} name="name">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Name</Form.Label>
								<Input {...props} bind:value={$formData.name} placeholder="Term 1" />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<Form.Field {form} name="schoolYear">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>School Year</Form.Label>
								<Input
									{...props}
									type="number"
									bind:value={$formData.schoolYear}
									{...$constraints.schoolYear}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>
				<Dialog.Footer>
					<Button type="button" variant="outline" onclick={() => (dialogOpen = false)}>
						Cancel
					</Button>
					<Button type="submit" class="gap-2">
						<PlusIcon />
						Create Timetable
					</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
</div>

{#if data.timetables.length === 0}
	<Card.Root class="p-8 text-center">
		<Card.Content class="pt-6">
			<CalendarIcon class="text-muted-foreground mx-auto mb-4 h-12 w-12" />
			<Card.Title class="mb-2 text-lg">No timetables yet</Card.Title>
			<Card.Description class="mb-4">
				Get started by creating your first timetable for your school.
			</Card.Description>
		</Card.Content>
	</Card.Root>
{:else}
	<div class="grid gap-4">
		{#each data.timetables as timetable}
			<a href={`/admin/timetables/${timetable.id}/times`}>
				<Card.Root>
					<Card.Header class="flex items-center justify-between">
						<div class="flex items-center gap-4">
							<div class="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
								<CalendarIcon class="text-primary h-6 w-6" />
							</div>
							<div class="flex flex-col">
								<Card.Title class="text-lg font-semibold">{timetable.name}</Card.Title>
								<div class="mt-1 flex items-center gap-2">
									<Badge variant="secondary" class="text-xs">
										{timetable.schoolYear}
									</Badge>
									{#if timetable.isArchived}
										<Badge variant="outline" class="gap-1 text-xs">
											<ArchiveIcon class="h-3 w-3" />
											Archived
										</Badge>
									{/if}
								</div>
							</div>
						</div>
					</Card.Header>
				</Card.Root>
			</a>
		{/each}
	</div>
{/if}
