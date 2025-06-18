<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { convertToFullName, formatDate } from '$lib/utils';
	import ResponseForm from './response-form.svelte';
	import ResponseItem from './response-item.svelte';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import User from '@lucide/svelte/icons/user';
	import Clock from '@lucide/svelte/icons/clock';
	import { getThreadTypeDisplay, getThreadTypeVariant } from './utils';

	let { data } = $props();
	const thread = $derived(() => data.thread);
	const responses = $derived(() => data.nestedResponses);

	const authorFullName = $derived(() => {
		const currentThread = thread();
		if (!currentThread || !currentThread.user) return 'Unknown Author';
		return convertToFullName(
			currentThread.user.firstName,
			currentThread.user.middleName,
			currentThread.user.lastName
		);
	});

	const answers = $derived(
		() =>
			responses()?.filter((r) => r.response.type === 'answer' && !r.response.parentResponseId) || []
	);
	const comments = $derived(
		() =>
			responses()?.filter((r) => r.response.type === 'comment' && !r.response.parentResponseId) ||
			[]
	);
</script>

{#if thread()}
	<div class="mx-auto max-w-4xl space-y-6">
		<!-- Main Thread Card -->
		<Card.Root>
			<Card.Header class="pb-4">
				<div class="flex items-start gap-4">
					<Avatar.Root class="ring-border h-12 w-12 ring-2">
						<Avatar.Image src={thread()?.user?.avatarUrl || ''} alt={authorFullName()} />
						<Avatar.Fallback
							class="bg-gradient-to-br from-blue-500 to-purple-600 font-semibold text-white"
						>
							{authorFullName()
								.split(' ')
								.map((n) => n[0])
								.join('')
								.substring(0, 2)
								.toUpperCase()}
						</Avatar.Fallback>
					</Avatar.Root>
					<div class="flex-1 space-y-3">
						<div class="flex flex-wrap items-center gap-3">
							<Badge variant={getThreadTypeVariant(thread()!.thread.type)} class="font-medium">
								{thread() ? getThreadTypeDisplay(thread()!.thread.type) : 'Thread'}
							</Badge>
							<div class="text-muted-foreground flex items-center gap-1 text-sm">
								<Clock class="h-3 w-3" />
								{thread() ? formatDate(thread()!.thread.createdAt) : ''}
							</div>
						</div>
						<div>
							<h1 class="text-2xl leading-tight font-bold">
								{thread()?.thread.title || 'Untitled'}
							</h1>
							<div class="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
								<User class="h-3 w-3" />
								by {authorFullName()}
							</div>
						</div>
					</div>
				</div>
			</Card.Header>
			<Card.Content>
				<div class="prose prose-sm max-w-none">
					<div class="text-base leading-relaxed whitespace-pre-wrap">
						{thread()?.thread.content || 'No content available'}
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Answers Section (for questions) -->
		{#if (thread()?.thread.type === 'question' || thread()?.thread.type === 'qanda') && answers().length > 0}
			<div class="space-y-4">
				<div class="flex items-center gap-2">
					<CheckCircle class="h-5 w-5 text-green-600" />
					<h2 class="text-xl font-semibold">Answers ({answers().length})</h2>
				</div>
				<div class="space-y-4">
					{#each answers() as response}
						<ResponseItem {response} threadType={thread()?.thread.type || 'discussion'} {data} />
					{/each}
				</div>
			</div>
		{/if}

		<!-- Comments Section -->
		{#if comments().length > 0}
			<div class="space-y-4">
				<div class="flex items-center gap-2">
					<MessageSquare class="h-5 w-5 text-blue-600" />
					<h2 class="text-xl font-semibold">
						{responses()?.length === comments().length ? 'Responses' : 'Comments'} ({comments()
							.length})
					</h2>
				</div>
				<div class="space-y-4">
					{#each comments() as response}
						<ResponseItem {response} threadType={thread()?.thread.type || 'discussion'} {data} />
					{/each}
				</div>
			</div>
		{/if}

		<!-- No Responses Message -->
		{#if !responses() || responses()!.length === 0}
			<Card.Root class="border-dashed">
				<Card.Content class="flex flex-col items-center justify-center py-8 text-center">
					<MessageSquare class="text-muted-foreground mb-3 h-12 w-12" />
					<p class="text-muted-foreground">No responses yet.</p>
					<p class="text-muted-foreground text-sm">
						Be the first to contribute to this discussion!
					</p>
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- Response Form -->
		{#if data.form}
			<ResponseForm data={{ form: data.form }} threadType={thread()?.thread.type || 'discussion'} />
		{/if}
	</div>
{:else}
	<div class="flex h-64 items-center justify-center">
		<Card.Root class="border-dashed">
			<Card.Content class="flex flex-col items-center justify-center py-8 text-center">
				<MessageSquare class="text-muted-foreground mb-3 h-12 w-12" />
				<p class="text-muted-foreground">Thread not found.</p>
			</Card.Content>
		</Card.Root>
	</div>
{/if}
