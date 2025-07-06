<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';
	import { draggable, droppable, type DragDropState, dndState } from '@thisux/sveltednd';
	import { updateLessonOrder, updateTopicOrder } from './client';
	import Separator from '$lib/components/ui/separator/separator.svelte';

	let { data } = $props();
	let topicsWithLessons = $state(data.topicsWithLessons || []);

	// When switching to other subject lesson pages, we need to update the state
	$effect(() => {
		topicsWithLessons = data.topicsWithLessons || [];
	});

	async function handleDrop(state: DragDropState<any>) {
		const { sourceContainer, targetContainer } = state;
		if (!targetContainer || !sourceContainer || !topicsWithLessons.length) return;

		if (sourceContainer.startsWith('topic-') && targetContainer.startsWith('lesson-')) {
			return;
		}

		if (sourceContainer.startsWith('topic-') && targetContainer.startsWith('topic-')) {
			const sourceTopicId = parseInt(sourceContainer.split('-')[1]);
			const targetTopicId = parseInt(targetContainer.split('-')[1]);
			const allTopics = topicsWithLessons.map((item) => item.topic);
			const sourceTopic = allTopics.find((t) => t.id === sourceTopicId);
			const targetTopic = allTopics.find((t) => t.id === targetTopicId);

			if (sourceTopicId !== targetTopicId && sourceTopic && targetTopic) {
				const [movedTopic] = allTopics.splice(sourceTopic.index, 1);
				allTopics.splice(targetTopic.index, 0, movedTopic);

				const topicOrder = allTopics.map((topic, index) => ({
					id: topic.id,
					index
				}));

				try {
					await updateTopicOrder({ topicOrder });
					topicsWithLessons = topicsWithLessons
						.map((item) => {
							const newIndex = allTopics.findIndex((t) => t.id === item.topic.id);
							return { ...item, topic: { ...item.topic, index: newIndex } };
						})
						.sort((a, b) => a.topic.index - b.topic.index);
				} catch (error) {
					alert('Failed to update topic order. Please try again.');
				}
			}
		}

		if (sourceContainer.startsWith('lesson-') && targetContainer.startsWith('lesson-')) {
			const sourceLessonId = parseInt(sourceContainer.split('-')[1]);
			const targetLessonId = parseInt(targetContainer.split('-')[1]);
			const lessons = topicsWithLessons.flatMap((item) => item.lessons);
			const sourceLesson = lessons.find((l) => l.id === sourceLessonId);
			const targetLesson = lessons.find((l) => l.id === targetLessonId);

			if (
				sourceLessonId !== targetLessonId &&
				sourceLesson &&
				targetLesson &&
				sourceLesson.lessonTopicId === targetLesson.lessonTopicId
			) {
				const topicLessons = topicsWithLessons.find(
					(item) => item.topic.id === sourceLesson.lessonTopicId
				)?.lessons;
				const sourceIndex = sourceLesson.index;
				const targetIndex = targetLesson.index;

				if (sourceIndex !== -1 && targetIndex !== -1 && topicLessons) {
					const newLessons = [...topicLessons];
					const [movedLesson] = newLessons.splice(sourceIndex, 1);
					newLessons.splice(targetIndex, 0, movedLesson);

					const lessonOrder = newLessons.map((lesson, index) => ({
						id: lesson.id,
						index
					}));

					try {
						await updateLessonOrder({ lessonOrder });
						topicsWithLessons = topicsWithLessons.map((item) => {
							if (item.topic.id === sourceLesson.lessonTopicId) {
								return { ...item, lessons: newLessons };
							}
							return item;
						});
					} catch (error) {
						console.error('Error updating lesson order:', error);
						alert('Failed to update lesson order. Please try again.');
					}
				}
			}
		}
	}
</script>

<div class="space-y-6 p-8">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">Lessons</h1>
		<Button href={`${page.url.pathname}/new`} variant="outline">
			<PlusIcon class="h-4 w-4" />
			New Lesson
		</Button>
	</div>

	<div>
		{#each topicsWithLessons as { topic, lessons }}
			<div>
				<div class="flex items-center gap-2">
					<div
						use:draggable={{
							container: `topic-${topic.id}`,
							dragData: topic
						}}
						class="bg-secondary hover:bg-secondary/90 dark:hover:bg-secondary/90 flex h-6 w-6 cursor-grab items-center justify-center rounded-full shadow-md transition-colors active:cursor-grabbing"
					>
						<GripVerticalIcon class="text-muted-foreground h-3 w-3 rounded" />
					</div>
					<h2 class="text-foreground text-xl font-semibold">{topic.name}</h2>
				</div>

				<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{#if lessons.length === 0}
						<div class="text-muted-foreground col-span-full">
							No lessons available for this topic.
						</div>
					{/if}
					{#each lessons as lesson}
						<div class="relative">
							<div
								use:draggable={{
									container: `lesson-${lesson.id}`,
									dragData: lesson
								}}
								class="bg-secondary hover:bg-secondary/90 dark:hover:bg-secondary/90 absolute -top-2 -left-2 z-10 flex h-6 w-6 cursor-grab items-center justify-center rounded-full shadow-md transition-colors active:cursor-grabbing"
							>
								<GripVerticalIcon class="text-muted-foreground h-3 w-3 rounded" />
							</div>

							<a
								href={`${page.url.pathname}/${lesson.id}`}
								class="block h-full"
								use:droppable={{
									container: `lesson-${lesson.id}`,
									callbacks: {
										onDrop: handleDrop
									}
								}}
							>
								<Card.Root
									class="h-full transition-shadow hover:shadow-md {dndState.sourceContainer.startsWith(
										'lesson'
									) &&
									dndState.sourceContainer !== `lesson-${lesson.id}` &&
									dndState.targetContainer === `lesson-${lesson.id}`
										? 'border-accent-foreground border-dashed'
										: ''}"
								>
									<Card.Header>
										<Card.Title>
											{lesson.title}
										</Card.Title>
										<Card.Description>
											{lesson.description}
										</Card.Description>
									</Card.Header>
								</Card.Root>
							</a>
						</div>
					{/each}
				</div>
				<div
					class="flex h-8 items-center"
					use:droppable={{
						container: `topic-${topic.id}`,
						callbacks: {
							onDrop: handleDrop
						}
					}}
				>
					{#if dndState.sourceContainer.startsWith('topic') && dndState.sourceContainer != `topic-${topic.id}` && dndState.targetContainer == `topic-${topic.id}`}
						<Separator class="bg-accent-foreground" />
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
