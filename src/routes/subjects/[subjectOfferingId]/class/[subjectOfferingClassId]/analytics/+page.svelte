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
	import { Button } from '$lib/components/ui/button';
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuLabel,
		DropdownMenuSeparator
	} from '$lib/components/ui/dropdown-menu';
	import ListFilter from '@lucide/svelte/icons/list-filter';
	import Check from '@lucide/svelte/icons/check';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import { formatTimestampAsDate } from '$lib/utils';

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
					id: '1',
					firstName: 'Sam',
					lastName: 'Smith',
					avatarUrl: '/avatars/sam.jpg',
					participation: 82,
					participationCompletedCount: 8,
					participationTotal: 10,
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
					id: '2',
					firstName: 'Emma',
					lastName: 'Johnson',
					avatarUrl: '/avatars/emma.jpg',
					participation: 95,
					participationCompletedCount: 10,
					participationTotal: 10,
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
					id: '3',
					firstName: 'Michael',
					lastName: 'Chen',
					avatarUrl: '/avatars/michael.jpg',
					participation: 60,
					participationCompletedCount: 6,
					participationTotal: 10,
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
					id: '4',
					firstName: 'Sarah',
					lastName: 'Davis',
					avatarUrl: '/avatars/sarah.jpg',
					participation: 88,
					participationCompletedCount: 9,
					participationTotal: 10,
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
					id: '5',
					firstName: 'David',
					lastName: 'Wilson',
					avatarUrl: '/avatars/david.jpg',
					participation: 40,
					participationCompletedCount: 4,
					participationTotal: 10,
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
					id: '6',
					firstName: 'Lisa',
					lastName: 'Martinez',
					avatarUrl: '/avatars/lisa.jpg',
					participation: 97,
					participationCompletedCount: 10,
					participationTotal: 10,
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
					id: '7',
					firstName: 'James',
					lastName: 'Brown',
					avatarUrl: '/avatars/james.jpg',
					participation: 70,
					participationCompletedCount: 7,
					participationTotal: 10,
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
					id: '8',
					firstName: 'Ashley',
					lastName: 'Taylor',
					avatarUrl: '/avatars/ashley.jpg',
					participation: 92,
					participationCompletedCount: 9,
					participationTotal: 10,
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
					type: 'assessment',
					studentsCompleted: 100,
					totalStudents: 21,
					completedCount: 21,
					averageScore: 65,
					totalScore: 40,
					scoreCount: 26,
					averageTime: '58 Minutes',
					weight: 10,
					dueDate: '2025-08-17', // was '1 week ago'
					status: 'completed'
				},
				{
					name: 'Lesson 1',
					type: 'lesson',
					studentsCompleted: 67,
					totalStudents: 21,
					completedCount: 14,
					averageScore: 83,
					totalScore: 40,
					scoreCount: 33,
					averageTime: '22 Minutes',
					weight: 5,
					dueDate: '2025-08-25', // was 'In 1 day'
					status: 'due'
				},
				{
					name: 'Quiz 1',
					type: 'assessment',
					studentsCompleted: 95,
					totalStudents: 21,
					completedCount: 20,
					averageScore: 78,
					totalScore: 40,
					scoreCount: 31,
					averageTime: '15 Minutes',
					weight: 15,
					dueDate: '2025-08-21', // was '3 days ago'
					status: 'completed'
				},
				{
					name: 'Assignment 2',
					type: 'assessment',
					studentsCompleted: 81,
					totalStudents: 21,
					completedCount: 17,
					averageScore: 72,
					totalScore: 40,
					scoreCount: 29,
					averageTime: '45 Minutes',
					weight: 12,
					dueDate: '2025-08-27', // was 'In 3 days'
					status: 'due'
				},
				{
					name: 'Lesson 2',
					type: 'lesson',
					studentsCompleted: 76,
					totalStudents: 21,
					completedCount: 16,
					averageScore: 85,
					totalScore: 40,
					scoreCount: 34,
					averageTime: '28 Minutes',
					weight: 5,
					dueDate: '2025-08-22', // was '2 days ago'
					status: 'completed'
				},
				{
					name: 'Homework 1',
					type: 'homework',
					studentsCompleted: 54,
					totalStudents: 21,
					completedCount: 11,
					averageScore: 74,
					totalScore: 40,
					scoreCount: 30,
					averageTime: '35 Minutes',
					weight: 8,
					dueDate: '2025-08-24',
					status: 'due'
				},
				{
					name: 'Project Proposal',
					type: 'assessment',
					studentsCompleted: 38,
					totalStudents: 21,
					completedCount: 8,
					averageScore: 88,
					totalScore: 40,
					scoreCount: 35,
					averageTime: '2 Hours',
					weight: 25,
					dueDate: '2025-08-31', // was 'In 1 week'
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
					id: '1',
					firstName: 'Sam',
					lastName: 'Smith',
					avatarUrl: '/avatars/sam.jpg',
					questionsPosted: 7,
					questionsAnswered: 15,
					totalContributions: 22,
					lastActive: '< 1 day'
				},
				{
					id: '2',
					firstName: 'Emma',
					lastName: 'Johnson',
					avatarUrl: '/avatars/emma.jpg',
					questionsPosted: 12,
					questionsAnswered: 23,
					totalContributions: 35,
					lastActive: '2 hours ago'
				},
				{
					id: '3',
					firstName: 'Michael',
					lastName: 'Chen',
					avatarUrl: '/avatars/michael.jpg',
					questionsPosted: 3,
					questionsAnswered: 8,
					totalContributions: 11,
					lastActive: '3 days ago'
				},
				{
					id: '4',
					firstName: 'Sarah',
					lastName: 'Davis',
					avatarUrl: '/avatars/sarah.jpg',
					questionsPosted: 9,
					questionsAnswered: 18,
					totalContributions: 27,
					lastActive: '1 day ago'
				},
				{
					id: '5',
					firstName: 'David',
					lastName: 'Wilson',
					avatarUrl: '/avatars/david.jpg',
					questionsPosted: 1,
					questionsAnswered: 2,
					totalContributions: 3,
					lastActive: '1 week ago'
				},
				{
					id: '6',
					firstName: 'Lisa',
					lastName: 'Martinez',
					avatarUrl: '/avatars/lisa.jpg',
					questionsPosted: 15,
					questionsAnswered: 28,
					totalContributions: 43,
					lastActive: '3 hours ago'
				},
				{
					id: '7',
					firstName: 'James',
					lastName: 'Brown',
					avatarUrl: '/avatars/james.jpg',
					questionsPosted: 5,
					questionsAnswered: 12,
					totalContributions: 17,
					lastActive: '2 days ago'
				},
				{
					id: '8',
					firstName: 'Ashley',
					lastName: 'Taylor',
					avatarUrl: '/avatars/ashley.jpg',
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
		count: { label: 'Students', color: 'var(--chart-1)' }
	} satisfies Chart.ChartConfig;

	const scoreOverTimeConfig = {
		score: { label: 'Average Score', color: 'var(--chart-1)' }
	} satisfies Chart.ChartConfig;

	const postsOverTimeConfig = {
		posts: { label: 'Posts', color: 'var(--chart-1)' }
	} satisfies Chart.ChartConfig;

	let activeTab = $state('student-performance');

	// ------- Shared helpers for filters/sorting -------
	function parseLastActiveToDays(s: string): number {
		const str = s.trim().toLowerCase();
		if (str.includes('hour')) {
			const n = parseFloat(str);
			return isNaN(n) ? 0.5 : Math.max(0.04, n / 24); // hours -> days
		}
		if (str.includes('<') && str.includes('day')) return 0.5;
		if (str.includes('day')) {
			const n = parseFloat(str);
			return isNaN(n) ? 1 : n;
		}
		if (str.includes('week')) {
			const n = parseFloat(str);
			return isNaN(n) ? 7 : n * 7;
		}
		return 9999; // unknown => very old
	}

	function toMinutes(s: string): number {
		const str = s.trim().toLowerCase();
		if (str.includes('hour')) {
			const n = parseFloat(str);
			return isNaN(n) ? 60 : n * 60;
		}
		if (str.includes('minute')) {
			const n = parseFloat(str);
			return isNaN(n) ? 0 : n;
		}
		return 0;
	}

	// ------- Student Performance table controls -------
	type SP_SortKey =
		| 'name'
		| 'grade'
		| 'assignments'
		| 'lessons'
		| 'homework'
		| 'lastActive'
		| 'participation';
	type SortDir = 'asc' | 'desc';
	let spSortKey = $state<SP_SortKey>('grade');
	let spSortDir = $state<SortDir>('desc');
	const spGradeBands = ['A', 'B', 'C/D', 'F'] as const;
	let spSelectedBands = $state(new Set<(typeof spGradeBands)[number]>());

	function toggleSpBand(b: (typeof spGradeBands)[number]) {
		const s = new Set(spSelectedBands);
		if (s.has(b)) s.delete(b);
		else s.add(b);
		spSelectedBands = s;
	}
	function clearSpBands() {
		spSelectedBands = new Set();
	}

	function inSelectedBand(grade: number): boolean {
		if (spSelectedBands.size === 0) return true;
		const g = grade;
		const has = (band: string) => spSelectedBands.has(band as any);
		if (g >= 85 && has('A')) return true;
		if (g >= 70 && g < 85 && has('B')) return true;
		if (g >= 50 && g < 70 && has('C/D')) return true;
		if (g < 50 && has('F')) return true;
		return false;
	}

	let spFilteredStudents = $derived(() => {
		const students = mockData.studentPerformance.students.filter((s) => inSelectedBand(s.grade));
		const dir = spSortDir === 'asc' ? 1 : -1;
		return [...students].sort((a, b) => {
			const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
			const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
			if (spSortKey === 'name') return (nameA < nameB ? -1 : nameA > nameB ? 1 : 0) * dir;
			if (spSortKey === 'participation') return (a.participation - b.participation) * dir;
			if (spSortKey === 'grade') return (a.grade - b.grade) * dir;
			if (spSortKey === 'assignments')
				return (a.assignmentsCompleted - b.assignmentsCompleted) * dir;
			if (spSortKey === 'lessons') return (a.lessonsCompleted - b.lessonsCompleted) * dir;
			if (spSortKey === 'homework') return (a.homeworkCompleted - b.homeworkCompleted) * dir;
			// lastActive: smaller days = more recent
			const da = parseLastActiveToDays(a.lastActive);
			const db = parseLastActiveToDays(b.lastActive);
			return (da - db) * dir;
		});
	});

	// ------- Task Analytics table controls -------
	type TA_SortKey =
		| 'name'
		| 'studentsCompleted'
		| 'averageScore'
		| 'averageTime'
		| 'weight'
		| 'dueDate';
	let taSortKey = $state<TA_SortKey>('studentsCompleted');
	let taSortDir = $state<SortDir>('desc');
	// Type filter (multi-select)
	const taTypeOptions = ['lesson', 'homework', 'assessment'] as const;
	let taSelectedTypes = $state(new Set<(typeof taTypeOptions)[number]>());
	function toggleTaType(t: (typeof taTypeOptions)[number]) {
		const s = new Set(taSelectedTypes);
		if (s.has(t)) s.delete(t);
		else s.add(t);
		taSelectedTypes = s;
	}
	function clearTaTypes() {
		taSelectedTypes = new Set();
	}
	// Exposed filter options shown to user (graded/pending) mapped to internal statuses (completed/due)
	const taDisplayStatus = { graded: 'completed', pending: 'due' } as const;
	type TaDisplayStatusKey = keyof typeof taDisplayStatus;
	const taStatusOptions = Object.keys(taDisplayStatus) as TaDisplayStatusKey[]; // ['graded','pending']
	let taSelectedStatuses = $state(new Set<TaDisplayStatusKey>());
	function toggleTaStatus(s: TaDisplayStatusKey) {
		const set = new Set(taSelectedStatuses);
		if (set.has(s)) set.delete(s);
		else set.add(s);
		taSelectedStatuses = set;
	}
	function clearTaStatuses() {
		taSelectedStatuses = new Set();
	}

	let taFilteredTasks = $derived(() => {
		let tasks = mockData.taskAnalytics.tasks;
		// type filter first
		if (taSelectedTypes.size > 0) {
			tasks = tasks.filter((t) => taSelectedTypes.has(t.type as any));
		}
		if (taSelectedStatuses.size > 0) {
			const internal = new Set(Array.from(taSelectedStatuses).map((d) => taDisplayStatus[d]));
			tasks = tasks.filter((t) => internal.has(t.status as any));
		}
		const dir = taSortDir === 'asc' ? 1 : -1;
		return [...tasks].sort((a, b) => {
			if (taSortKey === 'name') return a.name.localeCompare(b.name) * dir;
			if (taSortKey === 'studentsCompleted')
				return (a.studentsCompleted - b.studentsCompleted) * dir;
			if (taSortKey === 'averageScore') return (a.averageScore - b.averageScore) * dir;
			if (taSortKey === 'averageTime')
				return (toMinutes(a.averageTime) - toMinutes(b.averageTime)) * dir;
			if (taSortKey === 'weight') return (a.weight - b.weight) * dir;
			return a.dueDate.localeCompare(b.dueDate) * dir; // dueDate ISO string now
		});
	});

	function taTypeVariant(type: string): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (type) {
			case 'assessment':
				return 'destructive';
			case 'homework':
				return 'secondary';
			case 'lesson':
				return 'outline';
			default:
				return 'outline';
		}
	}

	// ------- Discussion Analytics table controls -------
	type DA_SortKey =
		| 'name'
		| 'questionsPosted'
		| 'questionsAnswered'
		| 'totalContributions'
		| 'lastActive';
	let daSortKey = $state<DA_SortKey>('totalContributions');
	let daSortDir = $state<SortDir>('desc');

	let daFilteredStudents = $derived(() => {
		let students = mockData.discussionAnalytics.students; // no activity filtering
		const dir = daSortDir === 'asc' ? 1 : -1;
		return [...students].sort((a, b) => {
			const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
			const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
			if (daSortKey === 'name') return (nameA < nameB ? -1 : nameA > nameB ? 1 : 0) * dir;
			if (daSortKey === 'questionsPosted') return (a.questionsPosted - b.questionsPosted) * dir;
			if (daSortKey === 'questionsAnswered')
				return (a.questionsAnswered - b.questionsAnswered) * dir;
			if (daSortKey === 'totalContributions')
				return (a.totalContributions - b.totalContributions) * dir;
			const da = parseLastActiveToDays(a.lastActive);
			const db = parseLastActiveToDays(b.lastActive);
			return (da - db) * dir;
		});
	});
