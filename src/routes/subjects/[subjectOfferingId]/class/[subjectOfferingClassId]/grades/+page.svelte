<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import * as Tabs from '$lib/components/ui/tabs';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import GradeChart from './components/grade-chart.svelte';
	import TaskList from './components/task-list.svelte';

	let { data } = $props();
	type Status = 'graded' | 'submitted' | 'pending';
	type NormalizedTask = {
		id: number;
		name: string;
		type: 'lesson' | 'homework' | 'assessment';
		studentGrade: number | null;
		maxPoints: number;
		weight: number | null;
		dueDate: string;
		submittedDate: string | null;
		feedback: string | null;
		status: Status;
	};
	const normalizedTasks: NormalizedTask[] = data.gradeData.tasks.map((t) => ({
		...t,
		status: t.studentGrade !== null ? 'graded' : t.submittedDate ? 'submitted' : 'pending'
	}));

	const totalTasks = normalizedTasks.length;
	const gradedCount = normalizedTasks.filter((a) => a.status === 'graded').length;
	const submittedCount = normalizedTasks.filter((a) => a.status === 'submitted').length;
	const completion = totalTasks
		? Math.round(((gradedCount + submittedCount) / totalTasks) * 100)
		: 0;

	// Compute per-category progress based on graded tasks: sum(grade% * taskWeight) / categoryWeight
	type CategoryKey = keyof typeof data.gradeData.gradeBreakdown;
	const keyToType: Partial<Record<CategoryKey, NormalizedTask['type']>> = {
		assessments: 'assessment',
		homework: 'homework'
	};

	function categoryProgress(taskType: NormalizedTask['type'], categoryWeight: number): number {
		if (!categoryWeight || categoryWeight <= 0) return 0;
		const graded = normalizedTasks.filter(
			(t) =>
				t.type === taskType &&
				t.status === 'graded' &&
				t.studentGrade !== null &&
				t.maxPoints > 0 &&
				t.weight !== null &&
				t.weight! > 0
		);
		if (!graded.length) return 0;
		const sum = graded.reduce((acc, t) => {
			const pct = (t.studentGrade! / t.maxPoints) * 100;
			const wt = t.weight!; // percentage contribution within this category
			return acc + pct * wt;
		}, 0);
		return Math.round(sum / categoryWeight);
	}

	const computedBreakdown: Record<string, { current: number; weight: number }> = Object.fromEntries(
		Object.entries(data.gradeData.gradeBreakdown).map(([key, info]) => {
			const mappedType = keyToType[key as CategoryKey];
			const current = mappedType
				? categoryProgress(mappedType, info.weight)
				: // fall back to provided current for categories without task mapping (e.g., participation)
					typeof (info as any).current === 'number'
					? (info as any).current
					: 0;
			return [key, { current, weight: info.weight }];
		})
	);

	// Compute current overall grade based only on graded tasks:
	// sum(grade% * taskWeight) / sum(taskWeight of graded tasks)
	function computeCurrentOverall(): number {
		const graded = normalizedTasks.filter(
			(t) =>
				t.status === 'graded' &&
				t.studentGrade !== null &&
				t.maxPoints > 0 &&
				t.weight !== null &&
				t.weight! > 0
		);
		if (!graded.length) return 0;
		const { sum, w } = graded.reduce(
			(acc, t) => {
				const pct = (t.studentGrade! / t.maxPoints) * 100;
				const wt = t.weight!;
				acc.sum += pct * wt;
				acc.w += wt;
				return acc;
			},
			{ sum: 0, w: 0 }
		);
		if (w === 0) return 0;
		return sum / w;
	}

	const ceil1dp = (n: number) => Math.ceil(n * 10) / 10;
	const currentOverallRaw = computeCurrentOverall();
	const currentOverall = ceil1dp(currentOverallRaw);

	function getGradeColor(marks: number | null): string {
		if (marks === null || marks === undefined) return 'text-muted-foreground';
		if (marks < 40) return 'text-red-500';
		return 'text-foreground';
	}

	let chartView = $state<'line' | 'bar'>('line');
