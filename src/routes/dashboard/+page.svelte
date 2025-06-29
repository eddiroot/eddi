<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Badge } from '$lib/components/ui/badge';
	import { formatDate, formatTime } from '$lib/utils';

	let { data } = $props();

	const mockSchoolNews = [
		{
			title: 'Swimming Carnival',
			message: 'Swimming carnival is coming up...',
			date: 'Coming Soon'
		}
	];

	const mockAssessments = [
		{ subject: 'Mathematics', type: 'Quiz', dueDate: 'Tomorrow', topic: 'Algebra' },
		{ subject: 'English', type: 'Essay', dueDate: 'Next Week', topic: 'Shakespeare' },
		{ subject: 'Science', type: 'Lab Report', dueDate: 'Friday', topic: 'Chemistry' }
	];
</script>

<div class="grid h-full grid-cols-1 gap-6 p-8 lg:grid-cols-2">
	<Card.Root class="h-full shadow-none">
		<Card.Header>
			<Card.Title class="text-xl">Recent Forum Announcements</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if data.announcements && data.announcements.length > 0}
				<ScrollArea class="h-80">
					<div class="space-y-4 pr-4">
						{#each data.announcements as announcement}
							<a
								href="/subjects/{announcement.subjectOffering.id}/discussion/{announcement
									.announcement.id}"
								class="hover:bg-muted/50 block rounded-lg transition-colors"
							>
								<div class="border-border rounded-lg border p-4">
									<div class="flex items-start justify-between gap-3">
										<div class="flex-1">
											<h3 class="text-foreground font-semibold">
												{announcement.announcement.title}
											</h3>
											<div class="mt-1 flex items-center gap-2">
												<Badge variant="secondary" class="text-xs">
													{announcement.subject.name}
												</Badge>
												<span class="text-muted-foreground text-xs">
													{formatDate(announcement.announcement.createdAt)}
												</span>
											</div>
											<p class="text-muted-foreground mt-2 line-clamp-3 text-sm">
												{announcement.announcement.content}
											</p>
										</div>
									</div>
								</div>
							</a>
						{/each}
					</div>
				</ScrollArea>
			{:else}
				<p class="text-muted-foreground text-center">No recent announcements.</p>
			{/if}
		</Card.Content>
	</Card.Root>

	<Card.Root class="h-full shadow-none">
		<Card.Header>
			<Card.Title class="text-xl">School News</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if mockSchoolNews.length > 0}
				<div class="space-y-4">
					{#each mockSchoolNews as news}
						<div class="border-border rounded-lg border p-4">
							<h3 class="text-foreground font-semibold">{news.title}</h3>
							<p class="text-muted-foreground mt-2 text-sm">{news.message}</p>
							{#if news.date}
								<span
									class="text-accent-foreground bg-accent mt-2 inline-block rounded px-2 py-1 text-xs"
								>
									{news.date}
								</span>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-muted-foreground text-center">No news updates available.</p>
			{/if}
		</Card.Content>
	</Card.Root>

	<Card.Root class="shadow-none">
		<Card.Header class="flex flex-row items-center justify-between">
			<Card.Title class="text-xl">Today's Timetable</Card.Title>
			<Button variant="ghost" size="sm" class="h-8 w-8 p-0">
				<span class="text-2xl">🙋‍♂️</span>
				<span class="sr-only">Ask Eddi</span>
			</Button>
		</Card.Header>
		<Card.Content>
			{#if data.userClasses && data.userClasses.length > 0}
				{#each data.userClasses as cls}
					<div class="border-border flex items-center justify-between rounded-lg border p-3">
						<div class="flex-1">
							<div class="text-foreground font-medium">{cls.subject.name}</div>
							<div class="text-muted-foreground text-sm">{cls.schoolLocation.name}</div>
						</div>
						<div class="text-muted-foreground text-sm font-medium">
							{formatTime(cls.classAllocation.startTime)}
						</div>
					</div>
				{/each}
			{:else}
				<p class="text-muted-foreground text-center">No classes scheduled for today.</p>
			{/if}
		</Card.Content>
	</Card.Root>

	<Card.Root class="shadow-none">
		<Card.Header>
			<Card.Title class="text-xl">Upcoming Assessments</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if mockAssessments.length > 0}
				<div class="space-y-3">
					{#each mockAssessments as assessment}
						<div class="border-border rounded-lg border p-3">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<h4 class="text-foreground font-medium">{assessment.subject}</h4>
									<p class="text-muted-foreground text-sm">
										{assessment.type} - {assessment.topic}
									</p>
								</div>
								<span class="text-destructive text-xs font-medium">
									Due: {assessment.dueDate}
								</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-muted-foreground text-center">No upcoming assessments.</p>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