</script>

<div class="space-y-4 p-4">
	<div class="space-y-1">
		<h1 class="text-2xl font-bold">{data.subject.name}</h1>
	</div>

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
			<div class="grid gap-3 md:grid-cols-3">
				<!-- Key Insights -->
				<Card.Root class="shadow-none">
					<Card.Header>
						<Card.Title class="text-base">Key Insights</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-2">
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
						<Card.Title class="text-base">Current Average</Card.Title>
					</Card.Header>
					<Card.Content class="flex items-center justify-center py-2">
						<div class="text-3xl font-bold">{mockData.studentPerformance.currentAverage}%</div>
					</Card.Content>
				</Card.Root>

				<!-- Grade Distribution Chart -->
				<Card.Root class="shadow-none">
					<Card.Header>
						<Card.Title class="text-base">Grade Distribution</Card.Title>
					</Card.Header>
					<Card.Content>
						<Chart.Container config={gradeDistributionConfig} class="aspect-auto h-[150px] w-full">
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
									bars: { stroke: 'none', rounded: 'none' },
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
				<Card.Content class="pt-0 pb-0">
					<Table.Root class="w-full">
						<Table.Header class="border-b">
							<Table.Row>
								<Table.Head class="w-52">
									<div class="flex items-center gap-1">
										<span>Student</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by name"
											onclick={() => {
												if (spSortKey === 'name') spSortDir = spSortDir === 'asc' ? 'desc' : 'asc';
												else {
													spSortKey = 'name';
													spSortDir = 'asc';
												}
											}}
										>
											{#if spSortKey === 'name'}{#if spSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown class="h-4 w-4" />{/if}{:else}<ArrowUpDown
													class="h-4 w-4"
												/>{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-50">
									<div class="flex items-center gap-1">
										<span>Participation</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by participation"
											onclick={() => {
												if (spSortKey === 'participation')
													spSortDir = spSortDir === 'asc' ? 'desc' : 'asc';
												else {
													spSortKey = 'participation';
													spSortDir = 'desc';
												}
											}}
										>
											{#if spSortKey === 'participation'}{#if spSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown class="h-4 w-4" />{/if}{:else}<ArrowUpDown
													class="h-4 w-4"
												/>{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-50">
									<div class="flex items-center gap-1">
										<span>Assignments</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by assignments"
											onclick={() => {
												if (spSortKey === 'assignments')
													spSortDir = spSortDir === 'asc' ? 'desc' : 'asc';
												else {
													spSortKey = 'assignments';
													spSortDir = 'desc';
												}
											}}
										>
											{#if spSortKey === 'assignments'}{#if spSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown class="h-4 w-4" />{/if}{:else}<ArrowUpDown
													class="h-4 w-4"
												/>{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-50">
									<div class="flex items-center gap-1">
										<span>Homework</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by homework"
											onclick={() => {
												if (spSortKey === 'homework')
													spSortDir = spSortDir === 'asc' ? 'desc' : 'asc';
												else {
													spSortKey = 'homework';
													spSortDir = 'desc';
												}
											}}
										>
											{#if spSortKey === 'homework'}{#if spSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown class="h-4 w-4" />{/if}{:else}<ArrowUpDown
													class="h-4 w-4"
												/>{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-50">
									<div class="flex items-center gap-1">
										<span>Lessons</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by lessons"
											onclick={() => {
												if (spSortKey === 'lessons')
													spSortDir = spSortDir === 'asc' ? 'desc' : 'asc';
												else {
													spSortKey = 'lessons';
													spSortDir = 'desc';
												}
											}}
										>
											{#if spSortKey === 'lessons'}{#if spSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown class="h-4 w-4" />{/if}{:else}<ArrowUpDown
													class="h-4 w-4"
												/>{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-40">
									<div class="flex items-center gap-1">
										<span>Last Active</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by last active"
											onclick={() => {
												if (spSortKey === 'lastActive')
													spSortDir = spSortDir === 'asc' ? 'desc' : 'asc';
												else {
													spSortKey = 'lastActive';
													spSortDir = 'asc';
												}
											}}
										>
											{#if spSortKey === 'lastActive'}{#if spSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown class="h-4 w-4" />{/if}{:else}<ArrowUpDown
													class="h-4 w-4"
												/>{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head>
									<div class="flex items-center gap-1">
										<span>Grade</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by grade"
											onclick={() => {
												if (spSortKey === 'grade') spSortDir = spSortDir === 'asc' ? 'desc' : 'asc';
												else {
													spSortKey = 'grade';
													spSortDir = 'desc';
												}
											}}
										>
											{#if spSortKey === 'grade'}{#if spSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown class="h-4 w-4" />{/if}{:else}<ArrowUpDown
													class="h-4 w-4"
												/>{/if}
										</Button>
									</div>
								</Table.Head>
							</Table.Row>
						</Table.Header>
					</Table.Root>
					<div class="h-56 overflow-y-auto [scrollbar-gutter:stable]">
						<Table.Root class="w-full table-fixed">
							<Table.Body class="divide-y">
								{#each spFilteredStudents() as student}
									<Table.Row>
										<Table.Cell class="w-52">{student.firstName} {student.lastName}</Table.Cell>
										<Table.Cell class="w-50">
											<div class="flex items-center gap-2">
												<Progress value={student.participation} class="w-20" />
												<span class="truncate text-sm"
													>{student.participation}% ({student.participationCompletedCount}/{student.participationTotal})</span
												>
											</div>
										</Table.Cell>
										<Table.Cell class="w-50">
											<div class="flex items-center gap-2">
												<Progress value={student.assignmentsCompleted} class="w-20" />
												<span class="truncate text-sm"
													>{student.assignmentsCompleted}% ({student.assignmentsCompletedCount}/{student.assignmentsTotal})</span
												>
											</div>
										</Table.Cell>
										<Table.Cell class="w-50">
											<div class="flex items-center gap-2">
												<Progress value={student.homeworkCompleted} class="w-20" />
												<span class="truncate text-sm"
													>{student.homeworkCompleted}% ({student.homeworkCompletedCount}/{student.homeworkTotal})</span
												>
											</div>
										</Table.Cell>
										<Table.Cell class="w-50">
											<div class="flex items-center gap-2">
												<Progress value={student.lessonsCompleted} class="w-20" />
												<span class="truncate text-sm"
													>{student.lessonsCompleted}% ({student.lessonsCompletedCount}/{student.lessonsTotal})</span
												>
											</div>
										</Table.Cell>
										<Table.Cell class="w-40">{student.lastActive}</Table.Cell>
										<Table.Cell><Badge variant="secondary">{student.grade}%</Badge></Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
					<div class="text-muted-foreground mt-2 flex justify-end text-sm">
						Showing {spFilteredStudents().length} of {mockData.studentPerformance.students.length} students
					</div>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<!-- Task Analytics Tab -->
		<Tabs.Content value="task-analytics" class="space-y-6">
			<!-- Key Insights and Stats Row -->
			<div class="grid gap-3 md:grid-cols-3">
				<!-- Key Insights -->
				<Card.Root class="shadow-none">
					<Card.Header>
						<Card.Title class="text-base">Key Insights</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-2">
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
						<Card.Title class="text-base">Submission Due For Next Task</Card.Title>
					</Card.Header>
					<Card.Content class="flex items-center justify-center py-2">
						<div class="text-3xl font-bold">{mockData.taskAnalytics.submissionsDue}</div>
					</Card.Content>
				</Card.Root>

				<!-- Average Score over Time Chart -->
				<Card.Root class="shadow-none">
					<Card.Header>
						<Card.Title class="text-base">Average Score per Lesson over Time</Card.Title>
					</Card.Header>
					<Card.Content>
						<Chart.Container config={scoreOverTimeConfig} class="aspect-auto h-[150px] w-full">
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
									bars: { stroke: 'none', rounded: 'none' },
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

			<!-- Task Performance Table (title removed for more vertical space) -->
			<Card.Root class="shadow-none">
				<Card.Content class="pt-0 pb-0">
					<!-- Header table for consistent styling -->
					<Table.Root class="w-full">
						<Table.Header class="border-b">
							<Table.Row>
								<Table.Head class="w-60">
									<div class="flex items-center gap-1">
										<span>Task</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by task"
											onclick={() => {
												if (taSortKey === 'name') taSortDir = taSortDir === 'asc' ? 'desc' : 'asc';
												else {
													taSortKey = 'name';
													taSortDir = 'asc';
												}
											}}
										>
											{#if taSortKey === 'name'}{#if taSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown class="h-4 w-4" />{/if}{:else}<ArrowUpDown
													class="h-4 w-4"
												/>{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-32">
									<div class="flex items-center gap-1">
										<span>Type</span>
										<DropdownMenu>
											<DropdownMenuTrigger>
												<Button
													variant="ghost"
													size="sm"
													class="h-5 w-5 p-0"
													aria-label="Filter by type"
												>
													<ListFilter />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="start" class="min-w-40">
												<DropdownMenuLabel>Filter</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuItem onclick={clearTaTypes}>
													<div class="flex w-full items-center justify-between">
														<span>All</span>{#if taSelectedTypes.size === 0}<Check
																class="h-4 w-4"
															/>{/if}
													</div>
												</DropdownMenuItem>
												<DropdownMenuItem onclick={() => toggleTaType('lesson')}>
													<div class="flex w-full items-center justify-between">
														<span>Lessons</span>{#if taSelectedTypes.has('lesson')}<Check
																class="h-4 w-4"
															/>{/if}
													</div>
												</DropdownMenuItem>
												<DropdownMenuItem onclick={() => toggleTaType('homework')}>
													<div class="flex w-full items-center justify-between">
														<span>Homework</span>{#if taSelectedTypes.has('homework')}<Check
																class="h-4 w-4"
															/>{/if}
													</div>
												</DropdownMenuItem>
												<DropdownMenuItem onclick={() => toggleTaType('assessment')}>
													<div class="flex w-full items-center justify-between">
														<span>Assessments</span>{#if taSelectedTypes.has('assessment')}<Check
																class="h-4 w-4"
															/>{/if}
													</div>
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</Table.Head>
								<Table.Head class="w-56">
									<div class="flex items-center gap-1">
										<span>Students Completed</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by students completed"
											onclick={() => {
												if (taSortKey === 'studentsCompleted')
													taSortDir = taSortDir === 'asc' ? 'desc' : 'asc';
												else {
													taSortKey = 'studentsCompleted';
													taSortDir = 'desc';
												}
											}}
										>
											{#if taSortKey === 'studentsCompleted'}{#if taSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown class="h-4 w-4" />{/if}{:else}<ArrowUpDown
													class="h-4 w-4"
												/>{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-56">
									<div class="flex items-center gap-1">
										<span>Average Score</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by average score"
											onclick={() => {
												if (taSortKey === 'averageScore')
													taSortDir = taSortDir === 'asc' ? 'desc' : 'asc';
												else {
													taSortKey = 'averageScore';
													taSortDir = 'desc';
												}
											}}
										>
											{#if taSortKey === 'averageScore'}{#if taSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown class="h-4 w-4" />{/if}{:else}<ArrowUpDown
													class="h-4 w-4"
												/>{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-48">
									<div class="flex items-center gap-1">
										<span>Average Time Taken</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by average time"
											onclick={() => {
												if (taSortKey === 'averageTime')
													taSortDir = taSortDir === 'asc' ? 'desc' : 'asc';
												else {
													taSortKey = 'averageTime';
													taSortDir = 'asc';
												}
											}}
										>
											{#if taSortKey === 'averageTime'}{#if taSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown class="h-4 w-4" />{/if}{:else}<ArrowUpDown
													class="h-4 w-4"
												/>{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-28">
									<div class="flex items-center gap-1">
										<span>Weight</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by weight"
											onclick={() => {
												if (taSortKey === 'weight')
													taSortDir = taSortDir === 'asc' ? 'desc' : 'asc';
												else {
													taSortKey = 'weight';
													taSortDir = 'desc';
												}
											}}
										>
											{#if taSortKey === 'weight'}{#if taSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown class="h-4 w-4" />{/if}{:else}<ArrowUpDown
													class="h-4 w-4"
												/>{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-36">
									<div class="flex items-center gap-1">
										<span>Due Date</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by due date"
											onclick={() => {
												if (taSortKey === 'dueDate')
													taSortDir = taSortDir === 'asc' ? 'desc' : 'asc';
												else {
													taSortKey = 'dueDate';
													taSortDir = 'asc';
												}
											}}
										>
											{#if taSortKey === 'dueDate'}{#if taSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown class="h-4 w-4" />{/if}{:else}<ArrowUpDown
													class="h-4 w-4"
												/>{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head>
									<div class="flex items-center gap-1">
										<span>Status</span>
										<DropdownMenu>
											<DropdownMenuTrigger>
												<Button
													variant="ghost"
													size="sm"
													class="h-5 w-5 p-0"
													aria-label="Filter by status"
												>
													<ListFilter />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="start" class="min-w-40">
												<DropdownMenuLabel>Filter</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuItem onclick={clearTaStatuses}>
													<div class="flex w-full items-center justify-between">
														<span>All</span>{#if taSelectedStatuses.size === 0}<Check
																class="h-4 w-4"
															/>{/if}
													</div>
												</DropdownMenuItem>
												<DropdownMenuItem onclick={() => toggleTaStatus('graded')}>
													<div class="flex w-full items-center justify-between">
														<span>graded</span>{#if taSelectedStatuses.has('graded')}<Check
																class="h-4 w-4"
															/>{/if}
													</div>
												</DropdownMenuItem>
												<DropdownMenuItem onclick={() => toggleTaStatus('pending')}>
													<div class="flex w-full items-center justify-between">
														<span>pending</span>{#if taSelectedStatuses.has('pending')}<Check
																class="h-4 w-4"
															/>{/if}
													</div>
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</Table.Head>
							</Table.Row>
						</Table.Header>
					</Table.Root>
					<div class="h-56 overflow-y-auto [scrollbar-gutter:stable]">
						<Table.Root class="w-full">
							<Table.Body>
								{#each taFilteredTasks() as task}
									<Table.Row>
										<Table.Cell class="w-60 font-medium">
											<span class="text-primary block truncate font-medium">{task.name}</span>
										</Table.Cell>
										<Table.Cell class="w-32">
											<Badge variant={taTypeVariant(task.type)} class="capitalize"
												>{task.type}</Badge
											>
										</Table.Cell>
										<Table.Cell class="w-56">
											<div class="flex items-center gap-2">
												<Progress value={task.studentsCompleted} class="w-20" />
												<span class="truncate text-sm">
													{task.studentsCompleted}% ({task.completedCount}/{task.totalStudents})
												</span>
											</div>
										</Table.Cell>
										<Table.Cell class="w-56">
											<div class="flex items-center gap-2">
												<Progress value={task.averageScore} class="w-20" />
												<span class="truncate text-sm">
													{task.averageScore}% ({task.scoreCount}/{task.totalScore})
												</span>
											</div>
										</Table.Cell>
										<Table.Cell class="w-48">{task.averageTime}</Table.Cell>
										<Table.Cell class="w-28">{task.weight}%</Table.Cell>
										<Table.Cell class="w-36"
											>{formatTimestampAsDate(new Date(task.dueDate))}</Table.Cell
										>
										<Table.Cell>
											<!-- Map internal status to graded/pending display similar to grades route -->
											{#if task.status === 'completed'}
												<Badge variant="default">graded</Badge>
											{:else}
												<Badge variant="secondary">pending</Badge>
											{/if}
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
					<div class="text-muted-foreground mt-2 flex justify-end text-sm">
						Showing {taFilteredTasks().length} of {mockData.taskAnalytics.tasks.length} tasks
					</div>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<!-- Discussion Analytics Tab -->
		<Tabs.Content value="discussion-analytics" class="space-y-6">
			<!-- Key Insights and Stats Row -->
			<div class="grid gap-3 md:grid-cols-3">
				<!-- Key Insights -->
				<Card.Root class="shadow-none">
					<Card.Header>
						<Card.Title class="text-base">Key Insights</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-2">
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
						<Card.Title class="text-base">Views on Last Announcement</Card.Title>
					</Card.Header>
					<Card.Content class="flex items-center justify-center py-2">
						<div class="text-4xl font-bold">
							{mockData.discussionAnalytics.viewsOnLastAnnouncement.views}/{mockData
								.discussionAnalytics.viewsOnLastAnnouncement.total}
						</div>
					</Card.Content>
				</Card.Root>

				<!-- Number of Posts over Time Chart -->
				<Card.Root class="shadow-none">
					<Card.Header>
						<Card.Title class="text-base">Number of Posts over Time</Card.Title>
					</Card.Header>
					<Card.Content>
						<Chart.Container config={postsOverTimeConfig} class="aspect-auto h-[150px] w-full">
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
									bars: { stroke: 'none', rounded: 'none' },
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

			<Card.Root class="shadow-none">
				<Card.Content class="pt-0 pb-0">
					<Table.Root class="w-full table-fixed">
						<Table.Header class="border-b">
							<Table.Row>
								<Table.Head class="w-64">
									<div class="flex items-center gap-1">
										<span>Student</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by name"
											onclick={() => {
												if (daSortKey === 'name') daSortDir = daSortDir === 'asc' ? 'desc' : 'asc';
												else {
													daSortKey = 'name';
													daSortDir = 'asc';
												}
											}}
										>
											{#if daSortKey === 'name'}{#if daSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown class="h-4 w-4" />{/if}{:else}<ArrowUpDown
													class="h-4 w-4"
												/>{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-64">
									<div class="flex items-center gap-1">
										<span>Questions Posted</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by questions posted"
											onclick={() => {
												if (daSortKey === 'questionsPosted')
													daSortDir = daSortDir === 'asc' ? 'desc' : 'asc';
												else {
													daSortKey = 'questionsPosted';
													daSortDir = 'desc';
												}
											}}
										>
											{#if daSortKey === 'questionsPosted'}{#if daSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown class="h-4 w-4" />{/if}{:else}<ArrowUpDown
													class="h-4 w-4"
												/>{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-64">
									<div class="flex items-center gap-1">
										<span>Questions Answered</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by questions answered"
											onclick={() => {
												if (daSortKey === 'questionsAnswered')
													daSortDir = daSortDir === 'asc' ? 'desc' : 'asc';
												else {
													daSortKey = 'questionsAnswered';
													daSortDir = 'desc';
												}
											}}
										>
											{#if daSortKey === 'questionsAnswered'}{#if daSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown class="h-4 w-4" />{/if}{:else}<ArrowUpDown
													class="h-4 w-4"
												/>{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-64">
									<div class="flex items-center gap-1">
										<span>Total Contributions</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by total contributions"
											onclick={() => {
												if (daSortKey === 'totalContributions')
													daSortDir = daSortDir === 'asc' ? 'desc' : 'asc';
												else {
													daSortKey = 'totalContributions';
													daSortDir = 'desc';
												}
											}}
										>
											{#if daSortKey === 'totalContributions'}{#if daSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown class="h-4 w-4" />{/if}{:else}<ArrowUpDown
													class="h-4 w-4"
												/>{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head>
									<div class="flex items-center gap-1">
										<span>Last Active</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by last active"
											onclick={() => {
												if (daSortKey === 'lastActive')
													daSortDir = daSortDir === 'asc' ? 'desc' : 'asc';
												else {
													daSortKey = 'lastActive';
													daSortDir = 'asc';
												}
											}}
										>
											{#if daSortKey === 'lastActive'}{#if daSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown class="h-4 w-4" />{/if}{:else}<ArrowUpDown
													class="h-4 w-4"
												/>{/if}
										</Button>
									</div>
								</Table.Head>
							</Table.Row>
						</Table.Header>
					</Table.Root>
					<div class="h-56 overflow-y-auto [scrollbar-gutter:stable]">
						<Table.Root class="w-full table-fixed">
							<Table.Body>
								{#each daFilteredStudents() as student}
									<Table.Row>
										<Table.Cell class="w-64 font-medium">
											<Button
												variant="link"
												href={`/subjects/${data.subject.id}/class/${data.subjectOfferingClassId}/analytics/student/${student.id}`}
												class="text-primary h-auto truncate p-0 font-medium hover:underline"
											>
												{student.firstName}
												{student.lastName}
											</Button>
										</Table.Cell>
										<Table.Cell class="w-64">{student.questionsPosted}</Table.Cell>
										<Table.Cell class="w-64">{student.questionsAnswered}</Table.Cell>
										<Table.Cell class="w-64">
											<Badge variant="secondary">{student.totalContributions}</Badge>
										</Table.Cell>
										<Table.Cell>{student.lastActive}</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
					<div class="text-muted-foreground mt-2 flex justify-end text-sm">
						Showing {daFilteredStudents().length} of {mockData.discussionAnalytics.students.length} students
					</div>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</div>
