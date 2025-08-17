<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import * as Tabs from '$lib/components/ui/tabs';
  import { Badge } from '$lib/components/ui/badge';
  import { Progress } from '$lib/components/ui/progress';
  import GradeChart from './components/grade-chart.svelte';
  import TaskList from './components/task-list.svelte';
  import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
  import Clock from '@lucide/svelte/icons/clock';
  import ClipboardList from '@lucide/svelte/icons/clipboard-list';

  let { data } = $props();
  const totalTasks = data.gradeData.tasks.length;
  const gradedCount = data.gradeData.tasks.filter(a => a.status === 'graded').length;
  const pendingCount = data.gradeData.tasks.filter(a => a.status === 'pending').length;
  const lateCount = Math.max(0, totalTasks - gradedCount - pendingCount);
  const completion = totalTasks ? Math.round((gradedCount / totalTasks) * 100) : 0;
  
  function getGradeColor(marks: number | null): string {
    if (marks === null || marks === undefined) return 'text-muted-foreground';
    if (marks < 40) return 'text-red-500';
    return 'text-foreground';
  }

</script>

<div class="container mx-auto p-6 space-y-6">
  <div class="space-y-2">
    <h1 class="text-3xl font-bold">{data.gradeData.subject.name}</h1>
    <div class="flex items-center gap-4 text-muted-foreground">
      <span>Teacher: {data.gradeData.subject.teacher}</span>
      <span>•</span>
      <span>Class: {data.gradeData.subject.className}</span>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-6 gap-4">
    <Card.Root class="lg:col-span-1">
      <Card.Header>
        <Card.Title class="text-sm font-medium">Current Grade</Card.Title>
      </Card.Header>
      <Card.Content class="space-y-3">
        <div class="flex items-end gap-2">
          <span class="text-3xl leading-none font-bold {getGradeColor(data.gradeData.subject.currentGrade)}">
            {data.gradeData.subject.letterGrade}
          </span>
          <span class="text-sm text-muted-foreground">
            {data.gradeData.subject.currentGrade}%
          </span>
        </div>
        <Progress value={data.gradeData.subject.currentGrade} class="h-2" />
        <div class="text-xs text-muted-foreground">Based on graded work</div>
      </Card.Content>
    </Card.Root>

    <Card.Root class="lg:col-span-1">
      <Card.Header>
        <Card.Title class="text-sm font-medium">Tasks</Card.Title>
      </Card.Header>
      <Card.Content class="space-y-3">
        <div class="flex items-center gap-2">
          <ClipboardList class="h-5 w-5 text-muted-foreground" />
          <div class="text-xl font-bold">{totalTasks}</div>
          <div class="text-xs text-muted-foreground">total</div>
        </div>
        <div class="flex flex-wrap gap-2">
          <Badge variant="default" class="gap-1"><CheckCircle2 class="h-3 w-3" /> {gradedCount} graded</Badge>
          <Badge variant="secondary" class="gap-1"><Clock class="h-3 w-3" /> {pendingCount} pending</Badge>
          {#if lateCount > 0}
            <Badge variant="destructive" class="gap-1">{lateCount} late</Badge>
          {/if}
        </div>
        <div>
          <div class="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Completed</span><span>{completion}%</span>
          </div>
          <Progress value={completion} class="h-2" />
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root class="lg:col-span-4">
      <Card.Header>
        <Card.Title class="text-sm font-medium">Grade Breakdown by Category</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="grid grid-cols-3 gap-4">
          {#each Object.entries(data.gradeData.gradeBreakdown) as [category, info]}
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium capitalize">{category}</span>
                <span class="text-xs text-muted-foreground">{info.weight}%</span>
              </div>
              <div class="space-y-1">
                <div class="flex justify-between text-sm">
                  <span class={getGradeColor(info.current)}>{info.current}%</span>
                </div>
                <Progress value={info.current} class="h-2" />
              </div>
            </div>
          {/each}
        </div>
      </Card.Content>
    </Card.Root>
  </div>

  <Tabs.Root value="tasks" class="space-y-4">
    <Tabs.List class="grid w-full grid-cols-3">
      <Tabs.Trigger value="tasks">All Tasks</Tabs.Trigger>
      <Tabs.Trigger value="charts">Charts</Tabs.Trigger>
      <Tabs.Trigger value="progress">Progress & Insights</Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="tasks" class="space-y-4">
      <TaskList 
        tasks={data.gradeData.tasks} 
        showFeedback={true}
      />
    </Tabs.Content>

    <Tabs.Content value="charts" class="space-y-4">
      <Card.Root>
        <Card.Header>
          <Card.Title>Grade Progress Over Time</Card.Title>
        </Card.Header>
        <Card.Content>
          <GradeChart data={data.gradeData.gradeHistory} />
        </Card.Content>
      </Card.Root>
    </Tabs.Content>

    <Tabs.Content value="progress" class="space-y-4">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card.Root>
          <Card.Header>
            <Card.Title>Strengths</Card.Title>
          </Card.Header>
          <Card.Content class="space-y-3">
            {#each data.gradeData.insights.strengths as strength}
              <div class="flex items-center space-x-2">
                <Badge variant="default">✓</Badge>
                <span class="text-sm">{strength}</span>
              </div>
            {/each}
          </Card.Content>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <Card.Title>Areas to Improve</Card.Title>
          </Card.Header>
          <Card.Content class="space-y-3">
            {#each data.gradeData.insights.improvementAreas as area}
              <div class="flex items-center space-x-2">
                <Badge variant="outline">⚠</Badge>
                <span class="text-sm">{area}</span>
              </div>
            {/each}
          </Card.Content>
        </Card.Root>

        <Card.Root class="lg:col-span-2">
          <Card.Header>
            <Card.Title>Recommended Next Steps</Card.Title>
          </Card.Header>
          <Card.Content class="space-y-3">
            {#each data.gradeData.insights.nextSteps as step, index}
              <div class="flex items-start space-x-3">
                <div class="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <span class="text-sm">{step}</span>
              </div>
            {/each}
          </Card.Content>
        </Card.Root>
      </div>
    </Tabs.Content>
  </Tabs.Root>
</div>
