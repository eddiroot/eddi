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
	<a {href} class="block transition-transform hover:scale-105">
		<Card.Root class="relative overflow-hidden h-32 hover:shadow-md transition-shadow">
			<div class="flex h-full">
				<!-- Left side - Text content -->
				<div class="flex-1 p-4 flex flex-col justify-center">
					<h3 class="text-lg font-semibold mb-1">{lessonPlan.name}</h3>
				</div>
				
				<!-- Right side - Image from the last third -->
				<div class="w-1/2 relative">
					{#if lessonPlan.imageBase64}
						<img 
							src={`data:image/png;base64,${lessonPlan.imageBase64}`}
							alt="Lesson plan preview"
							class="absolute inset-0 w-full h-full object-cover rounded-r-lg"
						/>
						{:else}
						<!-- Placeholder when no image -->
						<div class="absolute inset-0 bg-gray-100 rounded-r-lg flex items-center justify-center">
							<div class="text-gray-400 text-center">
								<svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</Card.Root>
	</a>
{:else}
	<Card.Root class="relative overflow-hidden h-32 cursor-pointer hover:shadow-md transition-shadow">
		<div class="flex h-full">
			<!-- Left side - Text content -->
			<div class="flex-1 p-4 flex flex-col justify-center">
				<h3 class="text-lg font-semibold not-visited:mb-1">{lessonPlan.name}</h3>
			</div>
			
			<!-- Right side - Image from the last third -->
			<div class="w-1/2 relative">
				{#if lessonPlan.imageBase64}
					<img 
						src={`data:image/png;base64,${lessonPlan.imageBase64}`}
						alt="Lesson plan preview"
						class="absolute inset-0 w-full h-full object-cover rounded-r-lg"
					/>
					<!-- Gradient overlay for better text readability if needed -->
					<div class="absolute inset-0 bg-gradient-to-r  to-transparent rounded-r-lg"></div>
				{:else}
					<!-- Placeholder when no image -->
					<div class="absolute inset-0  rounded-r-lg flex items-center justify-center">
						<div class="text-center">
							<svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</Card.Root>
{/if}

