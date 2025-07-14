<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import DownloadIcon from '@lucide/svelte/icons/download';
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
					<Card.Root class="transition-shadow hover:shadow-md">
						<Card.Header class="pb-3">
							<div class="flex items-start justify-between">
								<div class="flex items-center gap-3 min-w-0 flex-1">
									<div class="bg-muted rounded-lg p-2 flex-shrink-0">
										<FileIcon class="h-5 w-5 text-muted-foreground" />
									</div>
									<div class="min-w-0 flex-1">
										<Card.Title class="text-sm font-semibold leading-tight truncate">
											{resource.originalFileName}
										</Card.Title>
										<Card.Description class="text-xs mt-1">
											{getFileExtension(resource.originalFileName)} • {formatFileSize(resource.fileSize)}
										</Card.Description>
									</div>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onclick={() => downloadResource(resource)}
									class="ml-2 flex-shrink-0 h-8 w-8 p-0"
								>
									<DownloadIcon class="h-4 w-4" />
								</Button>
							</div>
						</Card.Header>
						<Card.Content class="pt-0">
							<div class="flex items-center gap-2 text-xs text-muted-foreground">
								<div class="flex items-center gap-1">
									<UserIcon class="h-3 w-3" />
									<span>{convertToFullName(resource.author.firstName, resource.author.middleName, resource.author.lastName)}</span>
								</div>
							</div>
							<div class="flex items-center gap-1 text-xs text-muted-foreground mt-1">
								<CalendarIcon class="h-3 w-3" />
								<span>Uploaded {formatDate(resource.createdAt)}</span>
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		{/if}
	</div>
</div>
