<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { formSchema, type FormSchema } from './schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Dropzone } from '$lib/components/ui/dropzone/index.js';
	import Label from '$lib/components/ui/label/label.svelte';

	let creationMethod = $state<'manual' | 'ai' >('manual');
	let aiFiles: FileList | null = $state(null); 

	$effect(() => {
		$formData.creationMethod = creationMethod;
	});

	function handleCreateManual() {
		creationMethod = 'manual';
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
	<div class="grid grid-cols-6 lg:grid-cols-12 gap-4">
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

	<div class="space-y-2 -mt-5">
		<Tabs.Root bind:value={creationMethod} class="w-full flex">
            <Tabs.List class="flex space-x-2 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600  text-white border-0 shadow-lg transition-all duration-200">
                <Tabs.Trigger value="manual" class="flex-1 data-[state=active]:shadow-sm data-[state=inactive]:text-white">Create Manual</Tabs.Trigger>
                <Tabs.Trigger value="ai" class="flex-1 data-[state=active]:shadow-sm data-[state=inactive]:text-white">Generate with AI</Tabs.Trigger>
            </Tabs.List>
            
            <Tabs.Content value="manual" class="mt-1"></Tabs.Content>      
            <Tabs.Content value="ai" class="mt-1 w-full">
				<div class="w-full">
				<Label class="text-sm font-medium">Supporting Material (Optional)</Label>
				<Label class="text-muted-foreground text-sm font-weight-normal font-medium space-y-3">
					Upload materials for AI to analyse and generate lesson content from.
				</Label>
				<div class="w-full max-w-none">
                 <Dropzone 
					id="ai-dropzone" 
					bind:files={aiFiles}
					accept=".png,.jpg,.jpeg,.pdf"
					multiple={true}
                    />
				</div>
			</div>
            </Tabs.Content>
        </Tabs.Root>
    </div>




	<input type="hidden" name="creationMethod" bind:value={$formData.creationMethod} />

    <div class="flex justify-end gap-2">
        <Form.Button 
            type="submit" 
            onclick={handleCreateManual}
        >
            Create
        </Form.Button>
    </div>
</form>
