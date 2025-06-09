<script lang="ts">
	let { data } = $props();
</script>

<h1 class="mb-4 text-3xl font-bold">Discussion</h1>
{#if data?.threads}
	<div class="space-y-4">
		{#each data.threads as thread}
			<div class="rounded-lg border p-4">
				<h2 class="text-xl font-semibold">{thread.title}</h2>
				<p class="text-gray-700">{thread.content}</p>
				<span class="text-sm text-gray-500"
					>Posted by {thread.userId} on {new Date(thread.createdAt).toLocaleDateString()}</span
				>
			</div>
		{/each}
	</div>
{:else}
	<p>No discussion posts available.</p>
{/if}