</script>

<div class="container mx-auto space-y-4 p-4">
	<div class="space-y-1">
		<h1 class="text-2xl font-bold">{data.gradeData.subject.name}</h1>
		<div class="text-muted-foreground flex items-center gap-3">
			<span>Teacher: {data.gradeData.subject.teacher}</span>
			<span>•</span>
			<span>Class: {data.gradeData.subject.className}</span>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-3 lg:grid-cols-6">
		<Card.Root class="lg:col-span-1">
			<Card.Header class="pb-1">
				<Card.Title class="text-sm font-medium">Current Grade</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-2">
				<!-- Fixed-height pre-bar block so the bar aligns with other cards -->
				<div class="flex min-h-[40px] items-end gap-2">
					<span class="text-3xl leading-none font-bold {getGradeColor(currentOverall)}">
						{data.gradeData.subject.letterGrade}
					</span>
					<span class="text-muted-foreground text-sm">
						{currentOverall.toFixed(1)}%
					</span>
				</div>
				<Progress value={currentOverall} class="h-2" />
				<div class="text-muted-foreground text-xs">Based on graded work</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="lg:col-span-1">
			<Card.Header class="pb-1">
				<Card.Title class="text-sm font-medium">Tasks</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-2">
				<div class="flex min-h-[40px] items-end">
					<div class="flex items-center gap-2">
						<ClipboardList class="text-muted-foreground h-5 w-5" />
						<div class="text-xl font-bold">{totalTasks}</div>
						<div class="text-muted-foreground text-xs">total</div>
					</div>
				</div>
				<Progress value={completion} class="h-2" />
				<div class="text-muted-foreground mt-0.5 flex justify-between text-xs">
					<span>Completed</span><span>{completion}%</span>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="lg:col-span-4">
			<Card.Header class="pb-0">
				<Card.Title class="text-sm font-medium">Grade Breakdown by Category</Card.Title>
			</Card.Header>
			<Card.Content class="pt-0">
				<div class="grid grid-cols-3 gap-4">
					{#each Object.entries(computedBreakdown) as [category, info]}
						<div class="space-y-1">
							<div class="min-h-[50px] space-y-1">
								<div class="flex items-center justify-between">
									<span class="text-sm font-medium whitespace-nowrap capitalize">{category}</span>
									<span class="text-muted-foreground text-xs whitespace-nowrap">{info.weight}%</span
									>
								</div>
								<div class="flex justify-between text-sm">
									<span class={getGradeColor(info.current)}>{info.current}%</span>
								</div>
							</div>
							<Progress value={info.current} class="h-2" />
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<Tabs.Root value="tasks" class="space-y-4">
		<Tabs.List class="grid w-full grid-cols-2">
			<Tabs.Trigger value="tasks">All Tasks</Tabs.Trigger>
			<Tabs.Trigger value="charts">Charts</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="tasks" class="space-y-4">
			<TaskList tasks={normalizedTasks} showFeedback={true} heightClass="h-62" />
		</Tabs.Content>

		<Tabs.Content value="charts" class="space-y-4">
			<Card.Root>
				<Card.Header class="pb-0">
					<div class="flex items-center justify-between">
						<Card.Title>Progress Over Time</Card.Title>
						<div class="bg-background inline-flex overflow-hidden rounded-md border">
							<Button
								variant="ghost"
								size="sm"
								class="data-[active=true]:bg-muted/60 rounded-none"
								data-active={chartView === 'line'}
								onclick={() => (chartView = 'line')}
							>
								Current Grade
							</Button>
							<Button
								variant="ghost"
								size="sm"
								class="data-[active=true]:bg-muted/60 rounded-none border-l"
								data-active={chartView === 'bar'}
								onclick={() => (chartView = 'bar')}
							>
								Task Results
							</Button>
						</div>
					</div>
				</Card.Header>
				<Card.Content class="pt-0">
					<GradeChart tasks={normalizedTasks} view={chartView} showControls={false} />
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</div>
