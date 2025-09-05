<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Progress } from '$lib/components/ui/progress';
	import { Button } from '$lib/components/ui/button';
	import UsersIcon from '@lucide/svelte/icons/users';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import MailIcon from '@lucide/svelte/icons/mail';
	import PhoneIcon from '@lucide/svelte/icons/phone';

	let { data } = $props();

	// Use student data from server for breadcrumb, with additional mock data for display
	// TODO: get this data from the server
	const studentData = {
		name: `${data.student.firstName} ${data.student.lastName}`,
		avatar: data.student.avatarUrl,
		grade: 85,
		assignmentsCompleted: 75,
		assignmentsTotal: 4,
		assignmentsCompletedCount: 3,
		lessonsCompleted: 100,
		lessonsTotal: 6,
		lessonsCompletedCount: 6,
		homeworkCompleted: 75,
		homeworkTotal: 4,
		homeworkCompletedCount: 3,
		lastActive: '< 1 day',
		questionsPosted: 7,
		questionsAnswered: 15,
		totalContributions: 22,
		assignmentHistory: [
			{ name: 'Assignment 1', grade: 85, dueDate: '1 week ago', status: 'completed' },
			{ name: 'Assignment 2', grade: 78, dueDate: '3 days ago', status: 'completed' },
			{ name: 'Assignment 3', grade: 92, dueDate: 'In 2 days', status: 'submitted' },
			{ name: 'Assignment 4', grade: null, dueDate: 'In 1 week', status: 'pending' }
		],
		lessonProgress: [
			{ name: 'Lesson 1', grade: 88, dueDate: '2 weeks ago', status: 'completed' },
			{ name: 'Lesson 2', grade: 92, dueDate: '1 week ago', status: 'completed' },
			{ name: 'Lesson 3', grade: 85, dueDate: '3 days ago', status: 'completed' },
			{ name: 'Lesson 4', grade: 90, dueDate: '1 day ago', status: 'completed' },
			{ name: 'Lesson 5', grade: 87, dueDate: 'In 2 days', status: 'submitted' },
			{ name: 'Lesson 6', grade: null, dueDate: 'In 1 week', status: 'pending' }
		],
		activityTimeline: [
			{ activity: 'Submitted Assignment 2', time: '2 hours ago', type: 'assignment' },
			{ activity: 'Completed Lesson 6', time: '1 day ago', type: 'lesson' },
			{ activity: 'Posted question in discussion', time: '2 days ago', type: 'discussion' },
			{ activity: 'Submitted Assignment 1', time: '1 week ago', type: 'assignment' }
		],
		parentContact: {
			guardianName: 'Sarah Smith',
			relationship: 'Mother',
			email: 'sarah.smith@email.com',
			phone: '+1 (555) 123-4567',
			preferredContact: 'email'
		}
	};
</script>

