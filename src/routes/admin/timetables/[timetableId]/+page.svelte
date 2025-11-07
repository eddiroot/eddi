<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import ArchiveIcon from '@lucide/svelte/icons/archive';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types.js';
	import { createTimetableDraftSchema } from './schema.js';

	let { data }: { data: PageData } = $props();

	let dialogOpen = $state(false);

	const form = superForm(data.createTimetableForm, {
		validators: zod4(createTimetableDraftSchema),
		onUpdated: ({ form }) => {
			if (form.valid) {
				dialogOpen = false;
			}
		}
	});

	const { form: formData, enhance, constraints } = form;
</script>

<div class="mb-6 flex items-center justify-between">
	<div>
		<h1 class="text-2xl font-bold">Timetabling</h1>
		<h1 class="text-1xl font-bold">{data.timetable.name}</h1>
		<!-- <p class="text-muted-foreground mt-1">
			Welcome to eddi-Timetabling, your one-stop solution for managing your school timetables
			efficiently.
		</p> -->
	</div>
	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>
			<PlusIcon />
			Create New</Dialog.Trigger
		>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>Create New Timetable Draft</Dialog.Title>
			</Dialog.Header>
			<form method="POST" action="?/createTimetableDraft" use:enhance>
				<div class="grid gap-4 py-4">
					<Form.Field {form} name="name">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Name</Form.Label>
								<Input {...props} bind:value={$formData.name} placeholder="Version 1.0" />
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
						Create New Draft
					</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
</div>

{#if data.timetableDrafts.length === 0}
	<Card.Root class="p-8 text-center">
		<Card.Content class="pt-6">
			<CalendarIcon class="text-muted-foreground mx-auto mb-4 h-12 w-12" />
			<Card.Title class="mb-2 text-lg">No drafts yet</Card.Title>
			<Card.Description class="mb-4">
				Get started by creating your first timetable draft for your school.
			</Card.Description>
		</Card.Content>
	</Card.Root>
{:else}
	<div class="grid gap-4">
		{#each data.timetableDrafts as draft}
			<a href={`/admin/timetables/${data.timetable.id}/${draft.id}/times`}>
				<Card.Root>
					<Card.Header class="flex items-center justify-between">
						<div class="flex items-center gap-4">
							<div class="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
								<CalendarIcon class="text-primary h-6 w-6" />
							</div>
							<div class="flex flex-col">
								<Card.Title class="text-lg font-semibold">{draft.name}</Card.Title>
								<div class="mt-1 flex items-center gap-2">
									<Badge variant="secondary" class="text-xs">
										{draft.createdAt.toLocaleDateString(undefined, {
											year: 'numeric',
											month: 'short',
											day: 'numeric'
										})}
									</Badge>
									{#if draft.isArchived}
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

<div class="text-muted-foreground mt-8 border-t pt-4 text-center text-sm">Powered by FET</div>
