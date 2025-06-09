<script lang="ts">
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import PlusIcon from '@lucide/svelte/icons/plus';

	let { data } = $props();
</script>

<div class="mb-3 flex items-center justify-between">
	<h1 class="mb-4 text-3xl font-bold">Discussion</h1>
	<a href="/subjects/{data.subjectIdInt}/discussion/new" class={buttonVariants()}
		>New Post <PlusIcon /></a
	>
</div>

{#if data?.threads}
	<div class="space-y-4">
		{#each data.threads as thread}
			<Card.Root>
				<Card.Header>
					<Card.Title>{thread.title}</Card.Title>
					<Card.Description>{thread.userId}</Card.Description>
				</Card.Header>
				<Card.Content>
					{thread.content}
				</Card.Content>
				<Card.Footer>
					<span>Created {new Date(thread.createdAt).toLocaleDateString()}</span>
				</Card.Footer>
			</Card.Root>
		{/each}
	</div>
{:else}
	<p>No discussion posts available.</p>
{/if}