<div class="space-y-6 p-8">
	<!-- Header with back button -->
	<div class="flex items-center gap-4">
		<a
			href={`/subjects/${data.subject.id}/class/${data.subjectOfferingClassId}/analytics`}
			class="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
		>
			<ArrowLeftIcon />
			Back to Class Analytics
		</a>
	</div>

	<h1 class="text-3xl font-bold tracking-tight">Student Analytics: {studentData.name}</h1>

	<!-- Student Overview Cards -->
	<div class="grid gap-6 md:grid-cols-4">
		<Card.Root class="shadow-none">
			<Card.Header>
				<Card.Title class="text-lg">Current Grade</Card.Title>
			</Card.Header>
			<Card.Content class="flex items-center justify-center">
				<div class="text-4xl font-bold">{studentData.grade}%</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="shadow-none">
			<Card.Header>
				<Card.Title class="text-lg">Assignments</Card.Title>
			</Card.Header>
			<Card.Content class="flex items-center justify-center">
				<div class="text-4xl font-bold">
					{studentData.assignmentsCompletedCount}/{studentData.assignmentsTotal}
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="shadow-none">
			<Card.Header>
				<Card.Title class="text-lg">Lessons</Card.Title>
			</Card.Header>
			<Card.Content class="flex items-center justify-center">
				<div class="text-4xl font-bold">
					{studentData.lessonsCompletedCount}/{studentData.lessonsTotal}
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="shadow-none">
			<Card.Header>
				<Card.Title class="text-lg">Discussion Posts</Card.Title>
			</Card.Header>
			<Card.Content class="flex items-center justify-center">
				<div class="text-4xl font-bold">{studentData.totalContributions}</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Progress Overview -->
	<div class="grid gap-6 md:grid-cols-3">
		<Card.Root class="shadow-none">
			<Card.Header>
				<Card.Title class="text-lg">Assignment Progress</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="flex items-center justify-between">
					<span class="text-sm">Completed</span>
					<span class="text-sm font-medium">{studentData.assignmentsCompleted}%</span>
				</div>
				<Progress value={studentData.assignmentsCompleted} class="w-full" />
				<div class="text-muted-foreground text-xs">
					{studentData.assignmentsCompletedCount} of {studentData.assignmentsTotal} assignments
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="shadow-none">
			<Card.Header>
				<Card.Title class="text-lg">Lesson Progress</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="flex items-center justify-between">
					<span class="text-sm">Completed</span>
					<span class="text-sm font-medium">{studentData.lessonsCompleted}%</span>
				</div>
				<Progress value={studentData.lessonsCompleted} class="w-full" />
				<div class="text-muted-foreground text-xs">
					{studentData.lessonsCompletedCount} of {studentData.lessonsTotal} lessons
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="shadow-none">
			<Card.Header>
				<Card.Title class="text-lg">Homework Progress</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="flex items-center justify-between">
					<span class="text-sm">Completed</span>
					<span class="text-sm font-medium">{studentData.homeworkCompleted}%</span>
				</div>
				<Progress value={studentData.homeworkCompleted} class="w-full" />
				<div class="text-muted-foreground text-xs">
					{studentData.homeworkCompletedCount} of {studentData.homeworkTotal} homework assignments
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Assignment History -->
	<Card.Root class="shadow-none">
		<Card.Header>
			<Card.Title class="text-lg">Assignment History</Card.Title>
		</Card.Header>
		<Card.Content>
			<!-- Header table for consistent styling -->
			<Table.Root class="w-full table-fixed">
				<Table.Header class="border-b">
					<Table.Row>
						<Table.Head class="w-1/3">Assignment</Table.Head>
						<Table.Head class="w-32">Grade</Table.Head>
						<Table.Head class="w-40">Due Date</Table.Head>
						<Table.Head class="w-40">Status</Table.Head>
					</Table.Row>
				</Table.Header>
			</Table.Root>
			<div class="h-72 overflow-y-auto [scrollbar-gutter:stable]">
				<Table.Root class="w-full table-fixed">
					<Table.Body>
						{#each studentData.assignmentHistory as assignment}
							<Table.Row>
								<Table.Cell class="w-1/3 font-medium">
									<span class="text-primary block truncate font-medium">{assignment.name}</span>
								</Table.Cell>
								<Table.Cell class="w-32">
									{#if assignment.grade !== null}
										<Badge variant="secondary">{assignment.grade}%</Badge>
									{:else}
										<span class="text-muted-foreground">-</span>
									{/if}
								</Table.Cell>
								<Table.Cell class="w-40">{assignment.dueDate}</Table.Cell>
								<Table.Cell class="w-40">
									<Badge
										variant={assignment.status === 'completed'
											? 'default'
											: assignment.status === 'submitted'
												? 'secondary'
												: 'outline'}
									>
										{assignment.status}
									</Badge>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Lesson Progress -->
	<Card.Root class="shadow-none">
		<Card.Header>
			<Card.Title class="text-lg">Lesson History</Card.Title>
		</Card.Header>
		<Card.Content>
			<!-- Header table for consistent styling -->
			<Table.Root class="w-full table-fixed">
				<Table.Header class="border-b">
					<Table.Row>
						<Table.Head class="w-1/3">Lesson</Table.Head>
						<Table.Head class="w-32">Grade</Table.Head>
						<Table.Head class="w-40">Due Date</Table.Head>
						<Table.Head class="w-40">Status</Table.Head>
					</Table.Row>
				</Table.Header>
			</Table.Root>
			<div class="h-72 overflow-y-auto [scrollbar-gutter:stable]">
				<Table.Root class="w-full table-fixed">
					<Table.Body>
						{#each studentData.lessonProgress as lesson}
							<Table.Row>
								<Table.Cell class="w-1/3 font-medium">
									<span class="text-primary block truncate font-medium">{lesson.name}</span>
								</Table.Cell>
								<Table.Cell class="w-32">
									{#if typeof lesson.grade === 'number' && lesson.grade !== null}
										<Badge variant="secondary">{lesson.grade}%</Badge>
									{:else}
										<span class="text-muted-foreground">-</span>
									{/if}
								</Table.Cell>
								<Table.Cell class="w-40">{lesson.dueDate}</Table.Cell>
								<Table.Cell class="w-40">
									<Badge
										variant={lesson.status === 'completed'
											? 'default'
											: lesson.status === 'submitted'
												? 'secondary'
												: 'outline'}
									>
										{lesson.status}
									</Badge>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Recent Activity -->
	<Card.Root class="shadow-none">
		<Card.Header>
			<Card.Title class="text-lg">Recent Activity</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="space-y-4">
				{#each studentData.activityTimeline as activity}
					<div class="flex items-center gap-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
							<UsersIcon />
						</div>
						<div class="flex-1">
							<p class="text-sm font-medium">{activity.activity}</p>
							<p class="text-muted-foreground text-xs">{activity.time}</p>
						</div>
						<Badge variant="outline">{activity.type}</Badge>
					</div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Contact Parent Section -->
	<Card.Root class="shadow-none">
		<Card.Header>
			<Card.Title class="text-lg">Contact Parent/Guardian</Card.Title>
			<Card.Description>
				Get in touch with {studentData.parentContact.guardianName} ({studentData.parentContact
					.relationship})
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex items-center gap-4">
				<div class="flex-1 space-y-2">
					<div class="flex items-center gap-2">
						<MailIcon class="text-muted-foreground h-4 w-4" />
						<span class="text-sm">{studentData.parentContact.email}</span>
					</div>
					<div class="flex items-center gap-2">
						<PhoneIcon class="text-muted-foreground h-4 w-4" />
						<span class="text-sm">{studentData.parentContact.phone}</span>
					</div>
				</div>
				<div class="flex gap-2">
					<!-- mailto link needs a default email client set?? fix to discuss with team -->
					<Button
						variant="outline"
						size="sm"
						href={`mailto:${studentData.parentContact.email}?subject=Regarding ${studentData.name}'s Progress`}
					>
						<MailIcon class="mr-2 h-4 w-4" />
						Send Email
					</Button>
					<Button variant="outline" size="sm" href={`tel:${studentData.parentContact.phone}`}>
						<PhoneIcon class="mr-2 h-4 w-4" />
						Call
					</Button>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>
