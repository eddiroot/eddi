<script lang="ts">
	let { data } = $props();
	import * as Card from '$lib/components/ui/card';
</script>

<h2 class="mb-4 text-xl font-bold">Your Subjects</h2>
{#if data?.subjects?.length}
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
		{#each data.subjects as subject}
			<a href="/subjects/{subject.id}">
				<Card.Root>
					<Card.Header>
						<Card.Title>{subject.name}</Card.Title>
						<Card.Description>{subject.description}</Card.Description>
					</Card.Header>
					<Card.Content>
						<p>Card Content</p>
					</Card.Content>
					<Card.Footer>
						<p>Card Footer</p>
					</Card.Footer>
				</Card.Root>
			</a>
		{/each}
	</div>
{:else}
	<p>No subjects found.</p>
{/if}
