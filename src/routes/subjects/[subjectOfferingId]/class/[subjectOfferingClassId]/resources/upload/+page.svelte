<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import Button from '$lib/components/ui/button/button.svelte';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import { page } from '$app/state';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import { goto } from '$app/navigation';

	let { data } = $props();

	const uploadSchema = z.object({
		file: z.instanceof(File).refine((file) => file.size > 0, 'Please select a file to upload'),
		title: z.string().optional(),
		description: z.string().optional()
	});

	const form = superForm(data.form, {
		validators: zodClient(uploadSchema),
		onUpdated: ({ form }) => {
			if (form.valid) {
				// Navigate back to resources page on successful upload
				const resourcesUrl = page.url.pathname.replace('/upload', '');
				goto(resourcesUrl);
			}
		}
	});

	const { form: formData, enhance, submitting } = form;

	let fileInput: HTMLInputElement;
	let selectedFile = $state<File | null>(null);

	function handleFileSelect() {
		const files = fileInput?.files;
		if (files && files.length > 0) {
			selectedFile = files[0];
			$formData.file = selectedFile;
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}
</script>

<div class="h-screen flex flex-col">
	<!-- Header with title, class info, and back button -->
	<div class="border-b bg-background p-6">
		<div class="flex items-center justify-between">
			<div class="flex-1">
				<h1 class="text-3xl font-bold">Upload Resource</h1>
				{#if data.classDetails}
					<p class="text-muted-foreground mt-1">Class: {data.classDetails.subjectOfferingClass.name}</p>
				{/if}
			</div>
			<Button href={page.url.pathname.replace('/upload', '')} variant="ghost" size="sm">
				<ArrowLeftIcon class="h-4 w-4" />
				Back to Resources
			</Button>
		</div>
	</div>

	<!-- Main content area taking up remaining space -->
	<div class="flex-1 p-6">
		<div class="h-full max-w-2xl mx-auto">
			<Card.Root class="h-full">
				<Card.Header>
					<Card.Title>Upload a new resource</Card.Title>
					<Card.Description>
						Share files, documents, and other learning materials with your class.
					</Card.Description>
				</Card.Header>
				<Card.Content class="flex-1">
					<form method="post" use:enhance enctype="multipart/form-data" class="space-y-6 h-full flex flex-col">
						<div class="space-y-2">
							<label for="file-input" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
								Select File
							</label>
							<div class="space-y-4">
								<button
									type="button"
									class="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer w-full"
									onclick={() => fileInput?.click()}
								>
									{#if selectedFile}
										<div class="space-y-2">
											<UploadIcon class="mx-auto h-8 w-8 text-muted-foreground" />
											<div>
												<p class="text-sm font-medium">{selectedFile.name}</p>
												<p class="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
											</div>
										</div>
									{:else}
										<div class="space-y-2">
											<UploadIcon class="mx-auto h-8 w-8 text-muted-foreground" />
											<div>
												<p class="text-sm font-medium">Click to select a file</p>
												<p class="text-xs text-muted-foreground">or drag and drop</p>
											</div>
										</div>
									{/if}
								</button>
								<input
									bind:this={fileInput}
									id="file-input"
									name="file"
									type="file"
									class="hidden"
									onchange={handleFileSelect}
								/>
							</div>
						</div>

						<div class="space-y-2">
							<label for="title" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
								Title (Optional)
							</label>
							<input
								id="title"
								name="title"
								type="text"
								bind:value={$formData.title}
								placeholder="Enter a title for this resource..."
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							/>
						</div>

						<div class="space-y-2 flex-1">
							<label for="description" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
								Description (Optional)
							</label>
							<textarea
								id="description"
								name="description"
								bind:value={$formData.description}
								placeholder="Add a description for this resource..."
								class="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
							></textarea>
						</div>

						<div class="flex justify-end gap-3 pt-4">
							<Button type="button" variant="outline" href={page.url.pathname.replace('/upload', '')}>
								Cancel
							</Button>
							<Button type="submit" disabled={!selectedFile || $submitting}>
								{#if $submitting}
									Uploading...
								{:else}
									Upload Resource
								{/if}
							</Button>
						</div>
					</form>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>
