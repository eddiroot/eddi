<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import type { Lesson, LessonTopic } from '$lib/server/db/schema.js';
	import { page } from '$app/state';

	let { data } = $props();

	const lessons = $derived(() => data.lessons);

	const getLessonsByTopic = (lessons: { lesson: Lesson; lessonTopic: LessonTopic }[]) => {
		const grouped: { [key: string]: { lesson: Lesson; lessonTopic: LessonTopic }[] } = {};
		for (const lesson of lessons) {
			const topicName = lesson.lessonTopic.name;
			if (!grouped[topicName]) {
				grouped[topicName] = [];
			}
			grouped[topicName].push(lesson);
		}
		return grouped;
	};
</script>

<div class="space-y-6 p-8">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">Lessons</h1>
		<a href={`${page.url.pathname}/new`} class={buttonVariants({ variant: 'outline' })}>
			<PlusIcon class="h-4 w-4" />
			New Lesson
		</a>
	</div>

	<!-- Lessons grouped by topic -->
	<div class="space-y-8">
		{#each Object.entries(getLessonsByTopic(lessons()!)) as [topicName, lessonItems], index}
			<div class="space-y-4">
				<!-- Topic Title -->
				<h2 class="text-foreground text-xl font-semibold">{topicName}</h2>

				<!-- Lessons for this topic -->
				<div class="space-y-3">
					{#each lessonItems as item}
						<div>
							<a href={`${page.url.pathname}/${item.lesson.id}`}>
								<Card>
									<CardContent>
										<div class="flex items-center justify-between">
											<div class="flex-1">
												<h3 class="mb-2 text-lg font-medium">{item.lesson.title}</h3>
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
							</a>
						</div>
					{/each}
				</div>
			</div>

			{#if index < Object.entries(getLessonsByTopic(lessons()!)).length - 1}
				<Separator />
			{/if}
		{/each}
	</div>
</div>
