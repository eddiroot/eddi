<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import FileIcon from '@lucide/svelte/icons/file';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { z } from 'zod/v4';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();
	let topicsWithTasks = $state(data.topicsWithTasks || []);
	let showUploadDialog = $state(false);

	const uploadSchema = z.object({
		file: z.instanceof(File).refine((file) => file.size > 0, 'Please select a file to upload'),
		title: z.string().optional(),
		description: z.string().optional(),
		topicId: z.number().min(1, 'Please select a topic')
	});

	const form = superForm(data.form!, {
		validators: zod4(uploadSchema),
		onUpdated: async ({ form }) => {
			if (form.valid) {
				showUploadDialog = false;
				await invalidateAll();
			}
		}
	});

	const { form: formData, enhance, submitting } = form;

	let fileInput: HTMLInputElement;
	let selectedFile = $state<File | null>(null);
	let selectedTopic = $state<string | undefined>(undefined);

	// When switching to other subject task pages, we need to update the state
	$effect(() => {
		topicsWithTasks = data.topicsWithTasks || [];
	});

	// Update formData when topic is selected
	$effect(() => {
		if (selectedTopic) {
			$formData.topicId = parseInt(selectedTopic);
		}
	});

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

	// Handle resource deletion
	async function deleteResource(resourceId: number) {
		if (!confirm('Are you sure you want to delete this resource?')) {
			return;
		}

		try {
			const formData = new FormData();
			formData.append('resourceId', resourceId.toString());

			const response = await fetch('?/delete', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				await invalidateAll();
			} else {
				const result = await response.json();
				alert(result.message || 'Failed to delete resource');
			}
		} catch (error) {
			console.error('Error deleting resource:', error);
			alert('Failed to delete resource');
		}
	}
</script>

<div class="space-y-6 p-8">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">Tasks</h1>
		{#if data?.user?.type !== 'student'}
			<div class="flex items-center gap-2">
				<Button onclick={() => (showUploadDialog = true)} variant="outline">
					<UploadIcon class="h-4 w-4" />
					Upload Resource
				</Button>
				<Button href={`${page.url.pathname}/new`} variant="outline">
					<PlusIcon class="h-4 w-4" />
					New Task
				</Button>
			</div>
		{/if}
	</div>

	<div class="space-y-8">
		{#each topicsWithTasks as { topic, tasks, resources }}
			<div>
				<div class="flex items-center gap-2">
					<h2 class="text-foreground text-xl font-semibold">{topic.name}</h2>
				</div>

				<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{#if tasks.length === 0 && resources.length === 0}
						<div class="text-muted-foreground col-span-full text-sm">
							No tasks or resources available for this topic.
						</div>
					{/if}

					<!-- Tasks -->
					{#each tasks as task}
						<a href={`${page.url.pathname}/${task.task.id}`} class="block h-full">
							<Card.Root class="h-full transition-shadow hover:shadow-md">
								<Card.Header>
									<Card.Title>
										{task.task.title}
									</Card.Title>
									<Card.Description class="mt-0.5 space-y-1">
										<div>Status: {task.status}</div>
									</Card.Description>
								</Card.Header>
							</Card.Root>
						</a>
					{/each}

					<!-- Resources -->
					{#each resources as resource}
						<Card.Root class="flex h-full flex-col transition-shadow hover:shadow-md">
							<Card.Header class="flex-1 truncate">
								<div class="flex items-center justify-between">
									<Card.Title class="flex items-center gap-2">
										<FileIcon class="h-4 w-4" />
										{#if resource.downloadUrl}
											<a href={resource.downloadUrl} target="_blank" class="hover:underline">
												{resource.title}
											</a>
										{:else}
											{resource.title}
										{/if}
									</Card.Title>
									<div class="flex items-center gap-1 truncate">
										{#if resource.downloadUrl}
											<Button href={resource.downloadUrl} size="sm" variant="ghost" target="_blank">
												<DownloadIcon class="h-4 w-4" />
											</Button>
										{/if}
										<Button size="sm" variant="ghost" onclick={() => deleteResource(resource.id)}>
											<TrashIcon class="h-4 w-4" />
										</Button>
									</div>
								</div>
								{#if resource.description}
									<Card.Description>
										{resource.description}
									</Card.Description>
								{/if}
							</Card.Header>
							<Card.Content class="mt-auto">
								<div class="text-muted-foreground text-sm">
									{formatFileSize(resource.fileSize)}
								</div>
							</Card.Content>
						</Card.Root>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- Upload Resource Dialog -->
	<Dialog.Root bind:open={showUploadDialog}>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>Upload Resource</Dialog.Title>
				<Dialog.Description>
					Upload a file to share with your class. Select a topic to organise the resource.
				</Dialog.Description>
			</Dialog.Header>
			<form
				method="post"
				action="?/upload"
				use:enhance
				enctype="multipart/form-data"
				class="space-y-4"
			>
				<div class="space-y-2">
					<label for="file-input" class="text-sm font-medium">Select File</label>
					<button
						type="button"
						class="border-muted-foreground/25 hover:border-muted-foreground/50 w-full cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors"
						onclick={() => fileInput?.click()}
					>
						{#if selectedFile}
							<div class="space-y-1">
								<FileIcon class="text-muted-foreground mx-auto h-8 w-8" />
								<div class="text-sm font-medium">{selectedFile.name}</div>
								<div class="text-muted-foreground text-xs">{formatFileSize(selectedFile.size)}</div>
							</div>
						{:else}
							<div class="space-y-1">
								<UploadIcon class="text-muted-foreground mx-auto h-8 w-8" />
								<div class="text-muted-foreground text-sm">Click to select a file</div>
							</div>
						{/if}
					</button>
					<input
						bind:this={fileInput}
						id="file-input"
						type="file"
						name="file"
						class="hidden"
						onchange={handleFileSelect}
						required
					/>
				</div>
				<div class="space-y-2">
					<label for="topic-select" class="text-sm font-medium">Topic</label>
					<Select.Root
						type="single"
						value={selectedTopic}
						onValueChange={(value: string | undefined) => {
							selectedTopic = value;
							if (value) {
								$formData.topicId = parseInt(value);
							}
						}}
					>
						<Select.Trigger class="w-full">
							{#if selectedTopic}
								{data.topics?.find((t) => t.id === parseInt(selectedTopic!))?.name ||
									'Select a topic'}
							{:else}
								Select a topic
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each data.topics || [] as topic}
								<Select.Item value={topic.id.toString()} label={topic.name}>
									{topic.name}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<input type="hidden" name="topicId" value={$formData.topicId} />
				</div>

				<div class="space-y-2">
					<label for="title" class="text-sm font-medium">Title (optional)</label>
					<Input
						id="title"
						name="title"
						placeholder="Resource title"
						bind:value={$formData.title}
					/>
				</div>
				<div class="space-y-2">
					<label for="description" class="text-sm font-medium">Description (optional)</label>
					<Textarea
						id="description"
						name="description"
						placeholder="Resource description"
						bind:value={$formData.description}
					/>
				</div>

				<div class="flex justify-end space-x-2">
					<Button type="button" variant="outline" onclick={() => (showUploadDialog = false)}>
						Cancel
					</Button>
					<Button type="submit" disabled={$submitting || !selectedFile || !selectedTopic}>
						{#if $submitting}
							Uploading...
						{:else}
							Upload Resource
						{/if}
					</Button>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Root>
</div>
