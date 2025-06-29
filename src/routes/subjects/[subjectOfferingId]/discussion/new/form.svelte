<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { formSchema, type FormSchema } from './schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	let { data }: { data: { form: SuperValidated<Infer<FormSchema>> } } = $props();

	const form = superForm(data.form, {
		validators: zodClient(formSchema)
	});

	const { form: formData, enhance } = form;
</script>

<form method="POST" action="?/create" class="w-2/3 space-y-6" use:enhance>
	<Form.Field {form} name="type">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Type</Form.Label>
				<Select.Root type="single" bind:value={$formData.type} name={props.name}>
					<Select.Trigger {...props} class="w-full">
						{$formData.type == 'qanda'
							? 'Q&A'
							: $formData.type.charAt(0).toUpperCase() + $formData.type.slice(1)}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="discussion" label="Discussion" />
						<Select.Item value="question" label="Question" />
						<Select.Item value="announcement" label="Announcement" />
						<Select.Item value="qanda" label="Q&A" />
					</Select.Content>
				</Select.Root>
			{/snippet}
		</Form.Control>
		<Form.Description>Dynamic explanation of the selected type.</Form.Description>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="title">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Title</Form.Label>
				<Input {...props} bind:value={$formData.title} placeholder="Enter the title of your post" />
			{/snippet}
		</Form.Control>
		<Form.Description>Provide a concise title for your post.</Form.Description>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="content">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Content</Form.Label>
				<Textarea
					{...props}
					bind:value={$formData.content}
					placeholder="Write your post content here"
				/>
			{/snippet}
		</Form.Control>
		<Form.Description>Share your thoughts, questions, or announcements.</Form.Description>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Button>Submit</Form.Button>
</form>
