<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Table from '$lib/components/ui/table';
	import * as Chart from '$lib/components/ui/chart';
	import { Badge } from '$lib/components/ui/badge';
	import { Progress } from '$lib/components/ui/progress';
	import { BarChart } from 'layerchart';
	import UsersIcon from '@lucide/svelte/icons/users';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';

	let { data } = $props();

	// Comprehensive mock data based on the designs
	const mockData = {
		// Student Performance Tab Data
		studentPerformance: {
			keyInsights: [
				"2 students haven't turned in assignment 1",
				"1 student hasn't visited your page in the past week"
			],
			currentAverage: 65,
			gradeDistribution: [
				{ grade: 'F', count: 1 },
				{ grade: 'D', count: 1 },
				{ grade: 'C-', count: 1 },
				{ grade: 'C', count: 2 },
				{ grade: 'C+', count: 3 },
				{ grade: 'B-', count: 4 },
				{ grade: 'B', count: 6 },
				{ grade: 'B+', count: 8 },
				{ grade: 'A-', count: 6 },
				{ grade: 'A', count: 4 },
				{ grade: 'A+', count: 2 }
			],
			students: [
				{
					name: 'Sam Smith',
					avatar: '/avatars/sam.jpg',
					assignmentsCompleted: 75, // percentage
					assignmentsTotal: 4,
					assignmentsCompletedCount: 3,
					lessonsCompleted: 100,
					lessonsTotal: 6,
					lessonsCompletedCount: 6,
					homeworkCompleted: 75,
					homeworkTotal: 4,
					homeworkCompletedCount: 3,
					lastActive: '< 1 day',
					grade: 85
				},
				{
					name: 'Emma Johnson',
					avatar: '/avatars/emma.jpg',
					assignmentsCompleted: 100,
					assignmentsTotal: 4,
					assignmentsCompletedCount: 4,
					lessonsCompleted: 100,
					lessonsTotal: 6,
					lessonsCompletedCount: 6,
					homeworkCompleted: 100,
					homeworkTotal: 4,
					homeworkCompletedCount: 4,
					lastActive: '2 hours ago',
					grade: 92
				},
				{
					name: 'Michael Chen',
					avatar: '/avatars/michael.jpg',
					assignmentsCompleted: 50,
					assignmentsTotal: 4,
					assignmentsCompletedCount: 2,
					lessonsCompleted: 83,
					lessonsTotal: 6,
					lessonsCompletedCount: 5,
					homeworkCompleted: 25,
					homeworkTotal: 4,
					homeworkCompletedCount: 1,
					lastActive: '3 days ago',
					grade: 68
				},
				{
					name: 'Sarah Davis',
					avatar: '/avatars/sarah.jpg',
					assignmentsCompleted: 100,
					assignmentsTotal: 4,
					assignmentsCompletedCount: 4,
					lessonsCompleted: 100,
					lessonsTotal: 6,
					lessonsCompletedCount: 6,
					homeworkCompleted: 75,
					homeworkTotal: 4,
					homeworkCompletedCount: 3,
					lastActive: '1 day ago',
					grade: 88
				},
				{
					name: 'David Wilson',
					avatar: '/avatars/david.jpg',
					assignmentsCompleted: 25,
					assignmentsTotal: 4,
					assignmentsCompletedCount: 1,
					lessonsCompleted: 67,
					lessonsTotal: 6,
					lessonsCompletedCount: 4,
					homeworkCompleted: 0,
					homeworkTotal: 4,
					homeworkCompletedCount: 0,
					lastActive: '1 week ago',
					grade: 45
				},
				{
					name: 'Lisa Martinez',
					avatar: '/avatars/lisa.jpg',
					assignmentsCompleted: 100,
					assignmentsTotal: 4,
					assignmentsCompletedCount: 4,
					lessonsCompleted: 100,
					lessonsTotal: 6,
					lessonsCompletedCount: 6,
					homeworkCompleted: 100,
					homeworkTotal: 4,
					homeworkCompletedCount: 4,
					lastActive: '3 hours ago',
					grade: 95
				},
				{
					name: 'James Brown',
					avatar: '/avatars/james.jpg',
					assignmentsCompleted: 75,
					assignmentsTotal: 4,
					assignmentsCompletedCount: 3,
					lessonsCompleted: 83,
					lessonsTotal: 6,
					lessonsCompletedCount: 5,
					homeworkCompleted: 50,
					homeworkTotal: 4,
					homeworkCompletedCount: 2,
					lastActive: '2 days ago',
					grade: 73
				},
				{
					name: 'Ashley Taylor',
					avatar: '/avatars/ashley.jpg',
					assignmentsCompleted: 100,
					assignmentsTotal: 4,
					assignmentsCompletedCount: 4,
					lessonsCompleted: 100,
					lessonsTotal: 6,
					lessonsCompletedCount: 6,
					homeworkCompleted: 100,
					homeworkTotal: 4,
					homeworkCompletedCount: 4,
					lastActive: '5 hours ago',
					grade: 90
				}
			]
		},

		// Task Analytics Tab Data
		taskAnalytics: {
			keyInsights: [
				'Your most used lesson component used to question is the fill in the blank block',
				'Your students on average score best on the multiple choice block'
			],
			submissionsDue: 7,
			avgScoreOverTime: [
				{ lesson: 'Week 1', score: 58 },
				{ lesson: 'Week 2', score: 65 },
				{ lesson: 'Week 3', score: 62 },
				{ lesson: 'Week 4', score: 72 },
				{ lesson: 'Week 5', score: 68 },
				{ lesson: 'Week 6', score: 78 },
				{ lesson: 'Week 7', score: 75 },
				{ lesson: 'Week 8', score: 82 },
				{ lesson: 'Week 9', score: 79 },
				{ lesson: 'Week 10', score: 85 },
				{ lesson: 'Week 11', score: 83 },
				{ lesson: 'Week 12', score: 88 }
			],
			tasks: [
				{
					name: 'Assignment 1',
					studentsCompleted: 100,
					totalStudents: 21,
					completedCount: 21,
					averageScore: 65,
					totalScore: 40,
					scoreCount: 26,
					averageTime: '58 Minutes',
					dueDate: '1 week ago',
					status: 'completed'
				},
				{
					name: 'Lesson 1',
					studentsCompleted: 67,
					totalStudents: 21,
					completedCount: 14,
					averageScore: 83,
					totalScore: 40,
					scoreCount: 33,
					averageTime: '22 Minutes',
					dueDate: 'In 1 day',
					status: 'due'
				},
				{
					name: 'Quiz 1',
					studentsCompleted: 95,
					totalStudents: 21,
					completedCount: 20,
					averageScore: 78,
					totalScore: 40,
					scoreCount: 31,
					averageTime: '15 Minutes',
					dueDate: '3 days ago',
					status: 'completed'
				},
				{
					name: 'Assignment 2',
					studentsCompleted: 81,
					totalStudents: 21,
					completedCount: 17,
					averageScore: 72,
					totalScore: 40,
					scoreCount: 29,
					averageTime: '45 Minutes',
					dueDate: 'In 3 days',
					status: 'due'
				},
				{
					name: 'Lesson 2',
					studentsCompleted: 76,
					totalStudents: 21,
					completedCount: 16,
					averageScore: 85,
					totalScore: 40,
					scoreCount: 34,
					averageTime: '28 Minutes',
					dueDate: '2 days ago',
					status: 'completed'
				},
				{
					name: 'Project Proposal',
					studentsCompleted: 38,
					totalStudents: 21,
					completedCount: 8,
					averageScore: 88,
					totalScore: 40,
					scoreCount: 35,
					averageTime: '2 Hours',
					dueDate: 'In 1 week',
					status: 'due'
				}
			]
		},

		// Discussion Analytics Tab Data
		discussionAnalytics: {
			keyInsights: [
				'The average response time on your discussion forum is 123 minutes',
				'There are 2 unanswered questions'
			],
			viewsOnLastAnnouncement: { views: 19, total: 21 },
			postsOverTime: [
				{ week: 'Jan W1', posts: 3 },
				{ week: 'Jan W2', posts: 5 },
				{ week: 'Jan W3', posts: 8 },
				{ week: 'Jan W4', posts: 12 },
				{ week: 'Feb W1', posts: 15 },
				{ week: 'Feb W2', posts: 18 },
				{ week: 'Feb W3', posts: 22 },
				{ week: 'Feb W4', posts: 25 },
				{ week: 'Mar W1', posts: 28 },
				{ week: 'Mar W2', posts: 32 },
				{ week: 'Mar W3', posts: 29 },
				{ week: 'Mar W4', posts: 35 },
				{ week: 'Apr W1', posts: 38 },
				{ week: 'Apr W2', posts: 42 },
				{ week: 'Apr W3', posts: 45 },
				{ week: 'Apr W4', posts: 48 }
			],
			students: [
				{
					name: 'Sam Smith',
					avatar: '/avatars/sam.jpg',
					questionsPosted: 7,
					questionsAnswered: 15,
					totalContributions: 22,
					lastActive: '< 1 day'
				},
				{
					name: 'Emma Johnson',
					avatar: '/avatars/emma.jpg',
					questionsPosted: 12,
					questionsAnswered: 23,
					totalContributions: 35,
					lastActive: '2 hours ago'
				},
				{
					name: 'Michael Chen',
					avatar: '/avatars/michael.jpg',
					questionsPosted: 3,
					questionsAnswered: 8,
					totalContributions: 11,
					lastActive: '3 days ago'
				},
				{
					name: 'Sarah Davis',
					avatar: '/avatars/sarah.jpg',
					questionsPosted: 9,
					questionsAnswered: 18,
					totalContributions: 27,
					lastActive: '1 day ago'
				},
				{
					name: 'David Wilson',
					avatar: '/avatars/david.jpg',
					questionsPosted: 1,
					questionsAnswered: 2,
					totalContributions: 3,
					lastActive: '1 week ago'
				},
				{
					name: 'Lisa Martinez',
					avatar: '/avatars/lisa.jpg',
					questionsPosted: 15,
					questionsAnswered: 28,
					totalContributions: 43,
					lastActive: '3 hours ago'
				},
				{
					name: 'James Brown',
					avatar: '/avatars/james.jpg',
					questionsPosted: 5,
					questionsAnswered: 12,
					totalContributions: 17,
					lastActive: '2 days ago'
				},
				{
					name: 'Ashley Taylor',
					avatar: '/avatars/ashley.jpg',
					questionsPosted: 8,
					questionsAnswered: 20,
					totalContributions: 28,
					lastActive: '5 hours ago'
				}
			]
		}
	};

	// Chart configurations
	const gradeDistributionConfig = {
		count: { label: 'Students', color: 'hsl(var(--primary))' }
	} satisfies Chart.ChartConfig;

	const scoreOverTimeConfig = {
		score: { label: 'Average Score', color: 'hsl(var(--chart-2))' }
	} satisfies Chart.ChartConfig;

	const postsOverTimeConfig = {
		posts: { label: 'Posts', color: 'hsl(var(--chart-3))' }
	} satisfies Chart.ChartConfig;

	let activeTab = $state('student-performance');
