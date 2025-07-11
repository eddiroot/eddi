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
	import * as Tabs from '$lib/components/ui/tabs/index.js';

	let creationMethod = $state<'manual' | 'ai'>('ai');
	let aiFiles: FileList | null = $state(null);
	let fileValidationErrors = $state<string[]>([]);
	let fileInputRef: HTMLInputElement;
	let isSubmitting = $state(false);

	let {
		data
	}: {
		data: {
			form: SuperValidated<Infer<FormSchema>>;
			taskTopics: Array<{ id: number; name: string }>;
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

	// Set default task type and handle topic requirements
	$effect(() => {
		if (!$formData.type) {
			$formData.type = 'lesson';
		}
		
		// If no topics are available, automatically switch to create new topic mode
		if (data.taskTopics.length === 0 && !isCreatingNewTopic) {
			isCreatingNewTopic = true;
		}
	});

	// Topic selection state
	let selectedTopicId = $state('');
	let newTopicName = $state('');
	let isCreatingNewTopic = $state(false);
	
	// Learning area content state
	let learningAreaContents = $state<Array<{
		id: number;
		name: string;
		description: string;
	}>>([]);
	let selectedLearningAreaContentIds = $state<number[]>([]);
	let isLoadingLearningContent = $state(false);

	$effect(() => {
		$formData.creationMethod = creationMethod;
	});

	// Load learning area content when topic changes
	$effect(() => {
		if (selectedTopicId && !isCreatingNewTopic && selectedTopicId !== '') {
			isLoadingLearningContent = true;
			
			// Use a separate async function to handle the fetch
			const loadContent = async () => {
				try {
					const response = await fetch(`/api/tasks?courseMapItemId=${selectedTopicId}`);
					if (response.ok) {
						const data = await response.json();
						learningAreaContents = data.learningAreaContents || [];
					} else {
						console.error('Failed to load learning content');
						learningAreaContents = [];
					}
				} catch (error) {
					console.error('Error loading learning content:', error);
					learningAreaContents = [];
				} finally {
					isLoadingLearningContent = false;
				}
			};
			
			loadContent();
		} else {
			learningAreaContents = [];
			isLoadingLearningContent = false;
		}
		// Reset selected content when topic changes
		selectedLearningAreaContentIds = [];
	});

	// Connect selected learning area content IDs to form data
	$effect(() => {
		$formData.selectedLearningAreaContentIds = selectedLearningAreaContentIds;
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
{#if isSubmitting && creationMethod === 'ai'}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div
			class="mx-4 flex max-w-sm flex-col items-center space-y-4 rounded-lg bg-white p-8 shadow-xl dark:bg-gray-800"
		>
			<LoaderIcon class="text-primary h-12 w-12 animate-spin" />
			<div class="text-center">
				<h3 class="text-secondary text-lg font-semibold">Generating Task</h3>
				<p class="text-muted-foreground mt-1 text-sm">Please wait while we create your task...</p>
			</div>
		</div>
	</div>
{/if}

<form
	method="POST"
	action="?/createTask"
	class="max-w-3xl space-y-6"
	enctype="multipart/form-data"
	use:enhance
>
	<!-- Title and Description fields remain the same -->
	<Form.Field {form} name="title">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Title</Form.Label>
				<Input {...props} bind:value={$formData.title} placeholder="Enter the task title" />
			{/snippet}
		</Form.Control>
		<Form.Description>Provide a clear and descriptive title for your task.</Form.Description>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="description">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Description</Form.Label>
				<Textarea
					{...props}
					bind:value={$formData.description}
					placeholder="Describe what students will learn in this task"
					rows={4}
				/>
			{/snippet}
		</Form.Control>
		<Form.Description>
			Briefly describe the task content and learning objectives (max 500 characters).
		</Form.Description>
		<Form.FieldErrors />
	</Form.Field>

	<!-- Updated Topic selection -->
	<div class="grid grid-cols-6 gap-4 lg:grid-cols-12">
		<div class="col-span-6">
			<Form.Field {form} name="taskTopicId">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Topic</Form.Label>
						{#if isCreatingNewTopic}
							<div class="relative">
								<Input
									bind:value={newTopicName}
									placeholder="Enter new topic name"
									class="w-full pr-8"
									oninput={() => {
										$formData.newTopicName = newTopicName;
									}}
								/>
								<button
									type="button"
									class="absolute top-1/2 right-2 -translate-y-1/2 transform p-1 text-gray-400 hover:text-gray-600"
									onclick={() => {
										isCreatingNewTopic = false;
										newTopicName = '';
										$formData.newTopicName = '';
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
										$formData.taskTopicId = undefined;
									} else {
										selectedTopicId = value || '';
										$formData.taskTopicId = value ? parseInt(value, 10) : undefined;
										console.log('Selected topic ID:', selectedTopicId, 'Form data:', $formData.taskTopicId);
									}
								}}
							>
								<Select.Trigger {...props} class="w-full truncate">
									<span class="truncate">
										{selectedTopicId
											? data.taskTopics.find((t) => t.id.toString() === selectedTopicId)?.name ||
												'Select a topic'
											: 'Select a topic'}
									</span>
								</Select.Trigger>
								<Select.Content>
									{#if data.taskTopics.length === 0}
										<Select.Item value="" label="No topics available - please create one" disabled />
									{:else}
										{#each data.taskTopics as topic}
											<Select.Item value={topic.id.toString()} label={topic.name} />
										{/each}
										<Select.Separator />
									{/if}
									<Select.Item value="__create_new__" label="Create new topic" />
								</Select.Content>
							</Select.Root>
						{/if}
					{/snippet}
				</Form.Control>
				<Form.Description>
					{#if data.taskTopics.length === 0}
						No topics available. Please create a new topic to organize your task.
					{:else}
						Select an existing topic or create a new one to organize your task.
					{/if}
				</Form.Description>
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
							<Form.Label>Due Date (optional)</Form.Label>
							<Input {...props} type="date" bind:value={dueDateString} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>
		{/if}
	</div>

	<!-- Learning Area Content Selection -->
	{#if (learningAreaContents.length > 0 || isLoadingLearningContent) && !isCreatingNewTopic && selectedTopicId}
		<div class="space-y-4">
			<div>
				<Label class="text-base font-medium">Learning Area Content (Optional)</Label>
				<p class="text-muted-foreground text-sm">
					Select specific curriculum content to guide task generation. This helps ensure alignment with learning objectives.
				</p>
			</div>
			
			{#if isLoadingLearningContent}
				<div class="flex items-center justify-center py-8">
					<LoaderIcon class="h-6 w-6 animate-spin text-gray-500" />
					<span class="ml-2 text-sm text-gray-500">Loading content...</span>
				</div>
			{:else if learningAreaContents.length === 0}
				<div class="text-center py-8">
					<p class="text-muted-foreground text-sm">No learning area content found for this topic.</p>
				</div>
			{:else}
				<div class="grid gap-3 max-h-96 overflow-y-auto">
					{#each learningAreaContents as content (content.id)}
						<div class="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
							<label class="flex items-start space-x-3 cursor-pointer">
								<input
									type="checkbox"
									bind:group={selectedLearningAreaContentIds}
									value={content.id}
									class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
								/>
								<div class="flex-1 min-w-0">
									<div class="font-medium text-sm">{content.name}</div>
									{#if content.description}
										<div class="text-gray-600 dark:text-gray-400 text-xs mt-1">{content.description}</div>
									{/if}
								</div>
							</label>
						</div>
					{/each}
				</div>
				
				{#if selectedLearningAreaContentIds.length > 0}
					<div class="text-sm text-green-600 dark:text-green-400">
						{selectedLearningAreaContentIds.length} content item{selectedLearningAreaContentIds.length !== 1 ? 's' : ''} selected for task generation
					</div>
				{/if}
			{/if}
		</div>
	{/if}

	<div>
		{#if fileValidationErrors.length > 0}
			<div class="mt-2 space-y-1">
				{#each fileValidationErrors as error}
					<p class="text-destructive text-sm">{error}</p>
				{/each}
			</div>
		{/if}

		<Tabs.Root bind:value={creationMethod} class="flex w-full gap-0">
			<Tabs.List class="w-full rounded-b-none">
				<Tabs.Trigger value="ai">Generate with AI</Tabs.Trigger>
				<Tabs.Trigger value="manual">Create Manually</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="manual" class="bg-muted rounded-b-lg">
				<div class="flex h-[254px] w-full items-center justify-center p-2">
					<p class="text-muted-foreground text-sm font-medium">
						Switch to <span class="font-semibold">Generate with AI</span> to add supporting material.
					</p>
				</div>
			</Tabs.Content>
			<Tabs.Content value="ai" class="bg-muted rounded-b-lg p-2">
				<div class="w-full">
					<div class="p-1">
						<Label>Supporting Material (Optional)</Label>
						<p class="text-muted-foreground mt-1 text-sm font-medium">
							Upload materials for AI to analyse and generate task content from.
						</p>
					</div>

					<!-- Display validation errors -->
					{#if fileValidationErrors.length > 0}
						<div class="mt-2 space-y-1">
							{#each fileValidationErrors as error}
								<p class="text-destructive text-sm">{error}</p>
							{/each}
						</div>
					{/if}

					<Dropzone bind:files={aiFiles} accept=".png,.jpg,.jpeg,.pdf" multiple={true} />
				</div>
			</Tabs.Content>
		</Tabs.Root>
	</div>

	<input type="hidden" name="newTopicName" bind:value={$formData.newTopicName} />
	<input type="hidden" name="creationMethod" bind:value={$formData.creationMethod} />
	<input type="hidden" name="selectedLearningAreaContentIds" value={JSON.stringify(selectedLearningAreaContentIds)} />

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
		<Form.Button type="submit" disabled={
			fileValidationErrors.length > 0 || 
			isSubmitting || 
			(!selectedTopicId && !newTopicName.trim() && !isCreatingNewTopic)
		}>
			{#if isSubmitting && creationMethod === 'ai'}
				<LoaderIcon class="mr-2 h-4 w-4 animate-spin" />
				Generating...
			{:else}
				Create
			{/if}
		</Form.Button>
	</div>
</form>
