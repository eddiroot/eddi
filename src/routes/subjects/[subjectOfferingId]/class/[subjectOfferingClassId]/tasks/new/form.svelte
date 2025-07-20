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
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import BadgeInfo from '@lucide/svelte/icons/badge-info';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as HoverCard from '$lib/components/ui/hover-card/index.js';
	import { Switch } from '$lib/components/ui/switch';

	import type { curriculumLearningAreaStandard } from '$lib/server/db/service/task.js';

	let creationMethod = $state<'manual' | 'ai'>('ai');
	let aiFiles: FileList | null = $state(null);
	let fileValidationErrors = $state<string[]>([]);
	let fileInputRef: HTMLInputElement;
	let isSubmitting = $state(false);

	function stopProp(e: any) {
		e.stopPropagation();
	}

	let {
		data
	}: {
		data: {
			form: SuperValidated<Infer<FormSchema>>;
			taskTopics: Array<{ id: number; name: string }>;
			learningAreaWithContents: curriculumLearningAreaStandard[] | null;
		};
	} = $props();

	const form = superForm(data.form, {
		validators: zodClient(formSchema),
		onSubmit: ({ formData, cancel }) => {
			// Check if it's AI creation method
			const method = formData.get('creationMethod');
			const taskType = formData.get('type');
			console.log('Form submission:', { method, taskType });
			
			if (method === 'ai') {
				isSubmitting = true;
				console.log('Starting AI task generation...');
			}
		},
		onResult: ({ result }) => {
			// Reset loading state on any result
			isSubmitting = false;
			console.log('Form submission result:', result);
			
			// Handle error responses from server
			if (result.type === 'success' && result.data?.error) {
				console.error('Server error:', result.data.error);
				alert(`Task creation failed: ${result.data.error}`);
			}
		},
		onError: (error) => {
			// Reset loading state on error
			isSubmitting = false;
			console.error('Form submission error:', error);
			alert('An error occurred while creating the task. Please try again.');
		}
	});

	const { form: formData, enhance } = form;

	// Handle topic requirements
	$effect(() => {
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
	let learningAreaContents = $state<curriculumLearningAreaStandard[]>([]);
	let selectedLearningAreaContentIds = $state<string[]>([]);
	let isLoadingLearningContent = $state(false);

	// Curriculum content dropdown state

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
						// API now returns grouped learningAreaWithContents
						learningAreaContents = data.learningAreaWithContents || [];
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
	// Connect selected curriculum content IDs to form data
	$effect(() => {
		$formData.selectedLearningAreaContentIds = selectedLearningAreaContentIds.map((id) =>
			parseInt(id, 10)
		);
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
			class="bg-background mx-4 flex max-w-sm flex-col items-center space-y-4 rounded-lg p-8 shadow-xl"
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
	class="max-w-3xl space-y-4"
	enctype="multipart/form-data"
	use:enhance
>
	<!-- Header row: Title left, Task Type Tabs right -->
	<div class="mb-2 flex items-center justify-between">
		<h1 class="py-2 text-4xl font-bold">Create New Task</h1>
		<Tabs.Root bind:value={$formData.type} class="flex gap-2">
			<Tabs.List class="bg-muted flex gap-1 rounded-lg">
				<Tabs.Trigger value="lesson" class="px-4 py-2 text-sm font-medium capitalize"
					>Lesson</Tabs.Trigger
				>
				<Tabs.Trigger value="homework" class="px-4 py-2 text-sm font-medium capitalize"
					>Homework</Tabs.Trigger
				>
				<Tabs.Trigger value="assessment" class="px-4 py-2 text-sm font-medium capitalize"
					>Assessment</Tabs.Trigger
				>
			</Tabs.List>
		</Tabs.Root>
	</div>
	
	<!-- Hidden form field to ensure type is included in form submission -->
	<input type="hidden" name="type" bind:value={$formData.type} />
	
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

	<!-- Updated Topic selection and week/due date fields -->
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
										<Select.Item
											value=""
											label="No topics available - please create one"
											disabled
										/>
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
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<!-- Week and Due Date fields remain the same -->
		<div class="col-span-3">
			<Form.Field {form} name="week">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Week (optional)</Form.Label>
						<Input {...props} type="number" min="1" max="18" bind:value={$formData.week} />
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

	<Form.Field {form} name="selectedLearningAreaContentIds">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Curriculum Content</Form.Label>
				<Select.Root type="multiple" bind:value={selectedLearningAreaContentIds} name={props.name}>
					<Select.Trigger {...props} class="w-full">
						{#if selectedLearningAreaContentIds.length > 0}
							{selectedLearningAreaContentIds.length} selected
						{:else}
							Select curriculum content...
						{/if}
					</Select.Trigger>
					<Select.Content class="z-50 max-h-48 overflow-y-auto rounded-md border shadow-lg">
						{#if selectedTopicId && learningAreaContents.length > 0}
							{#each learningAreaContents as learningAreaGroup (learningAreaGroup.learningArea.id)}
								{#if learningAreaGroup.contents.length > 0}
									<Select.Group>
										<Select.GroupHeading>
											{learningAreaGroup.learningArea.name}
										</Select.GroupHeading>
										{#each learningAreaGroup.contents as content (content.id)}
											<Select.Item value={content.id.toString()} onclick={stopProp}>
												<div class="flex items-center">
													<span class="flex-1 truncate text-sm">{content.name}</span>
													<HoverCard.Root>
														<HoverCard.Trigger
															type="button"
															aria-label="Show description"
															class="ml-auto focus:outline-none"
														>
															<BadgeInfo class="h-4 w-4" />
														</HoverCard.Trigger>
														<HoverCard.Content
															class="z-50 max-w-xs rounded-lg border p-3 text-xs leading-relaxed shadow-lg"
														>
															{content.description}
														</HoverCard.Content>
													</HoverCard.Root>
												</div>
											</Select.Item>
										{/each}
									</Select.Group>
								{/if}
							{/each}
						{:else if data.learningAreaWithContents && data.learningAreaWithContents.length > 0}
							{#each data.learningAreaWithContents as learningAreaGroup (learningAreaGroup.learningArea.id)}
								{#if learningAreaGroup.contents.length > 0}
									<Select.Group>
										<Select.GroupHeading>
											{learningAreaGroup.learningArea.name}
										</Select.GroupHeading>
										{#each learningAreaGroup.contents as content (content.id)}
											<Select.Item value={content.id.toString()}>
												<div class="flex items-center">
													<span class="flex-1 truncate text-sm">{content.name}</span>
													<HoverCard.Root>
														<HoverCard.Trigger
															type="button"
															aria-label="Show description"
															class="ml-2 focus:outline-none"
														>
															<BadgeInfo class="h-4 w-4" />
														</HoverCard.Trigger>
														<HoverCard.Content
															class="z-50 max-w-xs rounded-lg border p-3 text-xs leading-relaxed shadow-lg"
														>
															{content.description}
														</HoverCard.Content>
													</HoverCard.Root>
												</div>
											</Select.Item>
										{/each}
									</Select.Group>
								{/if}
							{/each}
						{:else}
							<Select.Item value="" label="No curriculum content available" disabled />
						{/if}
					</Select.Content>
				</Select.Root>
			{/snippet}
		</Form.Control>
		<Form.Description>
			Select specific curriculum content to align with learning objectives.
		</Form.Description>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="aiTutorEnabled">
		<Form.Control>
			{#snippet children({ props })}
				<div class="flex items-center space-x-2">
					<Switch {...props} bind:checked={$formData.aiTutorEnabled} id="ai-tutor-toggle" />
					<Form.Label for="ai-tutor-toggle">Enable eddi AI Tutor</Form.Label>
				</div>
			{/snippet}
		</Form.Control>
		<Form.Description>
			Allow students to access the AI tutor while working on this task.
		</Form.Description>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="description">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Description (optional)</Form.Label>
				<Textarea
					{...props}
					bind:value={$formData.description}
					placeholder="Describe what students will learn in this task"
					rows={4}
				/>
			{/snippet}
		</Form.Control>
		<Form.Description>Briefly describe the task content (max 500 characters).</Form.Description>
		<Form.FieldErrors />
	</Form.Field>

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
						<Label>Supporting Material (optional)</Label>
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
		<Form.Button
			type="submit"
			disabled={fileValidationErrors.length > 0 ||
				isSubmitting ||
				(!selectedTopicId && !newTopicName.trim() && !isCreatingNewTopic)}
		>
			{#if isSubmitting && creationMethod === 'ai'}
				<LoaderIcon class="mr-2 h-4 w-4 animate-spin" />
				Generating...
			{:else}
				Create
			{/if}
		</Form.Button>
	</div>
</form>
