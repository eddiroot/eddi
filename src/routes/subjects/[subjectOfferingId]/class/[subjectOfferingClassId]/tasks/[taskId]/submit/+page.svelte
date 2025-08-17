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
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	const form = superForm(data.form);

	const { form: formData, enhance, submitting } = form;

	let uploadedFiles: FileList | null = $state(null);
	let hiddenFileInput: HTMLInputElement;

	const existingFiles = $derived(
		data.existingResources.map((resourceData) => {
			const resource = resourceData.resource as any;
			return {
				id: resource.id,
				name: resource.name,
				fileName: resource.fileName,
				size: resource.fileSize,
				resourceType: resource.resourceType
			};
		})
	);

	$effect(() => {
		if (uploadedFiles && uploadedFiles.length > 0 && hiddenFileInput) {
			hiddenFileInput.files = uploadedFiles;
		} else if (hiddenFileInput) {
			hiddenFileInput.value = '';
		}
	});

	const hasSubmitted = data.existingSubmission?.status === 'submitted';

	async function removeExistingFile(resourceId: number, fileName: string) {
		const formData = new FormData();
		formData.set('resourceId', resourceId.toString());

		try {
			const response = await fetch('?/removeFile', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				await invalidateAll();
			} else {
				alert('Failed to remove file. Please try again.');
			}
		} catch (error) {
			console.error('Error removing file:', error);
			alert('Failed to remove file. Please try again.');
		}
	}
</script>

<div class="container mx-auto max-w-4xl px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="mb-4 flex items-center justify-between">
			<h1 class="text-3xl font-bold">{data.task.title}</h1>
			{#if hasSubmitted}
				<Badge variant="secondary" class="flex items-center gap-2">
					<CheckCircleIcon class="h-4 w-4" />
					Submitted
				</Badge>
			{/if}
		</div>

		{#if data.task.description}
			<p class="text-muted-foreground mb-6 text-lg">{data.task.description}</p>
		{/if}

		{#if hasSubmitted}
			<div class="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
				<p class="text-sm text-blue-800">
					<strong>Update Submission:</strong> You can add new files to your submission or remove existing
					ones.
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
						<p class="text-muted-foreground text-sm">
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
							Add any comments or explanations about your submission that you'd like your teacher to
							know.
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
				<Button type="button" variant="outline" onclick={() => history.back()}>Back to Task</Button>

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
