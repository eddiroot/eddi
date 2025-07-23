<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { EnhancedDropzone } from '$lib/components/ui/enhanced-dropzone';
	import Rubric from '$lib/components/rubric.svelte';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';

	let { data } = $props();

	const form = superForm(data.form, {
		onSubmit: ({ formData, cancel }) => {
			console.log('Form submitting...');
			const files = formData.getAll('files');
			console.log('Files in form:', files);
			const comment = formData.get('comment');
			console.log('Comment:', comment);
		},
		onResult: ({ result }) => {
			console.log('Form result:', result);
		},
		onError: ({ result }) => {
			console.log('Form error:', result);
		}
	});

	const { form: formData, enhance, submitting } = form;

	let uploadedFiles: FileList | null = $state(null);
	let hiddenFileInput: HTMLInputElement;

	// Convert existing resources to the format expected by EnhancedDropzone
	const existingFiles = $derived(data.existingResources.map((resourceData) => {
		const resource = resourceData.resource as any;
		return {
			id: resource.id,
			name: resource.name,
			fileName: resource.fileName,
			size: resource.fileSize,
			resourceType: resource.resourceType
		};
	}));

	// Sync files between enhanced dropzone and hidden form input
	$effect(() => {
		if (uploadedFiles && uploadedFiles.length > 0 && hiddenFileInput) {
			hiddenFileInput.files = uploadedFiles;
		} else if (hiddenFileInput) {
			hiddenFileInput.value = '';
		}
	});

	// Check if user has already submitted
	const hasSubmitted = data.existingSubmission?.status === 'submitted';

	// Function to remove an existing file from the server
	async function removeExistingFile(resourceId: number, fileName: string) {
		const formData = new FormData();
		formData.set('resourceId', resourceId.toString());

		try {
			const response = await fetch('?/removeFile', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				// Reload the page to refresh the file list
				window.location.reload();
			} else {
				alert('Failed to remove file. Please try again.');
			}
		} catch (error) {
			console.error('Error removing file:', error);
			alert('Failed to remove file. Please try again.');
		}
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center justify-between mb-4">
			<h1 class="text-3xl font-bold">{data.task.title}</h1>
			{#if hasSubmitted}
				<Badge variant="secondary" class="flex items-center gap-2">
					<CheckCircleIcon class="h-4 w-4" />
					Submitted
				</Badge>
			{/if}
		</div>

		{#if data.task.description}
			<p class="text-muted-foreground text-lg mb-6">{data.task.description}</p>
		{/if}

		{#if hasSubmitted}
			<div class="p-4 border border-blue-200 bg-blue-50 rounded-lg mb-6">
				<p class="text-blue-800 text-sm">
					<strong>Update Submission:</strong> You can add new files to your submission or remove existing ones.
				</p>
			</div>
		{/if}
	</div>

	<!-- Rubric Section -->
	{#if data.rubric}
		<div class="mb-8">
			<Rubric rubricData={data.rubric} />
		</div>
	{/if}

	<!-- Submission Form -->
	<form method="POST" action="?/submit" enctype="multipart/form-data" use:enhance>
		<!-- Hidden file input for form submission -->
		<input
			bind:this={hiddenFileInput}
			type="file"
			name="files"
			multiple
			accept="*/*"
			class="hidden"
		/>
		
		<Card.Root>
			<Card.Content class="space-y-6 ">
				<!-- Resource Upload Section -->
				<div class="space-y-4">
					<div>
						<Label for="files" class="text-sm font-medium">Files</Label>
						<p class="text-sm text-muted-foreground">
							Add new files or remove existing ones using the file manager below.
						</p>
					</div>

					<!-- Enhanced Dropzone Component -->
					<EnhancedDropzone 
						bind:files={uploadedFiles} 
						{existingFiles}
						onRemoveExisting={removeExistingFile}
						multiple 
						accept="*/*" 
					/>
				</div>

				<Separator />

				<!-- Comment Section -->
				<Form.Field {form} name="comment">
					<Form.Control>
						<Form.Label>Comments (Optional)</Form.Label>
						<Form.Description>
							Add any comments or explanations about your submission that you'd like your teacher to know.
						</Form.Description>
						<Textarea
							name="comment"
							bind:value={$formData.comment}
							placeholder="Share any thoughts about your work, challenges you faced, or anything else you'd like your teacher to know..."
							class="min-h-[120px]"
						/>
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</Card.Content>
			<Card.Footer class="flex justify-between">
				<Button 
					type="button" 
					variant="outline" 
					onclick={() => history.back()}
				>
					Back to Task
				</Button>
				
				<Button 
					type="submit" 
					disabled={$submitting}
					class="min-w-[120px]"
					onclick={() => console.log('Submit button clicked, submitting:', $submitting)}
				>
					{#if $submitting}
						Submitting...
					{:else if hasSubmitted}
						Update Submission
					{:else}
						Submit Task
					{/if}
				</Button>
			</Card.Footer>
		</Card.Root>
	</form>
</div>
