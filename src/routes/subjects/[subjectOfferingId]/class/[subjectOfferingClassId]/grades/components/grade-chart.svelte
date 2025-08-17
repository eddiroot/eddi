<script lang="ts">
  import * as Chart from '$lib/components/ui/chart';
  import { LineChart } from 'layerchart';
  
  interface GradeHistoryItem {
    date: string;
    grade: number;
    task?: string;
  }
  
  let { data }: { data: GradeHistoryItem[] } = $props();
  
  const chartConfig = {
    grade: {
      label: 'Grade',
      color: 'hsl(var(--chart-1))'
    }
  } satisfies Chart.ChartConfig;
</script>

<Chart.Container config={chartConfig} class="h-[300px]">
  <LineChart
    {data}
    x="date"
    y="grade"
    yDomain={[0, 100]}
  >
    {#snippet tooltip()}
      <Chart.Tooltip />
    {/snippet}
  </LineChart>
</Chart.Container>
