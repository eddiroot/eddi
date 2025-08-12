<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { ArrowLeft, Calendar, Clock, MapPin } from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Button from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { createSchoolEventSchema } from '../schemas';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const form = superForm(data.form, {
		validators: zod4(createSchoolEventSchema),
		resetForm: false
	});

	const { form: formData, enhance, submitting } = form;
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<Button.Root variant="ghost" size="icon" href="/admin/events">
			<ArrowLeft class="h-4 w-4" />
		</Button.Root>
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Create School Event</h1>
			<p class="text-muted-foreground text-sm">
				Create a school-wide event that will appear on all student and staff timetables
			</p>
		</div>
	</div>

	<!-- Form -->
	<Card.Root class="max-w-2xl">
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Calendar class="h-5 w-5" />
				Event Details
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
								placeholder="e.g. Open Day, Speech Night"
								class="mt-1"
							/>
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
									<Clock class="h-4 w-4" />
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
									<Clock class="h-4 w-4" />
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
							Create School Event
						{/if}
					</Button.Root>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
