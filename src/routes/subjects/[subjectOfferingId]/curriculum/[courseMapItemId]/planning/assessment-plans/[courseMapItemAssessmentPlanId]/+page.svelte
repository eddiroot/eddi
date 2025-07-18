<script lang="ts">
	import { page } from '$app/state';
	import Rubric from '$lib/components/rubric.svelte';
	let { data } = $props();

	// Resizable splitter state
	let isDragging = $state(false);
	let leftWidth = $state(50); // Percentage, default to center
	let containerRef: HTMLDivElement;

	function handleMouseDown(event: MouseEvent) {
		isDragging = true;
		event.preventDefault();
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDragging || !containerRef) return;
		
		const rect = containerRef.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const percentage = (x / rect.width) * 100;
		
		// Constrain between 20% and 80%
		leftWidth = Math.min(80, Math.max(20, percentage));
	}

	function handleMouseUp() {
		isDragging = false;
		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);
	}
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

<div class="w-full px-4 sm:px-6 lg:px-8 space-y-8">
	<!-- Resizable Two Column Layout -->
	<div bind:this={containerRef} class="hidden lg:flex h-screen-minus-hero relative">
		<!-- Left Column: Information -->
		<div class="overflow-y-auto pr-4" style="width: {leftWidth}%;">
			<div class="space-y-8">
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
			</div>
		</div>

		<!-- Resizable Separator -->
		<div 
			class="w-2 bg-border hover:bg-border/80 cursor-col-resize flex items-center justify-center relative group transition-colors"
			role="button"
			tabindex="0"
			onmousedown={handleMouseDown}
		>
			<div class="w-1 h-8 bg-muted-foreground/40 rounded-full group-hover:bg-muted-foreground/60 transition-colors"></div>
		</div>

		<!-- Right Column: Rubric -->
		<div class="overflow-y-auto pl-4 flex-1">
			{#if data.rubric}
				<div class="space-y-6 h-full">
					<h2 class="text-2xl font-semibold">Assessment Rubric</h2>
					<div class="w-full">
						<Rubric rubricData={data.rubric} />
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Mobile Layout (Non-resizable) -->
	<div class="lg:hidden space-y-8">
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
</div>


