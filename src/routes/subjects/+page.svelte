<script lang="ts">
	let { data } = $props();
</script>

<h1 class="mb-4 text-3xl font-bold">Subjects</h1>
{#if data?.subjects?.length}
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
		{#each data.subjects as subject}
			<a href="/subjects/{subject.id}">
				<div class="card bg-base-100 image-full w-96 shadow-sm">
					<figure>
						<img
							src="https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp"
							alt="Shoes"
						/>
					</figure>
					<div class="card-body">
						<h2 class="card-title">{subject.name}</h2>
						<p>{subject.description}</p>
					</div>
				</div>
			</a>
		{/each}
	</div>
{:else}
	<p>No subjects found.</p>
{/if}
