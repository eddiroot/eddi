<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { taskSubmissionSchema } from '$lib/server/schema/taskSubmissionSchema';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import FileIcon from '@lucide/svelte/icons/file';
	import ImageIcon from '@lucide/svelte/icons/image';
	import VideoIcon from '@lucide/svelte/icons/video';
	import MusicIcon from '@lucide/svelte/icons/music';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';

	let { data } = $props();

	const form = superForm(data.form, {
		validators: zodClient(taskSubmissionSchema)
	});

	const { form: formData, enhance, submitting } = form;

	let fileInput: HTMLInputElement;
	let selectedFiles: File[] = $state([]);

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			selectedFiles = Array.from(target.files);
			$formData.files = selectedFiles;
		}
	}

	function removeFile(index: number) {
		selectedFiles = selectedFiles.filter((_, i) => i !== index);
		$formData.files = selectedFiles.length > 0 ? selectedFiles : undefined;
		
		// Reset file input
		if (fileInput) {
			fileInput.value = '';
		}
	}

	function getFileIcon(file: File) {
		if (file.type.startsWith('image/')) return ImageIcon;
		if (file.type.startsWith('video/')) return VideoIcon;
		if (file.type.startsWith('audio/')) return MusicIcon;
		if (file.type === 'application/pdf' || file.type.includes('document')) return FileTextIcon;
		return FileIcon;
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	// Check if user has already submitted
	const hasSubmitted = data.existingSubmission?.status === 'submitted';
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
	</div>

	<!-- Rubric Section -->
	{#if data.rubric}
		<Card.Root class="mb-8">
			<Card.Header>
				<Card.Title>Assessment Rubric</Card.Title>
				<Card.Description>This rubric will be used to evaluate your submission</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="overflow-x-auto">
					<table class="w-full border-collapse border border-border">
						<thead>
							<tr>
								<th class="border border-border p-3 text-left font-semibold bg-muted">Criteria</th>
								<th class="border border-border p-3 text-center font-semibold bg-muted">Exemplary</th>
								<th class="border border-border p-3 text-center font-semibold bg-muted">Accomplished</th>
								<th class="border border-border p-3 text-center font-semibold bg-muted">Developing</th>
								<th class="border border-border p-3 text-center font-semibold bg-muted">Beginning</th>
							</tr>
						</thead>
						<tbody>
							{#each data.rubric.rows as row}
								<tr>
									<td class="border border-border p-3 font-medium">{row.row.title}</td>
									{#each row.cells as cell}
										<td class="border border-border p-3 text-sm">
											<div class="space-y-1">
												<p>{cell.description}</p>
												<Badge variant="outline" class="text-xs">
													{cell.marks} marks
												</Badge>
											</div>
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Submission Form -->
	<form method="POST" action="?/submit" use:enhance>
		<Card.Root>
			<Card.Header>
				<Card.Title>Your Submission</Card.Title>
				<Card.Description>
					{#if hasSubmitted}
						You have already submitted this task. You can update your submission below.
					{:else}
						Upload your work and add any comments about your submission.
					{/if}
				</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-6">
				<!-- Resource Upload Section -->
				<div class="space-y-4">
					<div>
						<Label for="files" class="text-sm font-medium">Upload Files</Label>
						<p class="text-sm text-muted-foreground">
							Upload documents, images, videos, or other files related to your submission.
						</p>
					</div>

					<!-- File Input -->
					<div class="border-2 border-dashed border-border rounded-lg p-6 text-center">
						<input
							bind:this={fileInput}
							type="file"
							class="hidden"
							multiple
							onchange={handleFileSelect}
							accept="*/*"
						/>
						
						<div class="space-y-2">
							<UploadIcon class="h-12 w-12 mx-auto text-muted-foreground" />
							<div>
								<Button type="button" variant="secondary" onclick={() => fileInput?.click()}>
									Choose Files
								</Button>
							</div>
							<p class="text-sm text-muted-foreground">
								Select multiple files to upload with your submission
							</p>
						</div>
					</div>

					<!-- Selected Files -->
					{#if selectedFiles.length > 0}
						<div class="space-y-2">
							<Label class="text-sm font-medium">Selected Files ({selectedFiles.length})</Label>
							<div class="space-y-2">
								{#each selectedFiles as file, index}
									{@const IconComponent = getFileIcon(file)}
									<div class="flex items-center justify-between p-3 border border-border rounded-lg">
										<div class="flex items-center gap-3">
											<IconComponent class="h-5 w-5 text-muted-foreground" />
											<div>
												<p class="text-sm font-medium">{file.name}</p>
												<p class="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
											</div>
										</div>
										<Button 
											type="button" 
											variant="ghost" 
											size="sm"
											onclick={() => removeFile(index)}
										>
											Remove
										</Button>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Existing Resources (if any) -->
					{#if data.existingResources.length > 0}
						<div class="space-y-2">
							<Label class="text-sm font-medium">Previously Uploaded Files</Label>
							<div class="space-y-2">
								{#each data.existingResources as resourceData}
									{@const resource = resourceData.resource as any}
									<div class="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/50">
										<FileIcon class="h-5 w-5 text-muted-foreground" />
										<div>
											<p class="text-sm font-medium">{resource.fileName}</p>
											<p class="text-xs text-muted-foreground">
												{formatFileSize(resource.fileSize)} • {resource.resourceType}
											</p>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
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
