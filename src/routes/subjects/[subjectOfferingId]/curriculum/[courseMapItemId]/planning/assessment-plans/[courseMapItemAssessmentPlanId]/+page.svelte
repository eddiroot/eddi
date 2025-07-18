<script lang="ts">
	import { page } from '$app/state';
	import Rubric from '$lib/components/rubric.svelte';
	let { data } = $props();
</script>

<!-- Hero Section with Assessment Plan Image -->
<div class="relative h-64 w-full overflow-hidden mb-8">
	{#if data.assessmentPlan.imageBase64}
		<img 
			src={`data:image/png;base64,${data.assessmentPlan.imageBase64}`}
			alt={data.assessmentPlan.name}
			class="absolute inset-0 w-full h-full object-cover"
		/>
		<div class="absolute inset-0 bg-black/40"></div>
	{:else if data.courseMapItem.imageBase64}
		<img 
			src={`data:image/png;base64,${data.courseMapItem.imageBase64}`}
			alt={data.courseMapItem.topic}
			class="absolute inset-0 w-full h-full object-cover"
		/>
		<div class="absolute inset-0 bg-black/40"></div>
	{:else}
		<div class="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-orange-600/10"></div>
	{/if}
	
	<!-- Assessment Plan Title Overlay (centered) -->
	<div class="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
		<h1 class="text-4xl font-bold mb-2">{data.assessmentPlan.name}</h1>
		<p class="text-lg opacity-90">Topic: {data.courseMapItem.topic}</p>
	</div>
</div>

<div class="max-w-4xl mx-auto px-6 space-y-12">
	<!-- Scopes Section -->
	{#if data.assessmentPlan.scope?.length}
		<div class="space-y-4">
			<h2 class="text-2xl font-semibold">Assessment Scopes</h2>
			<ul class="list-disc ml-6 space-y-2 text-muted-foreground leading-relaxed">
				{#each data.assessmentPlan.scope as scope}
					<li>{scope}</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Curriculum Standards Section -->
	{#if data.standards.length > 0}
		<div class="space-y-4">
			<h2 class="text-2xl font-semibold">Curriculum Standards Assessed</h2>
			<ul class="list-disc ml-6 space-y-3">
				{#each data.standards as standard}
					<li>
						<div class="font-medium">{standard.name}:</div>
						{#if standard.description}
							<div class="text-muted-foreground mt-1">{standard.description}</div>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Description Section -->
	{#if data.assessmentPlan.description}
		<div class="space-y-4">
			<h2 class="text-2xl font-semibold">Description</h2>
			<p class="text-muted-foreground leading-relaxed">{data.assessmentPlan.description}</p>
		</div>
	{/if}

	<!-- Rubric Section -->
	{#if data.rubric}
		<div class="space-y-6">
			<h2 class="text-2xl font-semibold">Assessment Rubric</h2>
			<Rubric rubricData={data.rubric} />
		</div>
	{/if}
</div>


