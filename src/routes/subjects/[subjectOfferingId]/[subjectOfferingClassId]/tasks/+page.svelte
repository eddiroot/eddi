<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';
	import { draggable, droppable, type DragDropState, dndState } from '@thisux/sveltednd';
	import { updateTaskOrder, updateTopicOrder } from './client';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { getPermissions } from '$lib/utils';

	let { data } = $props();
	let topicsWithTasks = $state(data.topicsWithTasks || []);
	let isRearrangeMode = $state(false);

	// When switching to other subject task pages, we need to update the state
	$effect(() => {
		topicsWithTasks = data.topicsWithTasks || [];
	});

	async function handleDrop(state: DragDropState<any>) {
		if (!isRearrangeMode) return;

		const { sourceContainer, targetContainer } = state;
		if (!targetContainer || !sourceContainer || !topicsWithTasks.length) return;

		if (sourceContainer.startsWith('topic-') && targetContainer.startsWith('task-')) {
			return;
		}

		if (sourceContainer.startsWith('topic-') && targetContainer.startsWith('topic-')) {
			const sourceTopicId = parseInt(sourceContainer.split('-')[1]);
			const targetTopicId = parseInt(targetContainer.split('-')[1]);
			const allTopics = topicsWithTasks.map((item) => item.topic);
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
					topicsWithTasks = topicsWithTasks
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

		if (sourceContainer.startsWith('task-') && targetContainer.startsWith('task-')) {
			const sourceTaskId = parseInt(sourceContainer.split('-')[1]);
			const targetTaskId = parseInt(targetContainer.split('-')[1]);
			const tasks = topicsWithTasks.flatMap((item) => item.tasks);
			const sourceTask = tasks.find((l) => l.id === sourceTaskId);
			const targetTask = tasks.find((l) => l.id === targetTaskId);

			if (
				sourceTaskId !== targetTaskId &&
				sourceTask &&
				targetTask &&
				sourceTask.taskTopicId === targetTask.taskTopicId
			) {
				const topicTasks = topicsWithTasks.find(
					(item) => item.topic.id === sourceTask.taskTopicId
				)?.tasks;

				if (topicTasks) {
					// Find the actual array indices, not the database indices
					const sourceIndex = topicTasks.findIndex((l) => l.id === sourceTaskId);
					const targetIndex = topicTasks.findIndex((l) => l.id === targetTaskId);

					if (sourceIndex !== -1 && targetIndex !== -1) {
						const newTasks = [...topicTasks];
						const [movedTask] = newTasks.splice(sourceIndex, 1);
						newTasks.splice(targetIndex, 0, movedTask);

						const taskOrder = newTasks.map((task, index) => ({
							id: task.id,
							index
						}));

						try {
							await updateTaskOrder({ taskOrder });
							topicsWithTasks = topicsWithTasks.map((item) => {
								if (item.topic.id === sourceTask.taskTopicId) {
									return {
										...item,
										tasks: newTasks.map((task, index) => ({
											...task,
											index
										}))
									};
								}
								return item;
							});
						} catch (error) {
							console.error('Error updating task order:', error);
							alert('Failed to update task order. Please try again.');
						}
					}
				}
			}
		}
	}

	const permissions = $state(getPermissions(data.user?.type || ''));
</script>

<div class="space-y-6 p-8">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">Tasks</h1>
		{#if permissions.includes('create_tasks')}
			<div class="flex items-center gap-2">
				<Button
					onclick={() => (isRearrangeMode = !isRearrangeMode)}
					variant={isRearrangeMode ? 'default' : 'outline'}
				>
					<ArrowUpDownIcon class="h-4 w-4" />
					{isRearrangeMode ? 'Done' : 'Rearrange'}
				</Button>
				<Button href={`${page.url.pathname}/new`} variant="outline">
					<PlusIcon class="h-4 w-4" />
					New Task
				</Button>
			</div>
		{/if}
	</div>

	<div>
		{#each topicsWithTasks as { topic, tasks }}
			<div>
				<div class="flex items-center gap-2">
					{#if isRearrangeMode}
						<div
							use:draggable={{
								container: `topic-${topic.id}`,
								dragData: topic
							}}
							class="bg-primary hover:bg-primary/90 flex h-6 w-6 cursor-grab items-center justify-center rounded-full shadow-md transition-colors active:cursor-grabbing"
						>
							<GripVerticalIcon class="text-primary-foreground h-3 w-3 rounded" />
						</div>
					{/if}
					<h2 class="text-foreground text-xl font-semibold">{topic.name}</h2>
				</div>

				<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{#if tasks.length === 0}
						<div class="text-muted-foreground col-span-full">
							No tasks available for this topic.
						</div>
					{/if}
					{#each tasks as task}
						<div class="relative">
							{#if isRearrangeMode}
								<div
									use:draggable={{
										container: `task-${task.id}`,
										dragData: task
									}}
									class="bg-secondary hover:bg-secondary/90 absolute -top-2 -left-2 z-10 flex h-6 w-6 cursor-grab items-center justify-center rounded-full shadow-md transition-colors active:cursor-grabbing"
								>
									<GripVerticalIcon class="text-secondary-foreground h-3 w-3 rounded" />
								</div>
							{/if}

							<a
								href={`${page.url.pathname}/${task.id}`}
								class="block h-full"
								use:droppable={{
									container: `task-${task.id}`,
									callbacks: {
										onDrop: handleDrop
									}
								}}
							>
								<Card.Root
									class="h-full transition-shadow hover:shadow-md {isRearrangeMode &&
									dndState.sourceContainer.startsWith('task') &&
									dndState.sourceContainer !== `task-${task.id}` &&
									dndState.targetContainer === `task-${task.id}`
										? 'border-accent-foreground border-dashed'
										: ''}"
								>
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
					{#if isRearrangeMode && dndState.sourceContainer.startsWith('topic') && dndState.sourceContainer != `topic-${topic.id}`}
						<Separator class="bg-accent-foreground" />
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
