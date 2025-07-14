<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { schoolFormSchema, type SchoolFormSchema } from './schema';
	import { type SuperValidated, type Infer, superForm, fileProxy } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	// If we want to add a file preview in future, refer to the on:input section
	// of this documentation: https://superforms.rocks/concepts/files#returning-files-in-form-actions

	let {
		data
	}: {
		data: {
			form: SuperValidated<Infer<SchoolFormSchema>>;
			school: { name: string; logoUrl: string | null } | null;
		};
	} = $props();

	const form = superForm(data.form, {
		validators: zodClient(schoolFormSchema),
		resetForm: false
	});

	const { form: formData, enhance: enhanceForm } = form;

	function getSchoolInitials(name: string): string {
		return name
			.split(' ')
			.map((word) => word[0]?.toUpperCase())
			.join('')
			.slice(0, 2);
	}

	const file = fileProxy(form, 'logo');
</script>

<!-- School Details Form -->
<form method="POST" enctype="multipart/form-data" class="max-w-2xl space-y-8" use:enhanceForm>
	<!-- Logo Section -->
	<div class="flex items-center gap-6">
		<Avatar.Root class="h-20 w-20">
			{#if data.school?.logoUrl}
				<Avatar.Image src={data.school.logoUrl} alt="Current school logo" />
			{:else}
				<Avatar.Fallback class="text-lg">
					{data.school?.name ? getSchoolInitials(data.school.name) : 'SL'}
				</Avatar.Fallback>
			{/if}
		</Avatar.Root>

		<Form.Field {form} name="logo">
			<Form.Control>
				<Form.Label>School Logo</Form.Label>
				<Input
					id="logo"
					name="logo"
					type="file"
					accept="image/jpeg,image/jpg,image/png,image/webp"
					bind:files={$file}
				/>
			</Form.Control>
			<Form.Description>
				Upload a JPEG, PNG, or WebP image. Maximum file size: 5MB.
			</Form.Description>
			<Form.FieldErrors />
		</Form.Field>
	</div>

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

	<div class="flex justify-end gap-2">
		<Form.Button type="submit">Save School Details</Form.Button>
	</div>
</form>
