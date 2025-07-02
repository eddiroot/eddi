<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { formSchema, type FormSchema } from './schema';
	import { filesSchema } from './schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { Dropzone } from '$lib/components/ui/dropzone/index.js';
	import Label from '$lib/components/ui/label/label.svelte';
	import LoaderIcon from '@lucide/svelte/icons/loader';
	import { lessonTypeEnum } from '$lib/server/db/schema';

	let aiFiles: FileList | null = $state(null);
	let fileValidationErrors = $state<string[]>([]);
	let fileInputRef: HTMLInputElement;
	let isSubmitting = $state(false);

	let {
		data
	}: {
		data: {
			form: SuperValidated<Infer<FormSchema>>;
			lessonTopics: Array<{ id: number; name: string }>;
		};
	} = $props();

	const form = superForm(data.form, {
		validators: zodClient(formSchema),
		onSubmit: ({ formData, cancel }) => {
			// Check if it's AI creation method
			const method = formData.get('creationMethod');
			if (method === 'ai') {
				isSubmitting = true;
			}
		},
		onResult: ({ result }) => {
			// Reset loading state on any result
			isSubmitting = false;
		},
		onError: () => {
			// Reset loading state on error
			isSubmitting = false;
		}
	});

	const { form: formData, enhance } = form;

	// Set default lesson type to 'lesson'
	$effect(() => {
		if (!$formData.type) {
			$formData.type = lessonTypeEnum.lesson;
		}
	});

	// Topic selection state
	let selectedTopicId = $state('');
	let newTopicName = $state('');
	let isCreatingNewTopic = $state(false);

	// Handle topic selection/creation
	$effect(() => {
		if (isCreatingNewTopic) {
			$formData.lessonTopicId = undefined;
			$formData.newTopicName = newTopicName;
		} else if (selectedTopicId) {
			$formData.lessonTopicId = parseInt(selectedTopicId, 10);
			$formData.newTopicName = undefined;
		} else {
			$formData.lessonTopicId = undefined;
			$formData.newTopicName = undefined;
		}
	});

	// Connect aiFiles to form and validate
	$effect(() => {
		if (aiFiles && aiFiles.length > 0) {
			const fileArray = Array.from(aiFiles);
			$formData.files = fileArray;

			// Also update the hidden file input
			if (fileInputRef) {
				const dataTransfer = new DataTransfer();
				fileArray.forEach((file) => dataTransfer.items.add(file));
				fileInputRef.files = dataTransfer.files;
			}

			const validationResult = filesSchema.safeParse(fileArray);

			if (validationResult.success) {
				fileValidationErrors = [];
			} else {
				fileValidationErrors = validationResult.error.errors.map((err) => err.message);
			}
		} else {
			$formData.files = undefined;
			if (fileInputRef) {
				fileInputRef.files = null;
			}
			fileValidationErrors = [];
		}
	});

	function formatDateForInput(date: Date | null | undefined): string {
		if (!date) return '';
		return date.toISOString().split('T')[0];
	}

	function parseDateFromInput(dateString: string): Date | undefined {
		return dateString ? new Date(dateString) : undefined;
	}

	let dueDateString = $state(formatDateForInput($formData.dueDate));

	$effect(() => {
		$formData.dueDate = parseDateFromInput(dueDateString);
	});
</script>

<!-- Loading Overlay -->
{#if isSubmitting}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div
			class="mx-4 flex max-w-sm flex-col items-center space-y-4 rounded-lg bg-white p-8 shadow-xl dark:bg-gray-800"
		>
			<LoaderIcon class="h-12 w-12 animate-spin text-blue-600" />
			<div class="text-center">
				<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Generating Lesson</h3>
				<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
					Please wait while we create your lesson...
				</p>
			</div>
		</div>
	</div>
{/if}

<form
	method="POST"
	action="?/createLesson"
	class="max-w-3xl space-y-6"
	enctype="multipart/form-data"
	use:enhance
>
	<!-- Title and Description fields remain the same -->
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

	<!-- Updated Topic selection -->
	<div class="grid grid-cols-6 gap-4 lg:grid-cols-12">
		<div class="col-span-6">
			<Form.Field {form} name="lessonTopicId">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Topic</Form.Label>
						{#if isCreatingNewTopic}
							<div class="relative">
								<Input
									bind:value={newTopicName}
									placeholder="Enter new topic name"
									class="w-full pr-8"
								/>
								<button
									type="button"
									class="absolute top-1/2 right-2 -translate-y-1/2 transform p-1 text-gray-400 hover:text-gray-600"
									onclick={() => {
										isCreatingNewTopic = false;
										newTopicName = '';
									}}
									aria-label="Cancel creating new topic"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>
						{:else}
							<Select.Root
								type="single"
								bind:value={selectedTopicId}
								name={props.name}
								onValueChange={(value) => {
									if (value === '__create_new__') {
										isCreatingNewTopic = true;
										selectedTopicId = '';
									} else {
										selectedTopicId = value || '';
									}
								}}
							>
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
									<Select.Separator />
									<Select.Item value="__create_new__" label="Create new topic" />
								</Select.Content>
							</Select.Root>
						{/if}
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<!-- Week and Due Date fields remain the same -->
		<div class="col-span-3">
			<Form.Field {form} name="type">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Type</Form.Label>
						<Select.Root type="single" bind:value={$formData.type} name={props.name}>
							<Select.Trigger {...props} class="w-full">
								<span class="capitalize">
									{$formData.type || 'Select type'}
								</span>
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="lesson" label="Lesson">
									<span class="capitalize">Lesson</span>
								</Select.Item>
								<Select.Item value="homework" label="Homework">
									<span class="capitalize">Homework</span>
								</Select.Item>
								<Select.Item value="assessment" label="Assessment">
									<span class="capitalize">Assessment</span>
								</Select.Item>
							</Select.Content>
						</Select.Root>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<!-- Conditional Due Date field - only show for homework and assignment -->
		{#if $formData.type === 'homework' || $formData.type === 'assessment'}
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
		{/if}
	</div>

	<div>
		<Label>Supporting Material (optional)</Label>
		<ul class="text-muted-foreground my-2 list-disc pl-4 text-sm font-medium">
			<li>If you upload material here, we will use it to scaffold the lesson.</li>
			<li>If you would instead like to create the lesson from scratch, please leave this empty.</li>
		</ul>

		{#if fileValidationErrors.length > 0}
			<div class="mt-2 space-y-1">
				{#each fileValidationErrors as error}
					<p class="text-destructive text-sm">{error}</p>
				{/each}
			</div>
		{/if}

		<Dropzone bind:files={aiFiles} accept=".png,.jpg,.jpeg,.pdf" multiple={true} />
	</div>

	<!-- Hidden inputs for new topic -->
	<input type="hidden" name="newTopicName" bind:value={$formData.newTopicName} />

	<!-- Add hidden file input -->
	<input
		bind:this={fileInputRef}
		type="file"
		name="files"
		multiple
		accept=".png,.jpg,.jpeg,.pdf"
		class="hidden"
		aria-hidden="true"
	/>

	<div class="flex justify-end gap-2">
		<Form.Button type="submit" disabled={fileValidationErrors.length > 0 || isSubmitting}>
			{#if isSubmitting}
				<LoaderIcon class="mr-2 h-4 w-4 animate-spin" />
				Generating...
			{:else}
				Create
			{/if}
		</Form.Button>
	</div>
</form>
