<script>
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import PlusIcon from '@lucide/svelte/icons/plus';

	let { data } = $props();
	
	// Group lessons by topic
	const lessonsByTopic = (data?.lessons || []).reduce((acc, item) => {
		const topicName = item.lessonTopic.name;
		if (!acc[topicName]) {
			acc[topicName] = [];
		}
		acc[topicName].push(item);
		return acc;
	}, {});
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">Lessons</h1>
		<Button variant="outline" class="gap-2">
			<PlusIcon class="h-4 w-4" />
			New Lesson
		</Button>
	</div>

	<!-- Lessons grouped by topic -->
	<div class="space-y-8">
		{#each Object.entries(lessonsByTopic) as [topicName, lessonItems]}
			<div class="space-y-4">
				<!-- Topic Title -->
				<h2 class="text-xl font-semibold text-foreground">{topicName}</h2>
				
				<!-- Lessons for this topic -->
				<div class="space-y-3">
					{#each lessonItems as item}
						<Card class="rounded-2xl border-2 hover:shadow-md transition-shadow cursor-pointer">
							<CardContent class="p-6">
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<h3 class="font-medium text-lg mb-2">{item.lesson.name}</h3>
										{#if item.lesson.description}
											<p class="text-muted-foreground text-sm">{item.lesson.description}</p>
										{/if}
									</div>
									<Badge variant="secondary" class="ml-4">
										Week {item.lesson.subjectWeek}
									</Badge>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			</div>
			
			{#if Object.entries(lessonsByTopic).indexOf([topicName, lessonItems]) < Object.entries(lessonsByTopic).length - 1}
				<Separator />
			{/if}
		{/each}
	</div>
</div>
