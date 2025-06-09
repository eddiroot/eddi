<script lang="ts">
	let { data } = $props();
	import * as Card from '$lib/components/ui/card';
</script>

<h2 class="mb-4 text-xl font-bold">Your Subjects</h2>
{#if data?.subjects?.length}
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
		{#each data.subjects as subject}
			<a href="/subjects/{subject.id}/discussion">
				<Card.Root>
					<Card.Header>
						<Card.Title>{subject.name}</Card.Title>
						<Card.Description>{subject.description}</Card.Description>
					</Card.Header>
					<Card.Footer>
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-500"
								>Created on {new Date(subject.createdAt).toLocaleDateString()}</span
							>
							<span class="text-sm text-gray-500"
								>Last updated {new Date(subject.updatedAt).toLocaleDateString()}</span
							>
						</div>
					</Card.Footer>
				</Card.Root>
			</a>
		{/each}
	</div>
{:else}
	<p>No subjects found.</p>
{/if}
