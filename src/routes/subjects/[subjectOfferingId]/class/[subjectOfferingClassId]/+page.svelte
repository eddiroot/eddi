<script lang="ts">

import * as Card from '$lib/components/ui/card';
import { ScrollArea } from '$lib/components/ui/scroll-area';

let { data } = $props();

const sortedAssessments = $derived(data.assessments 
	? [...data.assessments].sort((a, b) => 
		new Date(b.task.createdAt).getTime() - new Date(a.task.createdAt).getTime()
	) 
	: []);

const sortedTasks = $derived(data.tasks 
	? [...data.tasks].sort((a, b) => 
		new Date(b.task.createdAt).getTime() - new Date(a.task.createdAt).getTime()
	) 
	: []);

const sortedResources = $derived(data.resources 
	? [...data.resources].sort((a, b) => 
		new Date(b.resource.createdAt).getTime() - new Date(a.resource.createdAt).getTime()
	) 
	: []);

</script>

<div class="p-8">

	<!-- Header -->
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-foreground text-3xl font-bold">{data.thisSubjectOffering?.name ?? 'Home'} {data.thisSubjectOfferingClass.subjectOfferingClass.name}</h1>
			<p class="text-muted-foreground mt-1">
				Teacher: {data.thisSubjectOfferingTeachers
					.map((teacher) => `${teacher.teacher.firstName} ${teacher.teacher.lastName}`)
					.join(', ')}
			</p>
		</div>
	</div>

	<!-- Main Content Grid -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">

	<!-- Announcements -->
	<Card.Root class="shadow-none xl:col-span-2">
		<Card.Header>
			<Card.Title class="text-lg">Latest Announcement</Card.Title>
		</Card.Header>
		<Card.Content>
			<ScrollArea class="h-64">
				<div class="space-y-2 pr-4">
					{#if data.announcements && data.announcements.length > 0}
						<div class="border-border rounded-lg border p-3">
							<div class="flex flex-col">
								<span class="text-foreground text-base font-semibold">{data.announcements[0].title}</span>
								<span class="text-muted-foreground text-sm leading-relaxed">{data.announcements[0].content}</span>
								<span class="text-xs text-muted-foreground mt-1">{new Date(data.announcements[0].createdAt).toLocaleString()}</span>
							</div>
						</div>
					{:else}
						<div class="text-muted-foreground text-sm">No announcements yet.</div>
					{/if}
				</div>
			</ScrollArea>
		</Card.Content>
	</Card.Root>

	<!-- Contact Information -->
	<Card.Root class="shadow-none">
		<Card.Header>
			<Card.Title class="text-lg">Contacts</Card.Title>
		</Card.Header>
		<Card.Content>
			<ScrollArea class="h-64">
				<div class="space-y-2">
					{#each data.thisSubjectOfferingTeachers as teacher}
						<div class="border-border rounded-lg border p-3">
							<h4 class="text-foreground text-sm font-medium">
								{teacher.teacher.firstName} {teacher.teacher.lastName}
							</h4>
							<p class="text-muted-foreground mt-1 text-sm">
								{teacher.teacher.email}
							</p>
						</div>
					{/each}
				</div>
			</ScrollArea>
		</Card.Content>
	</Card.Root>

	<!-- Assessments -->
	<Card.Root class="shadow-none">
		<Card.Header>
			<Card.Title class="text-lg">Assessments</Card.Title>
		</Card.Header>
		<Card.Content>
			<ScrollArea class="h-64">
				<div class="space-y-2 pr-4">
					{#if sortedAssessments.length > 0}
						{#each sortedAssessments as assessment}
							<div class="border-border rounded-lg border p-3">
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<h4 class="text-foreground text-sm font-medium">{assessment.task.title}</h4>
										{#if assessment.task.description}
											<p class="text-muted-foreground text-sm mt-1 leading-relaxed">{assessment.task.description}</p>
										{/if}
										<div class="flex items-center gap-2 mt-1">
											{#if assessment.subjectOfferingClassTask.dueDate}
												<span class="text-xs text-muted-foreground">Due: {new Date(assessment.subjectOfferingClassTask.dueDate).toLocaleDateString()}</span>
											{/if}
											<span class="text-xs text-muted-foreground">Created: {new Date(assessment.task.createdAt).toLocaleDateString()}</span>
										</div>
									</div>
								</div>
							</div>
						{/each}
					{:else}
						<div class="text-muted-foreground text-sm">No assessments found.</div>
					{/if}
				</div>
			</ScrollArea>
		</Card.Content>
	</Card.Root>

	<!-- Tasks (Lessons, Homework, Resources) -->
	<Card.Root class="shadow-none">
		<Card.Header>
			<Card.Title class="text-lg">Tasks</Card.Title>
		</Card.Header>
		<Card.Content>
			<ScrollArea class="h-64">
				<div class="space-y-2 pr-4">
					{#if sortedTasks.length > 0}
						{#each sortedTasks as task}
							<div class="border-border rounded-lg border p-3">
								<div class="flex flex-col">
									<span class="text-foreground text-base font-semibold">{task.task.title}</span>
									{#if task.task.description}
										<p class="text-muted-foreground text-sm mt-1 leading-relaxed">{task.task.description}</p>
									{/if}
									<div class="flex items-center gap-2 mt-1">
										{#if task.task.type}
											<span class="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">{task.task.type}</span>
										{/if}
										{#if task.subjectOfferingClassTask.dueDate}
											<span class="text-xs text-muted-foreground">Due: {new Date(task.subjectOfferingClassTask.dueDate).toLocaleDateString()}</span>
										{/if}
										<span class="text-xs text-muted-foreground">Created: {new Date(task.task.createdAt).toLocaleDateString()}</span>
									</div>
								</div>
							</div>
						{/each}
					{:else}
						<div class="text-muted-foreground text-sm">No tasks found.</div>
					{/if}
				</div>
			</ScrollArea>
		</Card.Content>
	</Card.Root>

	<!-- Resources -->
	<Card.Root class="shadow-none">
		<Card.Header>
			<Card.Title class="text-lg">Resources</Card.Title>
		</Card.Header>
		<Card.Content>
			<ScrollArea class="h-64">
				<div class="space-y-2 pr-4">
					{#if sortedResources.length > 0}
						{#each sortedResources as resource}
							<div class="border-border rounded-lg border p-3">
								<div class="flex flex-col">
									{#if resource.downloadUrl}
										<a href={resource.downloadUrl} target="_blank" class="text-foreground text-base font-semibold hover:underline">
											{resource.resourceRelation.title || resource.resource.fileName}
										</a>
									{:else}
										<span class="text-foreground text-base font-semibold">{resource.resourceRelation.title || resource.resource.fileName}</span>
									{/if}
									{#if resource.resourceRelation.description}
										<p class="text-muted-foreground text-sm mt-1 leading-relaxed">{resource.resourceRelation.description}</p>
									{/if}
									<div class="flex items-center gap-2 mt-1">
										<span class="text-xs text-muted-foreground">Created: {new Date(resource.resource.createdAt).toLocaleDateString()}</span>
										{#if resource.author}
											<span class="text-xs text-muted-foreground">by {resource.author.firstName} {resource.author.lastName}</span>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					{:else}
						<div class="text-muted-foreground text-sm">No resources found.</div>
					{/if}
				</div>
			</ScrollArea>
		</Card.Content>
	</Card.Root>
	</div>
</div>
