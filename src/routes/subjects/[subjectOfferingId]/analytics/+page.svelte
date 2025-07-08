<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import UsersIcon from '@lucide/svelte/icons/users';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';

	let { data } = $props();

	// Mock data for the analytics
	const mockData = {
		overview: {
			totalStudents: 156,
			totalDiscussions: 89,
			totalLessons: 24
		}
	};
</script>

<div class="space-y-6 p-8">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">{data.subject.name} Class Analytics</h1>
			<p class="text-muted-foreground">Overview of student engagement, discussions, and lesson progress</p>
		</div>
	</div>

	<!-- Overview Cards -->
	<div class="grid gap-4 md:grid-cols-3">
		<Card.Root class="shadow-none">
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Total Students</Card.Title>
				<UsersIcon class="h-4 w-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{mockData.overview.totalStudents}</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="shadow-none">
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Total Discussions</Card.Title>
				<MessageSquareIcon class="h-4 w-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{mockData.overview.totalDiscussions}</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="shadow-none">
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Total Lessons</Card.Title>
				<BookOpenIcon class="h-4 w-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{mockData.overview.totalLessons}</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>
