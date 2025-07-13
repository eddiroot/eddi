<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';

	let { data } = $props();
	let topicsWithTasks = $state(data.topicsWithTasks || []);

	// When switching to other subject task pages, we need to update the state
	$effect(() => {
		topicsWithTasks = data.topicsWithTasks || [];
	});
</script>

<div class="space-y-6 p-8">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">Tasks</h1>
		<div class="flex items-center gap-2">
			<Button href={`${page.url.pathname}/new`} variant="outline">
				<PlusIcon class="h-4 w-4" />
				New Task
			</Button>
		</div>
	</div>

	<div class="space-y-8">
		{#each topicsWithTasks as { topic, tasks }}
			<div>
				<div class="flex items-center gap-2">
					<h2 class="text-foreground text-xl font-semibold">{topic.name}</h2>
				</div>

				<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{#if tasks.length === 0}
						<div class="text-muted-foreground col-span-full">
							No tasks available for this topic.
						</div>
					{/if}
					{#each tasks as task}
						<a href={`${page.url.pathname}/${task.id}`} class="block h-full">
							<Card.Root class="h-full transition-shadow hover:shadow-md">
								<Card.Header>
									<Card.Title>
										{task.title}
									</Card.Title>
									<Card.Description>
										{task.description}
									</Card.Description>
								</Card.Header>
							</Card.Root>
						</a>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
