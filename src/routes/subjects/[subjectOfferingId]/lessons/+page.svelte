<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import type { Lesson, LessonTopic } from '$lib/server/db/schema.js';
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';

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
		<Button href={`${page.url.pathname}/new`} variant="outline">
			<PlusIcon class="h-4 w-4" />
			New Lesson
		</Button>
	</div>

	<!-- Lessons grouped by topic -->
	<div class="space-y-8">
		{#each Object.entries(getLessonsByTopic(lessons()!)) as [topicName, lessonItems], index}
			<div class="space-y-4">
				<!-- Topic Title -->
				<h2 class="text-foreground text-xl font-semibold">{topicName}</h2>

				<!-- Lessons for this topic -->
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{#if lessonItems.length === 0}
						<div class="text-muted-foreground col-span-full">
							No lessons available for this topic yet.
						</div>
					{/if}
					{#each lessonItems as item}
						<a href={`${page.url.pathname}/${item.lesson.id}`} class="block h-full">
							<Card.Root class="h-full">
								<Card.Header>
									<Card.Title>
										{item.lesson.title}
									</Card.Title>
									<Card.Description>
										{item.lesson.description}
									</Card.Description>
								</Card.Header>
							</Card.Root>
						</a>
					{/each}
				</div>
			</div>

			{#if index < Object.entries(getLessonsByTopic(lessons()!)).length - 1}
				<Separator />
			{/if}
		{/each}
	</div>
</div>
