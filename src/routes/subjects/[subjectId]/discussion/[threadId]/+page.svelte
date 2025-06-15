<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Avatar from '$lib/components/ui/avatar';
	import { convertToFullName, formatDate } from '$lib/utils';

	let { data } = $props();
	const thread = $derived(() => data.thread);

	const threadData = $derived(() => {
		const t = thread();
		return t?.thread;
	});

	const authorFullName = $derived(() => {
		const derThread = thread();
		if (!derThread || !derThread.user) return 'Unknown Author';
		return convertToFullName(
			derThread.user.firstName,
			derThread.user.middleName,
			derThread.user.lastName
		);
	});

	const authorAvatarUrl = $derived(() => {
		const derThread = thread();
		if (!derThread || !derThread.user) return '';
		return derThread.user.avatarUrl || '';
	});

	function getThreadTypeDisplay(type: string): string {
		switch (type) {
			case 'discussion':
				return 'Discussion';
			case 'question':
				return 'Question';
			case 'announcement':
				return 'Announcement';
			case 'qanda':
				return 'Q&A';
			default:
				return 'Thread';
		}
	}
</script>

{#if thread()}
	<div class="mx-auto max-w-4xl">
		<Card.Root>
			<Card.Header>
				<div class="flex items-start gap-4">
					<Avatar.Root class="h-12 w-12">
						<Avatar.Image src={authorAvatarUrl()} alt={authorFullName()} />
						<Avatar.Fallback>
							{authorFullName()
								.split(' ')
								.map((n) => n[0])
								.join('')
								.substring(0, 2)
								.toUpperCase()}
						</Avatar.Fallback>
					</Avatar.Root>
					<div class="flex-1 space-y-2">
						<div class="flex items-center gap-2">
							<span
								class="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset"
							>
								{threadData() ? getThreadTypeDisplay(threadData()!.type) : 'Thread'}
							</span>
							<span class="text-muted-foreground text-sm">
								{threadData() ? formatDate(threadData()!.createdAt) : ''}
							</span>
						</div>
						<Card.Title class="text-2xl">{threadData()?.title || 'Untitled'}</Card.Title>
						<Card.Description>
							by {authorFullName()}
						</Card.Description>
					</div>
				</div>
			</Card.Header>
			<Card.Content>
				<div class="prose prose-sm max-w-none">
					<div class="text-sm leading-relaxed whitespace-pre-wrap">
						{threadData()?.content || 'No content available'}
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
{:else}
	<div class="flex h-64 items-center justify-center">
		<p class="text-muted-foreground">Thread not found.</p>
	</div>
{/if}
