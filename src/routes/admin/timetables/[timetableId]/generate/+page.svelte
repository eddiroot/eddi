<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Calendar from '@lucide/svelte/icons/calendar';
	import CheckCircle from '@lucide/svelte/icons/check';
	import Loader from '@lucide/svelte/icons/loader';
	import Lock from '@lucide/svelte/icons/lock';
	import PlayCircle from '@lucide/svelte/icons/play-circle';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import { enhance } from '$app/forms';
	import { onMount, onDestroy } from 'svelte';
	import { invalidate } from '$app/navigation';

	let { data } = $props();
	let isGenerating = $state(false);
	let isProcessing = $state(false);
	let pollInterval: ReturnType<typeof setInterval> | null = null;

	// Check if there are any active queue entries (queued or in_progress)
	let hasActiveEntries = $derived(
		data.queueEntries?.some(
			(entry) => entry.status === 'queued' || entry.status === 'in_progress'
		) ?? false
	);

	function getStatusColor(status: string) {
		switch (status) {
			case 'queued':
				return 'bg-yellow-500';
			case 'in_progress':
				return 'bg-blue-500';
			case 'completed':
				return 'bg-green-500';
			case 'failed':
				return 'bg-red-500';
			default:
				return 'bg-gray-500';
		}
	}

	function formatStatus(status: string) {
		return status
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	function formatDate(date: Date | string) {
		return new Date(date).toLocaleString();
	}

	async function handleGenerate(event: SubmitEvent) {
		event.preventDefault();

		isGenerating = true;

		// Simulate loading for 3 seconds
		setTimeout(async () => {
			isGenerating = false;

			// After loading, submit the form
			(event.target as HTMLFormElement).submit();
		}, 3000);
	}

	// Poll for updates when there are active entries
	onMount(() => {
		if (hasActiveEntries) {
			startPolling();
		}
	});

	onDestroy(() => {
		stopPolling();
	});

	function startPolling() {
		stopPolling(); // Clear any existing interval
		pollInterval = setInterval(async () => {
			await invalidate('app:queue');
			
			// Stop polling if no active entries
			if (!hasActiveEntries) {
				stopPolling();
			}
		}, 3000); // Poll every 3 seconds
	}

	function stopPolling() {
		if (pollInterval) {
			clearInterval(pollInterval);
			pollInterval = null;
		}
	}

	// Watch for changes in active entries and start/stop polling accordingly
	$effect(() => {
		if (hasActiveEntries && !pollInterval) {
			startPolling();
		} else if (!hasActiveEntries && pollInterval) {
			stopPolling();
		}
	});
</script>

<div class="flex h-full gap-6 px-4 pt-6 md:pt-10 xl:pt-14">
	<!-- Left Column - Generate Card -->
	<div class="flex-1">
		<Card.Root class="border-none shadow-none">
		<Card.Header class="space-y-4 text-center">
			<div class="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
				<CheckCircle class="text-primary h-8 w-8" />
			</div>
			<div class="space-y-2">
				<Card.Title class="text-3xl font-bold">Ready to Generate</Card.Title>
				<Card.Description class="text-muted-foreground text-lg">
					Your timetable configuration is complete
				</Card.Description>
			</div>
		</Card.Header>

		<Card.Content class="space-y-6">
			<div class="space-y-4">
				<div class="bg-muted/80 flex items-start gap-3 rounded-lg p-6">
					<Calendar class="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
					<div class="space-y-1">
						<p class="font-medium">Timetable Generation</p>
						<p class="text-muted-foreground text-sm">
							Once you start the generation process, eddi will analyse all of your configured data
							and create an optimised timetable based on your constraints and preferences.
						</p>
					</div>
				</div>

				<div class="bg-muted/80 flex items-start gap-3 rounded-lg p-6">
					<Lock class="text-destructive mt-0.5 h-5 w-5 flex-shrink-0" />
					<div class="space-y-1">
						<p class="font-medium">Important Notice</p>
						<p class="text-muted-foreground text-sm">
							While the generation is in progress, the timetable will be locked and no changes can
							be made to subjects, activities, students, or rules until the process completes.
						</p>
					</div>
				</div>
			</div>

			<form
				method="POST"
				action="?/generateTimetable"
				class="flex justify-center"
				onsubmit={handleGenerate}
			>
				<Button type="submit" size="lg" class="px-8 py-3" disabled={isGenerating}>
					{#if isGenerating}
						<Loader class="mr-2 h-4 w-4 animate-spin" />
						Generating...
					{:else}
						Generate Timetable File for Processing
					{/if}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
	</div>

	<!-- Right Column - Queue Status -->
	<div class="w-full max-w-md">
		<Card.Root class="sticky top-6">
			<Card.Header>
				<div class="flex items-center justify-between">
					<div>
						<Card.Title class="flex items-center gap-2">
							Generation Queue
							{#if hasActiveEntries}
								<Loader class="h-4 w-4 animate-spin text-blue-500" />
							{/if}
						</Card.Title>
						<Card.Description>
							{#if data.queueEntries && data.queueEntries.length > 0}
								{data.queueEntries.length} iteration{data.queueEntries.length !== 1 ? 's' : ''}
							{:else}
								No iterations yet
							{/if}
						</Card.Description>
					</div>
					<div class="flex gap-2">
						<Button
							variant="ghost"
							size="icon"
							onclick={async () => {
								await invalidate('app:queue');
							}}
							title="Refresh"
						>
							<RefreshCw class="h-4 w-4" />
						</Button>
					</div>
				</div>
			</Card.Header>
			<Card.Content class="space-y-4">
				{#if data.queueEntries && data.queueEntries.length > 0}
					<div class="max-h-[600px] space-y-3 overflow-y-auto">
						{#each data.queueEntries as entry}
							<div class="border-muted rounded-lg border p-4">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-medium">Iteration #{entry.iterationId}</span>
									<Badge class={getStatusColor(entry.status)}>
										{formatStatus(entry.status)}
									</Badge>
								</div>
								<div class="space-y-1 text-xs text-muted-foreground">
									<p class="truncate" title={entry.fileName}>
										{entry.fileName}
									</p>
									<p>{formatDate(entry.createdAt)}</p>
								</div>
							</div>
						{/each}
					</div>
					<form
						method="POST"
						action="?/processQueue"
						use:enhance={() => {
							isProcessing = true;
							return async ({ update }) => {
								await update();
								isProcessing = false;
								await invalidate('app:queue');
							};
						}}
						class="border-t pt-4"
					>
						<Button type="submit" class="w-full" variant="outline" disabled={isProcessing}>
							{#if isProcessing}
								<Loader class="mr-2 h-4 w-4 animate-spin" />
								Processing...
							{:else}
								<PlayCircle class="mr-2 h-4 w-4" />
								Process Queue
							{/if}
						</Button>
					</form>
				{:else}
					<div class="py-8 text-center">
						<p class="text-muted-foreground text-sm">
							No timetable iterations in queue yet. Generate your first timetable to get started.
						</p>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>

<!-- Loading Overlay -->
{#if isGenerating}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="mx-4 w-full max-w-sm rounded-lg bg-white p-8 shadow-xl">
			<div class="space-y-4 text-center">
				<div class="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
					<Loader class="text-primary h-8 w-8 animate-spin" />
				</div>
				<div class="space-y-2">
					<h3 class="text-lg font-semibold">Generating Timetable</h3>
					<p class="text-muted-foreground text-sm">
						Please wait while we create your optimized timetable...
					</p>
				</div>
			</div>
		</div>
	</div>
{/if}
