<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { ArrowLeft, Calendar, Clock, Users } from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Button from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form';
	import * as Select from '$lib/components/ui/select';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { createSubjectOfferingClassEventSchema } from '../schemas';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const form = superForm(data.form, {
		validators: zod4(createSubjectOfferingClassEventSchema),
		resetForm: false
	});

	const { form: formData, enhance, submitting } = form;

	// Convert numeric form values to string for Select components
	let selectedClassId = $derived($formData.subjectOfferingClassId?.toString() || '');
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<Button.Root variant="ghost" size="icon" href="/admin/events">
			<ArrowLeft />
		</Button.Root>
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Create Class Event</h1>
			<p class="text-muted-foreground text-sm">Create an event for a specific class</p>
		</div>
	</div>

	<!-- Form -->
	<Card.Root class="max-w-2xl">
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Calendar class="h-5 w-5" />
				Class Event Details
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance class="space-y-6">
				<!-- Event Name -->
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Label for={props.id}>Event Name *</Label>
							<Input
								{...props}
								bind:value={$formData.name}
								placeholder="e.g. Class Test, Field Trip, Presentation Day, Group Assignment Due"
								class="mt-1"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Class Selection -->
				<Form.Field {form} name="subjectOfferingClassId">
					<Form.Control>
						{#snippet children({ props })}
							<Label for={props.id} class="flex items-center gap-2">
								<Users />
								Class *
							</Label>
							<Select.Root
								type="single"
								bind:value={selectedClassId}
								name={props.name}
								onValueChange={(value) => {
									$formData.subjectOfferingClassId = value ? parseInt(value) : 0;
								}}
							>
								<Select.Trigger {...props} class="mt-1">
									{#if selectedClassId}
										{@const selectedClass = data.classes.find(
											(c) => c.id.toString() === selectedClassId
										)}
										{selectedClass
											? `${selectedClass.subjectName} - Year ${selectedClass.subjectOffering.year} (${selectedClass.name})`
											: 'Select a class...'}
									{:else}
										Select a class...
									{/if}
								</Select.Trigger>
								<Select.Content>
									{#each data.classes as classItem}
										<Select.Item
											value={classItem.id.toString()}
											label="{classItem.subjectName} - Year {classItem.subjectOffering
												.year} ({classItem.name})"
										>
											{classItem.subjectName} - Year {classItem.subjectOffering.year} ({classItem.name})
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Date and Time -->
				<div class="grid gap-4 md:grid-cols-2">
					<Form.Field {form} name="startTimestamp">
						<Form.Control>
							{#snippet children({ props })}
								<Label for={props.id} class="flex items-center gap-2">
									<Clock />
									Start Date & Time *
								</Label>
								<Input
									{...props}
									bind:value={$formData.startTimestamp}
									type="datetime-local"
									class="mt-1"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="endTimestamp">
						<Form.Control>
							{#snippet children({ props })}
								<Label for={props.id} class="flex items-center gap-2">
									<Clock />
									End Date & Time *
								</Label>
								<Input
									{...props}
									bind:value={$formData.endTimestamp}
									type="datetime-local"
									class="mt-1"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>

				<!-- Action Buttons -->
				<div class="flex justify-end gap-3 pt-4">
					<Button.Root variant="outline" href="/admin/events">Cancel</Button.Root>
					<Button.Root type="submit" disabled={$submitting}>
						{#if $submitting}
							Creating Event...
						{:else}
							Create Class Event
						{/if}
					</Button.Root>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
