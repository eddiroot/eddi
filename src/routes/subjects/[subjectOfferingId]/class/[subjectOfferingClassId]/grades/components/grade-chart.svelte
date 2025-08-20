<script lang="ts">
  import * as Chart from '$lib/components/ui/chart';
  import { BarChart, LineChart } from 'layerchart';
  import { Button } from '$lib/components/ui/button';
  import { fade } from 'svelte/transition';


  // Tasks for individual results
  type TaskStatus = 'graded' | 'submitted' | 'pending';
  interface Task {
    id: number | string;
    name: string;
    studentGrade: number | null;
    maxPoints: number;
    dueDate: string; // ISO
    status: TaskStatus;
    weight?: number | null; // percentage weight (e.g., 20 for 20%)
  }

  let { tasks = [] as Task[], view: viewProp = null as null | 'line' | 'bar', showControls = true } = $props();

  // Bar series: individual result % by due date
  const barData = tasks
    .filter((t) => t.status === 'graded' && t.studentGrade !== null && t.maxPoints > 0)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .map((t) => ({ date: new Date(t.dueDate), score: (t.studentGrade! / t.maxPoints) * 100, label: t.name }));

  // Line series: compute from weighted graded tasks only.
  // Cumulative weighted average: sum(score% * weight) / sum(weight)
  const weightedTasks = tasks
    .filter(
      (t) =>
        t.status === 'graded' &&
        t.studentGrade !== null &&
        t.maxPoints > 0 &&
        t.weight !== null &&
        t.weight !== undefined &&
        t.weight > 0
    )
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  let cumulativeWeight = 0;
  let cumulativeWeightedScore = 0;
  // Raw points include one point per graded task; multiple tasks on the same day can cause vertical lines.
  const rawLineData = weightedTasks.map((t) => {
    const pct = (t.studentGrade! / t.maxPoints) * 100;
    const w = t.weight!; // guaranteed > 0 from filter
    cumulativeWeight += w;
    cumulativeWeightedScore += pct * w;
    const currentGrade = cumulativeWeightedScore / cumulativeWeight;
    return { date: new Date(t.dueDate), grade: currentGrade };
  });

  // Collapse to a single point per calendar day, taking the last value of that day (end-of-day grade).
  function dayKey(d: Date) {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }
  const lineData = (() => {
    const byDay = new Map<string, { date: Date; grade: number }>();
    for (const pt of rawLineData) {
      const key = dayKey(pt.date);
      // Replace with the latest point for that day; insertion order stays chronological from first occurrence.
      byDay.set(key, pt);
    }
    return Array.from(byDay.values());
  })();

  // Shared chart config and toggle
  const chartConfig = {
    grade: { label: 'Grade %', color: 'var(--chart-1)' },
    score: { label: 'Result %', color: 'var(--chart-1)' }
  } satisfies Chart.ChartConfig;

  let view = $state<'line' | 'bar'>('line');
  const currentView = $derived(() => (viewProp === 'line' || viewProp === 'bar') ? viewProp : view);
</script>

<div class="flex items-center justify-between mb-0.5">
  <div class="text-sm text-muted-foreground">
    {currentView() === 'line' ? 'Overall grade as results are released' : 'Each graded result (%) by date'}
  </div>
  {#if showControls}
    <div class="inline-flex rounded-md border bg-background overflow-hidden">
      <Button variant="ghost" size="sm" class="rounded-none data-[active=true]:bg-muted/60" data-active={currentView()==='line'} onclick={() => (view = 'line')}>
        Current Grade
      </Button>
      <Button variant="ghost" size="sm" class="rounded-none border-l data-[active=true]:bg-muted/60" data-active={currentView()==='bar'} onclick={() => (view = 'bar')}>
        Task Results
      </Button>
    </div>
  {/if}
</div>

<Chart.Container config={chartConfig} class="aspect-auto h-[230px] w-full">
  {#if currentView() === 'line'}
    <LineChart
      data={lineData}
      x="date"
      axis="x"
      yDomain={[0, 100]}
      series={[{ key: 'grade', label: 'Grade %', color: chartConfig.grade.color }]}
      props={{
        spline: { motion: 'tween', strokeWidth: 2 },
        xAxis: {
          format: (v: Date) => v.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        },
        yAxis: { format: (v: number) => `${v.toFixed(2)}%` },
        highlight: { points: { r: 4 } }
      }}
    >
      {#snippet tooltip()}
        <Chart.Tooltip hideLabel>
          {#snippet formatter({ value, name })}
            <div class="flex w-full justify-between items-center">
              <span class="text-muted-foreground">{name}</span>
              <span class="text-foreground font-mono font-medium tabular-nums">{typeof value === 'number' ? value.toFixed(2) : value}%</span>
            </div>
          {/snippet}
        </Chart.Tooltip>
      {/snippet}
    </LineChart>
  {:else}
    {#key currentView()}
      <div in:fade={{ duration: 180 }} class="w-full h-full rise-bars">
        <BarChart
          data={barData}
          x="date"
          axis="x"
          series={[{ key: 'score', label: 'Result %', color: 'var(--chart-1)' }]}
          props={{
            bars: { stroke: 'none', rounded: 'none' },
            xAxis: { format: (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) },
            yAxis: { format: (v: number) => `${v.toFixed(2)}%` }
          }}
        >
          {#snippet tooltip()}
            <Chart.Tooltip hideLabel nameKey="score">
              {#snippet formatter({ value, name, item })}
                {@const taskName = (item && (item as any).payload ? (item as any).payload.label ?? (item as any).payload.datum?.label : (item as any)?.label)}
                <div class="w-full">
                  {#if taskName}
                    <div class="text-[11px] text-muted-foreground mb-0.5 truncate" title={taskName}>{taskName}</div>
                  {/if}
                  <div class="flex w-full justify-between items-center">
                    <span class="text-muted-foreground">{name}</span>
                    <span class="text-foreground font-mono font-medium tabular-nums">{typeof value === 'number' ? value.toFixed(2) : value}%</span>
                  </div>
                </div>
              {/snippet}
            </Chart.Tooltip>
          {/snippet}
        </BarChart>
      </div>
    {/key}
  {/if}
</Chart.Container>

<style>
  /* Animate bars rising from the baseline when the bar view appears */
  :global(.rise-bars svg rect) {
    transform-box: fill-box;
    transform-origin: bottom center;
    animation: rise-up 260ms ease-out both;
  }

  @keyframes rise-up {
    from {
      transform: scaleY(0);
      opacity: 0.3;
    }
    to {
      transform: scaleY(1);
      opacity: 1;
    }
  }
</style>
