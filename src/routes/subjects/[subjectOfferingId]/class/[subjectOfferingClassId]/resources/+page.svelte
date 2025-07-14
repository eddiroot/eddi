<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import FileIcon from '@lucide/svelte/icons/file';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import UserIcon from '@lucide/svelte/icons/user';
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';
	import { convertToFullName } from '$lib/utils';

	let { data } = $props();
	let resources = $state(data.resources || []);
	let classDetails = $state(data.classDetails);

	// When switching to other resource pages, we need to update the state
	$effect(() => {
		resources = data.resources || [];
		classDetails = data.classDetails;
	});

	// Format file size for display
	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	// Format date for display
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString();
	}

	// Get file extension from filename
	function getFileExtension(filename: string): string {
		return filename.split('.').pop()?.toUpperCase() || 'FILE';
	}

	// Handle resource download using direct link
	function downloadResource(resource: any) {
		const downloadUrl = `${page.url.pathname}/download/${resource.id}`;
		window.open(downloadUrl, '_blank');
	}

	// Handle resource deletion
	async function deleteResource(resource: any) {
		if (!confirm(`Are you sure you want to delete "${resource.title || resource.originalFileName}"?`)) {
			return;
		}

		try {
			const response = await fetch(`${page.url.pathname}/delete/${resource.id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				// Remove the resource from the local state
				resources = resources.filter(r => r.id !== resource.id);
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
			<Button href={`${page.url.pathname}/upload`} variant="outline">
				<PlusIcon class="h-4 w-4" />
				Upload Resource
			</Button>
		</div>
	</div>

	<div class="space-y-4">
		{#if resources.length === 0}
			<div class="text-center py-12">
				<FileIcon class="mx-auto h-12 w-12 text-muted-foreground" />
				<h3 class="mt-4 text-lg font-semibold text-foreground">No resources available</h3>
				<p class="mt-2 text-muted-foreground">
					Upload your first resource to get started.
				</p>
				<Button href={`${page.url.pathname}/upload`} class="mt-4">
					<PlusIcon class="h-4 w-4 mr-2" />
					Upload Resource
				</Button>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each resources as resource}
					<Card.Root class="transition-shadow hover:shadow-md flex flex-col truncate h-45">
						<Card.Header class="pb-3">
							<div class="flex items-start justify-between overflow-hidden">
								<div class="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
									<div class="bg-muted rounded-lg p-2 flex-shrink-0">
										<FileIcon class="h-5 w-5 text-muted-foreground" />
									</div>
									<div class="min-w-0 flex-1 overflow-hidden pr-2">
										<Card.Title class="text-sm font-semibold leading-tight truncate">
											{resource.title || resource.originalFileName}
										</Card.Title>
										<Card.Description class="text-xs mt-1 truncate">
											{getFileExtension(resource.originalFileName)} • {formatFileSize(resource.fileSize)}
										</Card.Description>
									</div>
								</div>
								<div class="flex items-center gap-1">
									<Button
										variant="ghost"
										size="sm"
										onclick={() => downloadResource(resource)}
										class="h-8 w-8 p-0"
									>
										<DownloadIcon class="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onclick={() => deleteResource(resource)}
										class="h-8 w-8 p-0 text-destructive hover:text-destructive"
									>
										<TrashIcon class="h-4 w-4" />
									</Button>
								</div>
							</div>
						</Card.Header>
						<Card.Content class="pt-0 flex-1 flex flex-col">
							<div class="flex-1">
								{#if resource.description}
									<p class="text-sm text-foreground mb-3 truncate">
										{resource.description}
									</p>
								{/if}
							</div>
							<div class="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
								<div class="flex items-center gap-1">
									<UserIcon class="h-3 w-3" />
									<span class="truncate">{convertToFullName(resource.author.firstName, resource.author.middleName, resource.author.lastName)}</span>
								</div>
								<div class="flex items-center gap-1 ml-3">
									<CalendarIcon class="h-3 w-3" />
									<span>Uploaded {formatDate(resource.createdAt)}</span>
								</div>
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		{/if}
	</div>
</div>
