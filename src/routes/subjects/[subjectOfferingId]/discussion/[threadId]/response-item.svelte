<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { convertToFullName, formatDate } from '$lib/utils';
	import ResponseForm from './form.svelte';
	import Self from './response-item.svelte';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import Reply from '@lucide/svelte/icons/reply';

	let {
		response,
		threadType,
		data,
		depth = 0
	}: {
		response: any;
		threadType: string;
		data: any;
		depth?: number;
	} = $props();

	let showReplyForm = $state(false);
	const maxDepth = 3; // Maximum nesting depth

	const authorName = $derived(() =>
		convertToFullName(response.user.firstName, response.user.middleName, response.user.lastName)
	);

	function toggleReplyForm() {
		showReplyForm = !showReplyForm;
	}

	function closeReplyForm() {
		showReplyForm = false;
	}
</script>

<div class={depth > 0 ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''}>
	<Card.Root
		class="border-l-4 {response.response.type === 'answer'
			? 'border-l-green-500'
			: 'border-l-blue-500'} shadow-sm"
	>
		<Card.Header class="pb-3">
			<div class="flex items-center gap-3">
				<Avatar.Root class="h-9 w-9">
					<Avatar.Image src={response.user.avatarUrl || ''} alt={authorName()} />
					<Avatar.Fallback
						class="text-xs font-medium {response.response.type === 'answer'
							? 'bg-green-100 text-green-700'
							: 'bg-blue-100 text-blue-700'}"
					>
						{authorName()
							.split(' ')
							.map((n) => n[0])
							.join('')
							.substring(0, 2)
							.toUpperCase()}
					</Avatar.Fallback>
				</Avatar.Root>
				<div class="flex-1 space-y-1">
					<div class="flex items-center gap-2">
						<Badge
							variant={response.response.type === 'answer' ? 'default' : 'secondary'}
							class={response.response.type === 'answer'
								? 'border-green-200 bg-green-50 text-green-700'
								: 'border-blue-200 bg-blue-50 text-blue-700'}
						>
							{#if response.response.type === 'answer'}
								<CheckCircle class="mr-1 h-3 w-3" />
								Answer
							{:else}
								<MessageSquare class="mr-1 h-3 w-3" />
								Comment
							{/if}
						</Badge>
						<span class="text-muted-foreground text-sm">
							by {authorName()}
						</span>
						<span class="text-muted-foreground text-xs">
							{formatDate(response.response.createdAt)}
						</span>
					</div>
				</div>
			</div>
		</Card.Header>
		<Card.Content>
			<div class="text-sm leading-relaxed whitespace-pre-wrap">
				{response.response.content || 'No content available'}
			</div>

			<!-- Reply button -->
			{#if depth < maxDepth}
				<div class="mt-3 border-t border-gray-100 pt-3">
					<Button
						variant="ghost"
						size="sm"
						onclick={toggleReplyForm}
						class="text-muted-foreground hover:text-foreground text-xs"
					>
						<Reply class="mr-1 h-3 w-3" />
						Reply
					</Button>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Reply form -->
	{#if showReplyForm && depth < maxDepth}
		<ResponseForm
			{data}
			{threadType}
			parentResponseId={response.response.id}
			parentAuthor={authorName()}
			isReply={true}
			onSuccess={closeReplyForm}
			onCancel={closeReplyForm}
		/>
	{/if}

	<!-- Nested replies -->
	{#if response.replies && response.replies.length > 0}
		<div class="mt-4 space-y-4">
			{#each response.replies as reply}
				<Self response={reply} {threadType} {data} depth={depth + 1} />
			{/each}
		</div>
	{/if}
</div>
