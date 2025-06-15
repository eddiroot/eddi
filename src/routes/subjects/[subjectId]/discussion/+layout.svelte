<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Separator } from '$lib/components/ui/separator';
	import { convertToFullName } from '$lib/utils';
	import PlusIcon from '@lucide/svelte/icons/plus';

	let { children, data } = $props();
</script>

<div class="grid h-full w-full grid-cols-[300px_1fr]">
	<div class="h-full border-r border-b">
		<div class="p-2">
			<a href="/subjects/{data.subjectIdInt}/discussion/new" class={`${buttonVariants()} w-full`}
				>New Post <PlusIcon /></a
			>
		</div>
		<Separator />
		<ScrollArea class="h-[calc(100vh-105px)]">
			<div>
				{#if data?.threads}
					<div class="overflow-y-auto">
						{#each data.threads as thread}
							<a href="/subjects/{data.subjectIdInt}/discussion/{thread.thread.id}" class="block">
								<Card.Root class="rounded-none border-none shadow-none">
									<Card.Header>
										<Card.Title>
											{thread.thread.title}
										</Card.Title>
										<Card.Description>
											by {convertToFullName(
												thread.user.firstName,
												thread.user.middleName,
												thread.user.lastName
											)}
										</Card.Description>
									</Card.Header>
									<Card.Footer>
										<div class="text-muted-foreground flex items-center text-xs">
											<span>Created {new Date(thread.thread.createdAt).toLocaleDateString()}</span>
										</div>
									</Card.Footer>
								</Card.Root>
								<Separator />
							</a>
						{/each}
					</div>
				{:else}
					<p>No discussion posts available.</p>
				{/if}
			</div>
		</ScrollArea>
	</div>
	<div class="p-8">
		{@render children()}
	</div>
</div>
