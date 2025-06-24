<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { formSchema, type FormSchema } from './schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	let creationMethod = $state<'manual' | 'ai' >('manual');

	$effect(() => {
		$formData.creationMethod = creationMethod;
	});

	function handleCreateManual() {
		creationMethod = 'manual';
	}	

	function handleCreateWithAI() {
		creationMethod = 'ai';
	}

	let {
		data
	}: {
		data: {
			form: SuperValidated<Infer<FormSchema>>;
			lessonTopics: Array<{ id: number; name: string }>;
		};
	} = $props();

	const form = superForm(data.form, {
		validators: zodClient(formSchema)
	});

	const { form: formData, enhance } = form;

	function formatDateForInput(date: Date | null | undefined): string {
		if (!date) return '';
		return date.toISOString().split('T')[0];
	}

	function parseDateFromInput(dateString: string): Date | undefined {
		return dateString ? new Date(dateString) : undefined;
	}

	let dueDateString = $state(formatDateForInput($formData.dueDate));
	let selectedTopicId = $state($formData.lessonTopicId?.toString() || '');
	let file = $state($formData.file);

	$effect(() => {
		$formData.dueDate = parseDateFromInput(dueDateString);
	});

	$effect(() => {
		$formData.lessonTopicId = selectedTopicId ? parseInt(selectedTopicId, 10) : 0;
	});
</script>

<form
	method="POST"
	action="?/createLesson"
	class="w-2/3 space-y-6"
	enctype="multipart/form-data"
	use:enhance
>
	<Form.Field {form} name="title">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Title</Form.Label>
				<Input {...props} bind:value={$formData.title} placeholder="Enter the lesson title" />
			{/snippet}
		</Form.Control>
		<Form.Description>Provide a clear and descriptive title for your lesson.</Form.Description>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="description">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Description</Form.Label>
				<Textarea
					{...props}
					bind:value={$formData.description}
					placeholder="Describe what students will learn in this lesson"
					rows={4}
				/>
			{/snippet}
		</Form.Control>
		<Form.Description>
			Briefly describe the lesson content and learning objectives (max 500 characters).
		</Form.Description>
		<Form.FieldErrors />
	</Form.Field>

	<!-- Topic, Week, and Due Date Grid -->
	<div class="grid grid-cols-12 gap-4">
		<div class="col-span-6">
			<Form.Field {form} name="lessonTopicId">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Topic</Form.Label>
						<Select.Root type="single" bind:value={selectedTopicId} name={props.name}>
							<Select.Trigger {...props} class="w-full truncate">
								<span class="truncate">
									{selectedTopicId
										? data.lessonTopics.find((t) => t.id.toString() === selectedTopicId)?.name ||
											'Select a topic'
										: 'Select a topic'}
								</span>
							</Select.Trigger>
							<Select.Content>
								{#if data.lessonTopics.length === 0}
									<Select.Item value="" label="No topics available" disabled />
								{:else}
									{#each data.lessonTopics as topic}
										<Select.Item value={topic.id.toString()} label={topic.name} />
									{/each}
								{/if}
							</Select.Content>
						</Select.Root>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="col-span-3">
			<Form.Field {form} name="subjectWeek">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Week</Form.Label>
						<Input
							{...props}
							type="number"
							min="0"
							bind:value={$formData.subjectWeek}
							placeholder="1"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="col-span-3">
			<Form.Field {form} name="dueDate">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Due Date</Form.Label>
						<Input {...props} type="date" bind:value={dueDateString} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>
	</div>

	<Form.Field {form} name="file">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Supporting Material (Optional)</Form.Label>
				<Input {...props} bind:value={file} type="file" accept=".png,.jpg,.jpeg,.pdf" class="h-16 pt-4" />
			{/snippet}
		</Form.Control>
		<Form.Description>
			Upload supporting materials like PDFs, images, or other resources (max 5MB).
		</Form.Description>
		<Form.FieldErrors />
	</Form.Field>

	<input type="hidden" name="creationMethod" bind:value={$formData.creationMethod} />

	<div class="flex gap-4">
        <Form.Button 
            type="submit" 
            variant="outline"
            onclick={handleCreateManual}
        >
            Create Manual
        </Form.Button>
        
        <Form.Button 
            type="submit"
            onclick={handleCreateWithAI}
			class="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 hover:from-blue-600 hover:via-purple-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
        >
            Create with AI
        </Form.Button>
    </div>
</form>
