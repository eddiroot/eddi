<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { schoolFormSchema, type SchoolFormSchema } from './schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	let {
		data
	}: {
		data: {
			form: SuperValidated<Infer<SchoolFormSchema>>;
			school: { name: string; emailSuffix: string } | null;
		};
	} = $props();

	const form = superForm(data.form, {
		validators: zodClient(schoolFormSchema),
		resetForm: false
	});

	const { form: formData, enhance } = form;
</script>

<form method="POST" class="max-w-2xl space-y-6" use:enhance>
	<Form.Field {form} name="name">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>School Name</Form.Label>
				<Input
					{...props}
					bind:value={$formData.name}
					placeholder="Enter your school name"
					class="text-lg"
				/>
			{/snippet}
		</Form.Control>
		<Form.Description>
			This is the official name of your school that will appear throughout the system.
		</Form.Description>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="emailSuffix">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Email Domain</Form.Label>
				<div class="flex items-center">
					<span class="text-muted-foreground mr-1">@</span>
					<Input
						{...props}
						bind:value={$formData.emailSuffix}
						placeholder="school.edu"
						class="flex-1"
					/>
				</div>
			{/snippet}
		</Form.Control>
		<Form.Description>
			The email domain for your school (e.g., "school.edu" for emails like "student@school.edu").
		</Form.Description>
		<Form.FieldErrors />
	</Form.Field>

	<div class="flex justify-end gap-2">
		<Form.Button type="submit">Update School Details</Form.Button>
	</div>
</form>
