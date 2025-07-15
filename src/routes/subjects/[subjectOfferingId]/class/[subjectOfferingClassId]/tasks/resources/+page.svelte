<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import FileIcon from '@lucide/svelte/icons/file';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import UserIcon from '@lucide/svelte/icons/user';
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import { convertToFullName, formatTimestamp } from '$lib/utils';

	let { data } = $props();

	// Use derived state that always reflects the current data
	let resources = $derived(data.resources || []);
	let classDetails = $derived(data.classDetails);

	// Format file size for display
	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	// Get file extension from filename
	function getFileExtension(filename: string): string {
		return filename.split('.').pop()?.toUpperCase() || 'FILE';
	}

	// Handle resource deletion
	async function deleteResource(resource: any) {
		if (
			!confirm(`Are you sure you want to delete "${resource.title || resource.originalFileName}"?`)
		) {
			return;
		}

		try {
			const response = await fetch(`${page.url.pathname}/delete/${resource.id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				// Invalidate all data to force fresh reload
				await invalidateAll();
			} else {
				alert('Failed to delete resource. Please try again.');
			}
		} catch (error) {
			console.error('Error deleting resource:', error);
			alert('Failed to delete resource. Please try again.');
		}
	}
</script>

<div class="space-y-6 p-8">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Resources</h1>
			{#if classDetails}
				<p class="text-muted-foreground mt-1">Class: {classDetails.subjectOfferingClass.name}</p>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			<Button href={`${page.url.pathname}/upload`} variant="default">
				<PlusIcon class="h-4 w-4" />
				Upload Resource
			</Button>
		</div>
	</div>

	<div class="space-y-4">
		{#if resources.length === 0}
			<div class="py-12 text-center">
				<FileIcon class="text-muted-foreground mx-auto h-12 w-12" />
				<h3 class="text-foreground mt-4 text-lg font-semibold">No resources available</h3>
				<p class="text-muted-foreground mt-2">Upload your first resource to get started.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each resources as resource}
					<Card.Root class="flex h-45 flex-col truncate transition-shadow hover:shadow-md">
						<Card.Header class="pb-3">
							<div class="flex items-start justify-between overflow-hidden">
								<div class="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
									<div class="bg-muted flex-shrink-0 rounded-lg p-2">
										<FileIcon class="text-muted-foreground h-5 w-5" />
									</div>
									<div class="min-w-0 flex-1 overflow-hidden pr-2">
										{#if resource.downloadUrl}
											<a
												href={resource.downloadUrl}
												download={resource.originalFileName}
												class="block group"
											>
												<Card.Title class="text-sm font-semibold leading-tight truncate group-hover:text-primary transition-colors">
													{resource.title || resource.originalFileName}
												</Card.Title>
											</a>
										{:else}
											<Card.Title class="text-sm font-semibold leading-tight truncate">
												{resource.title || resource.originalFileName}
											</Card.Title>
										{/if}
										<Card.Description class="text-xs mt-1 truncate">
											{getFileExtension(resource.originalFileName)} • {formatFileSize(resource.fileSize)}
										</Card.Description>
									</div>
								</div>
								<div class="flex items-center gap-1">
									{#if resource.downloadUrl}
										<a
											href={resource.downloadUrl}
											download={resource.originalFileName}
											class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
											title="Download {resource.title || resource.originalFileName}"
										>
											<DownloadIcon class="h-4 w-4" />
										</a>
									{:else}
										<Button
											variant="ghost"
											size="sm"
											disabled
											class="h-8 w-8 p-0 opacity-50"
											title="Download link unavailable"
										>
											<DownloadIcon class="h-4 w-4" />
										</Button>
									{/if}
									<Button
										variant="ghost"
										size="sm"
										onclick={() => deleteResource(resource)}
										class="text-destructive hover:text-destructive h-8 w-8 p-0"
									>
										<TrashIcon class="h-4 w-4" />
									</Button>
								</div>
							</div>
						</Card.Header>
						<Card.Content class="flex flex-1 flex-col pt-0">
							<div class="flex-1">
								{#if resource.description}
									<p class="text-foreground mb-3 truncate text-sm">
										{resource.description}
									</p>
								{/if}
							</div>
							<div class="text-muted-foreground mt-auto flex items-center gap-2 text-xs truncate">
								<div class="flex items-center gap-1">
									<UserIcon class="h-3 w-3" />
									<span class="truncate"
										>{convertToFullName(
											resource.author.firstName,
											resource.author.middleName,
											resource.author.lastName
										)}</span
									>
								</div>
								<div class="ml-3 flex items-center gap-1">
									<CalendarIcon class="h-3 w-3" />
									<span>Uploaded {formatTimestamp(resource.createdAt)}</span>
								</div>
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		{/if}
	</div>
</div>
