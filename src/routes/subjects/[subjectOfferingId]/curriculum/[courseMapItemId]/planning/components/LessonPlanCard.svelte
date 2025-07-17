<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	
	export let lessonPlan: {
		id: number;
		name: string;
		imageBase64?: string | null;
		description?: string | null;
	};
	export let href: string | undefined = undefined;
</script>

{#if href}
	<a {href} class="block">
		<Card.Root class="overflow-hidden w-72 h-32 hover:bg-black/10 dark:hover:bg-white/10 transition-colors group p-0">
			<div class="flex h-full items-stretch">
				<!-- Text content on left -->
				<div class="flex-1 p-4 flex flex-col justify-center min-w-0">
					<h3 class="text-base font-bold leading-tight text-left">{lessonPlan.name}</h3>
				</div>
				
				<!-- Image container taking up the right third of the card -->
				<div class="w-32 h-32 relative flex-shrink-0">
					{#if lessonPlan.imageBase64}
						<img 
							src={`data:image/png;base64,${lessonPlan.imageBase64}`}
							alt="Lesson plan preview"
							class="absolute top-0 left-0 w-full h-32 object-cover group-hover:brightness-90 transition-all"
						/>
					{:else}
						<!-- Gradient background when no image -->
						<div class="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary/20 to-primary/10 group-hover:brightness-90 transition-all"></div>
					{/if}
				</div>
			</div>
		</Card.Root>
	</a>
{:else}
	<Card.Root class="overflow-hidden w-72 h-32 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors group p-0">
		<div class="flex h-full items-stretch">
			<!-- Text content on left -->
			<div class="flex-1 p-4 flex flex-col justify-center min-w-0">
				<h3 class="text-base font-bold leading-tight text-left">{lessonPlan.name}</h3>
			</div>
			
			<!-- Image container taking up the right third of the card -->
			<div class="w-32 h-32 relative flex-shrink-0">
				{#if lessonPlan.imageBase64}
					<img 
						src={`data:image/png;base64,${lessonPlan.imageBase64}`}
						alt="Lesson plan preview"
						class="absolute top-0 left-0 w-full h-32 object-cover group-hover:brightness-90 transition-all"
					/>
				{:else}
					<!-- Gradient background when no image -->
					<div class="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary/20 to-primary/10 group-hover:brightness-90 transition-all"></div>
				{/if}
			</div>
		</div>
	</Card.Root>
{/if}