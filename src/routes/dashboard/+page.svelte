<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Badge } from '$lib/components/ui/badge';
	import { formatTimestamp, formatTimestampAsTime } from '$lib/utils';
	import { generateSubjectColors } from '../timetable/utils';

	let { data } = $props();

	const mockSchoolNews = [
		{
			title: 'Swimming Carnival',
			message: 'Swimming carnival is coming up...',
			date: 'Coming Soon'
		},
		{
			title: 'School Play',
			message: 'Join us for the annual school play...',
			date: 'Next Month'
		},
		{
			title: 'Science Fair',
			message: 'Students are invited to participate in the science fair...',
			date: 'In Two Weeks'
		},
		{
			title: 'Sports Day',
			message: 'Get ready for the annual sports day!',
			date: 'Next Friday'
		}
	];

	const mockAssessments = [
		{ subject: 'Mathematics', type: 'Quiz', dueDate: 'Tomorrow', topic: 'Algebra' },
		{ subject: ' English', type: 'Essay', dueDate: 'Next Week', topic: 'Shakespeare' },
		{ subject: 'Science', type: 'Lab Report', dueDate: 'Friday', topic: 'Chemistry' }
	];

	const mockQuickActions = [
		{ title: 'Submit Assignment', description: 'Upload your latest work', icon: '📝' },
		{ title: 'Book Study Room', description: 'Reserve library space', icon: '📚' },
		{ title: 'Contact Teacher', description: 'Send a message', icon: '💬' },
		{ title: 'View Grades', description: 'Check recent results', icon: '📊' }
	];
</script>

<div class="grid h-full grid-cols-1 gap-6 overflow-y-auto p-8 xl:grid-cols-[2fr_1fr]">
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:grid-rows-[0.5fr_0.5fr]">
		<!-- Recent Forum Announcements -->
		<Card.Root class="h-full overflow-hidden border-2 shadow-none">
			<Card.Header>
				<Card.Title class="text-xl">Recent Forum Announcements</Card.Title>
			</Card.Header>
			<Card.Content class="h-full overflow-hidden">
				{#if data.announcements && data.announcements.length > 0}
					<ScrollArea class="h-full">
						<div class="space-y-4 pr-4">
							{#each data.announcements as announcement}
								<a
									href="/subjects/{announcement.subjectOffering.id}/discussion/{announcement
										.announcement.id}"
									class="hover:bg-muted/50 block rounded-lg transition-colors"
								>
									<div class="border-border rounded-lg border-2 p-4">
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
														{formatTimestamp(announcement.announcement.createdAt)}
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

		<!-- School News -->
		<Card.Root class="h-full overflow-hidden border-2 shadow-none">
			<Card.Header>
				<Card.Title class="text-xl">School News</Card.Title>
			</Card.Header>
			<Card.Content class="h-full overflow-hidden">
				{#if mockSchoolNews.length > 0}
					<ScrollArea class="h-full">
						<div class="space-y-4 pr-4">
							{#each mockSchoolNews as news}
								<div class="border-border rounded-lg border-2 p-4">
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
					</ScrollArea>
				{:else}
					<p class="text-muted-foreground text-center">No news updates available.</p>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- Quick Actions -->
		<Card.Root class="h-full overflow-hidden border-2 shadow-none">
			<Card.Header>
				<Card.Title class="text-xl">Quick Actions</Card.Title>
			</Card.Header>
			<Card.Content class="h-full overflow-hidden">
				<div class="grid grid-cols-2 gap-3">
					{#each mockQuickActions as action}
						<button
							class="border-border hover:bg-muted/50 rounded-lg border-2 p-3 text-left transition-colors"
						>
							<div class="flex items-center gap-2">
								<span class="text-lg">{action.icon}</span>
								<div class="flex-1">
									<h4 class="text-foreground text-sm font-medium">{action.title}</h4>
									<p class="text-muted-foreground text-xs">{action.description}</p>
								</div>
							</div>
						</button>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Upcoming Assessments -->
		<Card.Root class="h-full overflow-hidden border-2 shadow-none">
			<Card.Header>
				<Card.Title class="text-xl">Upcoming Assessments</Card.Title>
			</Card.Header>
			<Card.Content class="h-full overflow-hidden">
				{#if mockAssessments.length > 0}
					<div class="space-y-2">
						{#each mockAssessments as assessment}
							<div class="border-border rounded-lg border-2 p-3">
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<h4 class="text-foreground font-medium">{assessment.subject}</h4>
										<p class="text-muted-foreground text-sm">
											{assessment.type} - {assessment.topic}
										</p>
									</div>
									<span class="text-primary text-xs font-medium">
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

	<!-- Right Sidebar - Today's Timetable -->
	<Card.Root class="h-full overflow-hidden border-2 shadow-none">
		<Card.Header>
			<Card.Title class="text-xl">Today's Timetable</Card.Title>
		</Card.Header>
		<Card.Content class="h-full overflow-hidden">
			{#if data.userClasses && data.userClasses.length > 0}
				<ScrollArea class="h-full">
					<div class="space-y-3 pr-4">
						{#each data.userClasses as cls}
							{@const colors = generateSubjectColors(cls.userSubjectOffering.color)}
							<a href="/subjects/{cls.subjectOffering.id}" class="block">
								<div
									class="border-border flex items-center justify-between rounded-lg border-2 border-t-3 p-3 shadow-lg transition-opacity duration-200 hover:opacity-75"
									style="border-top-color: {colors.borderTop};"
								>
									<div class="flex-1">
										<div class="text-foreground font-medium" style="color: {colors.text}">
											{cls.subject.name}
										</div>
										<div class="text-muted-foreground text-sm">{cls.schoolSpace.name}</div>
									</div>
									<div class="text-muted-foreground text-sm font-medium">
										{formatTimestampAsTime(cls.classAllocation.startTimestamp)} - {formatTimestampAsTime(
											cls.classAllocation.endTimestamp
										)}
									</div>
								</div>
							</a>
						{/each}
					</div>
				</ScrollArea>
			{:else}
				<p class="text-muted-foreground text-center">No classes scheduled for today.</p>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