</script>

<div class="space-y-6 p-8">
	<h1 class="text-3xl font-bold tracking-tight">Analytics</h1>

	<!-- Tab Navigation -->
	<Tabs.Root bind:value={activeTab} class="w-full">
		<Tabs.List class="grid w-full grid-cols-3">
			<Tabs.Trigger value="student-performance">Student Performance</Tabs.Trigger>
			<Tabs.Trigger value="task-analytics">Task Analytics</Tabs.Trigger>
			<Tabs.Trigger value="discussion-analytics">Discussion Analytics</Tabs.Trigger>
		</Tabs.List>

		<!-- Student Performance Tab -->
		<Tabs.Content value="student-performance" class="space-y-6">
			<!-- Key Insights and Stats Row -->
			<div class="grid gap-6 md:grid-cols-3">
				<!-- Key Insights -->
				<Card.Root class="shadow-none">
					<Card.Header>
						<Card.Title class="text-lg">Key Insights</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-3">
						{#each mockData.studentPerformance.keyInsights as insight}
							<div class="flex items-start gap-2">
								<AlertCircleIcon class="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
								<p class="text-muted-foreground text-sm">{insight}</p>
							</div>
						{/each}
					</Card.Content>
				</Card.Root>

				<!-- Current Average -->
				<Card.Root class="shadow-none">
					<Card.Header>
						<Card.Title class="text-lg">Current Average</Card.Title>
					</Card.Header>
					<Card.Content class="flex items-center justify-center">
						<div class="text-4xl font-bold">{mockData.studentPerformance.currentAverage}%</div>
					</Card.Content>
				</Card.Root>

				<!-- Grade Distribution Chart -->
				<Card.Root class="shadow-none">
					<Card.Header>
						<Card.Title class="text-lg">Grade Distribution</Card.Title>
					</Card.Header>
					<Card.Content>
						<Chart.Container config={gradeDistributionConfig}>
							<BarChart
								data={mockData.studentPerformance.gradeDistribution}
								x="grade"
								series={[
									{
										key: 'count',
										label: 'Students',
										color: gradeDistributionConfig.count.color
									}
								]}
								props={{
									bars: {
										radius: 2,
										'stroke-width': 1
									},
									yAxis: { format: (v) => `${v}` }
								}}
							>
								{#snippet tooltip()}
									<Chart.Tooltip />
								{/snippet}
							</BarChart>
						</Chart.Container>
					</Card.Content>
				</Card.Root>
			</div>

			<!-- Student Performance Table -->
			<Card.Root class="shadow-none">
				<Card.Header>
					<Card.Title class="text-lg">Student Performance Overview</Card.Title>
				</Card.Header>
				<Card.Content>
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Student</Table.Head>
								<Table.Head>Assignments Completed</Table.Head>
								<Table.Head>Lessons Completed</Table.Head>
								<Table.Head>Homework Completed</Table.Head>
								<Table.Head>Last Active</Table.Head>
								<Table.Head>Grade</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each mockData.studentPerformance.students as student}
								<Table.Row>
									<Table.Cell class="flex items-center gap-2">
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
											<UsersIcon class="h-4 w-4" />
										</div>
										<span class="text-primary font-medium">{student.name}</span>
									</Table.Cell>
									<Table.Cell>
										<div class="flex items-center gap-2">
											<Progress value={student.assignmentsCompleted} class="w-20" />
											<span class="text-sm"
												>{student.assignmentsCompleted}% ({student.assignmentsCompletedCount}/{student.assignmentsTotal})</span
											>
										</div>
									</Table.Cell>
									<Table.Cell>
										<div class="flex items-center gap-2">
											<Progress value={student.lessonsCompleted} class="w-20" />
											<span class="text-sm"
												>{student.lessonsCompleted}% ({student.lessonsCompletedCount}/{student.lessonsTotal})</span
											>
										</div>
									</Table.Cell>
									<Table.Cell>
										<div class="flex items-center gap-2">
											<Progress value={student.homeworkCompleted} class="w-20" />
											<span class="text-sm"
												>{student.homeworkCompleted}% ({student.homeworkCompletedCount}/{student.homeworkTotal})</span
											>
										</div>
									</Table.Cell>
									<Table.Cell>{student.lastActive}</Table.Cell>
									<Table.Cell>
										<Badge variant="secondary">{student.grade}%</Badge>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<!-- Task Analytics Tab -->
		<Tabs.Content value="task-analytics" class="space-y-6">
			<!-- Key Insights and Stats Row -->
			<div class="grid gap-6 md:grid-cols-3">
				<!-- Key Insights -->
				<Card.Root class="shadow-none">
					<Card.Header>
						<Card.Title class="text-lg">Key Insights</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-3">
						{#each mockData.taskAnalytics.keyInsights as insight}
							<div class="flex items-start gap-2">
								<AlertCircleIcon class="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
								<p class="text-muted-foreground text-sm">{insight}</p>
							</div>
						{/each}
					</Card.Content>
				</Card.Root>

				<!-- Submissions Due -->
				<Card.Root class="shadow-none">
					<Card.Header>
						<Card.Title class="text-lg">Submission Due For Next Task</Card.Title>
					</Card.Header>
					<Card.Content class="flex items-center justify-center">
						<div class="text-4xl font-bold">{mockData.taskAnalytics.submissionsDue}</div>
					</Card.Content>
				</Card.Root>

				<!-- Average Score over Time Chart -->
				<Card.Root class="shadow-none">
					<Card.Header>
						<Card.Title class="text-lg">Average Score per Lesson over Time</Card.Title>
					</Card.Header>
					<Card.Content>
						<Chart.Container config={scoreOverTimeConfig}>
							<BarChart
								data={mockData.taskAnalytics.avgScoreOverTime}
								x="lesson"
								series={[
									{
										key: 'score',
										label: 'Average Score',
										color: scoreOverTimeConfig.score.color
									}
								]}
								props={{
									bars: {
										radius: 2,
										'stroke-width': 1
									},
									yAxis: { format: (v) => `${v}%` }
								}}
							>
								{#snippet tooltip()}
									<Chart.Tooltip />
								{/snippet}
							</BarChart>
						</Chart.Container>
					</Card.Content>
				</Card.Root>
			</div>

			<!-- Task Performance Table -->
			<Card.Root class="shadow-none">
				<Card.Header>
					<Card.Title class="text-lg">Task Performance Overview</Card.Title>
				</Card.Header>
				<Card.Content>
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Task</Table.Head>
								<Table.Head>Students Completed</Table.Head>
								<Table.Head>Average Score</Table.Head>
								<Table.Head>Average Time Taken</Table.Head>
								<Table.Head>Due Date</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each mockData.taskAnalytics.tasks as task}
								<Table.Row>
									<Table.Cell>
										<span class="text-primary font-medium">{task.name}</span>
									</Table.Cell>
									<Table.Cell>
										<div class="flex items-center gap-2">
											<Progress value={task.studentsCompleted} class="w-20" />
											<span class="text-sm"
												>{task.studentsCompleted}% ({task.completedCount}/{task.totalStudents})</span
											>
										</div>
									</Table.Cell>
									<Table.Cell>
										<div class="flex items-center gap-2">
											<Progress value={task.averageScore} class="w-20" />
											<span class="text-sm"
												>{task.averageScore}% ({task.scoreCount}/{task.totalScore})</span
											>
										</div>
									</Table.Cell>
									<Table.Cell>{task.averageTime}</Table.Cell>
									<Table.Cell>
										<Badge variant={task.status === 'due' ? 'destructive' : 'secondary'}>
											{task.dueDate}
										</Badge>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<!-- Discussion Analytics Tab -->
		<Tabs.Content value="discussion-analytics" class="space-y-6">
			<!-- Key Insights and Stats Row -->
			<div class="grid gap-6 md:grid-cols-3">
				<!-- Key Insights -->
				<Card.Root class="shadow-none">
					<Card.Header>
						<Card.Title class="text-lg">Key Insights</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-3">
						{#each mockData.discussionAnalytics.keyInsights as insight}
							<div class="flex items-start gap-2">
								<MessageSquareIcon class="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
								<p class="text-muted-foreground text-sm">{insight}</p>
							</div>
						{/each}
					</Card.Content>
				</Card.Root>

				<!-- Views on Last Announcement -->
				<Card.Root class="shadow-none">
					<Card.Header>
						<Card.Title class="text-lg">Views on Last Announcement</Card.Title>
					</Card.Header>
					<Card.Content class="flex items-center justify-center">
						<div class="text-4xl font-bold">
							{mockData.discussionAnalytics.viewsOnLastAnnouncement.views}/{mockData
								.discussionAnalytics.viewsOnLastAnnouncement.total}
						</div>
					</Card.Content>
				</Card.Root>

				<!-- Number of Posts over Time Chart -->
				<Card.Root class="shadow-none">
					<Card.Header>
						<Card.Title class="text-lg">Number of Posts over Time</Card.Title>
					</Card.Header>
					<Card.Content>
						<Chart.Container config={postsOverTimeConfig}>
							<BarChart
								data={mockData.discussionAnalytics.postsOverTime}
								x="week"
								series={[
									{
										key: 'posts',
										label: 'Posts',
										color: postsOverTimeConfig.posts.color
									}
								]}
								props={{
									bars: {
										radius: 2,
										'stroke-width': 1
									},
									yAxis: { format: (v) => `${v}` }
								}}
							>
								{#snippet tooltip()}
									<Chart.Tooltip />
								{/snippet}
							</BarChart>
						</Chart.Container>
					</Card.Content>
				</Card.Root>
			</div>

			<!-- Discussion Participation Table -->
			<Card.Root class="shadow-none">
				<Card.Header>
					<Card.Title class="text-lg">Discussion Participation Overview</Card.Title>
				</Card.Header>
				<Card.Content>
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Student</Table.Head>
								<Table.Head>Questions Posted</Table.Head>
								<Table.Head>Questions Answered</Table.Head>
								<Table.Head>Total Contributions</Table.Head>
								<Table.Head>Last Active</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each mockData.discussionAnalytics.students as student}
								<Table.Row>
									<Table.Cell class="flex items-center gap-2">
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
											<UsersIcon class="h-4 w-4" />
										</div>
										<span class="text-primary font-medium">{student.name}</span>
									</Table.Cell>
									<Table.Cell>{student.questionsPosted}</Table.Cell>
									<Table.Cell>{student.questionsAnswered}</Table.Cell>
									<Table.Cell>
										<Badge variant="secondary">{student.totalContributions}</Badge>
									</Table.Cell>
									<Table.Cell>{student.lastActive}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</div>
