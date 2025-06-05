<script lang="ts">
	let { data } = $props();
</script>

<div class="container mx-auto flex-1 px-4 py-4">
	<h1 class="text-3xl font-bold">Subjects</h1>
	{#if data?.subjects?.length}
		<ul class="list-disc pl-5">
			{#each data.subjects as subject}
				<li>
					<a href="/subjects/{subject.subject.id}" class="text-blue-600 hover:underline"
						>{subject.subject.name}</a
					>
				</li>
			{/each}
		</ul>
	{:else}
		<p>No subjects found.</p>
	{/if}
</div>
