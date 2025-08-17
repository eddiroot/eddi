<script lang="ts">
  import * as Table from '$lib/components/ui/table';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import ListFilter from '@lucide/svelte/icons/list-filter';
  import { format } from 'date-fns';
  
  interface Task {
    id: number;
    name: string;
    type: 'lesson' | 'homework' | 'assessment';
    studentGrade: number | null;
    maxPoints: number;
    weight: number | null;
    dueDate: string;
    submittedDate?: string | null;
    feedback?: string | null;
    status: 'graded' | 'pending';
  }
  
  let { 
    tasks, 
    showFeedback = false 
  }: { 
    tasks: Task[]; 
    showFeedback?: boolean; 
  } = $props();

  let selectedTypeFilter = $state('all');
  let selectedStatusFilter = $state('all');
  let showTypeFilter = $state(false);
  let showStatusFilter = $state(false);
  let typeFilterAnchor = $state<HTMLElement>();
  let statusFilterAnchor = $state<HTMLElement>();

  // Compute a fixed-position style string for a dropdown anchored to a button
  function getDropdownStyleFor(btn?: HTMLElement | null) {
    if (!btn) return '';
    const r = btn.getBoundingClientRect();
    const gap = 4; // space between button and dropdown
    const top = r.bottom + gap;
    const left = r.left;
    // Clamp max height to viewport so it never gets cut off; keep small margin at bottom
    const maxH = Math.max(64, window.innerHeight - top - 8);
    return `top:${top}px;left:${left}px;max-height:${maxH}px;`;
  }
  const getTypeDropdownStyle = () => getDropdownStyleFor(typeFilterAnchor);
  const getStatusDropdownStyle = () => getDropdownStyleFor(statusFilterAnchor);
  
  let filteredTasks = $derived(() => {
    let filtered = tasks;
    
    if (selectedTypeFilter !== 'all') {
      filtered = filtered.filter(task => task.type === selectedTypeFilter);
    }
    
    if (selectedStatusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === selectedStatusFilter);
    }
    
    return filtered;
  });

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-dropdown')) {
      showTypeFilter = false;
      showStatusFilter = false;
    }
  }
  
  function getTypeColor(type: string): "default" | "secondary" | "destructive" | "outline" {
    switch (type) {
      case 'assessment': return 'destructive';
      case 'homework': return 'secondary';
      case 'lesson': return 'outline';
      default: return 'outline';
    }
  }
  
  function getGradeColor(marks: number | null): string {
    if (marks === null || marks === undefined) return 'text-muted-foreground';
    if (marks < 40) return 'text-red-500';
    return 'text-foreground';
  }

  function getStatusColor(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
      case 'graded': return 'default';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  }
</script>

<svelte:window onclick={handleClickOutside} />

<Card.Root>
  <Card.Content>
    <div>
      <Table.Root class="w-full table-fixed">
        <Table.Header class="border-b">
          <Table.Row>
            <Table.Head class="w-96">Tasks</Table.Head>
          <Table.Head class="w-28">
        <div class="flex items-center space-x-2">
          <span>Type</span>
          <div class="relative filter-dropdown">
            <span class="inline-block" bind:this={typeFilterAnchor}>
            <Button
              variant="ghost"
              size="sm"
              class="h-6 w-6 p-0"
              onclick={() => { showTypeFilter = !showTypeFilter; if (showTypeFilter) showStatusFilter = false; }}
            >
              <ListFilter class="h-4 w-4" />
            </Button>
            </span>
            {#if showTypeFilter}
              <div class="fixed z-50 filter-dropdown bg-white border border-gray-200 rounded-md shadow-lg p-2 min-w-32 overflow-auto" style={getTypeDropdownStyle()}>
                <div class="space-y-1">
                  <button
                    class="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                    class:bg-blue-100={selectedTypeFilter === 'all'}
                    onclick={() => { selectedTypeFilter = 'all'; showTypeFilter = false; }}
                  >
                    All tasks
                  </button>
                  <button
                    class="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                    class:bg-blue-100={selectedTypeFilter === 'lesson'}
                    onclick={() => { selectedTypeFilter = 'lesson'; showTypeFilter = false; }}
                  >
                    Lessons
                  </button>
                  <button
                    class="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                    class:bg-blue-100={selectedTypeFilter === 'homework'}
                    onclick={() => { selectedTypeFilter = 'homework'; showTypeFilter = false; }}
                  >
                    Homework
                  </button>
                  <button
                    class="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                    class:bg-blue-100={selectedTypeFilter === 'assessment'}
                    onclick={() => { selectedTypeFilter = 'assessment'; showTypeFilter = false; }}
                  >
                    Assessments
                  </button>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </Table.Head>
      <Table.Head class="w-32">Grade</Table.Head>
      <Table.Head class="w-20">Weight</Table.Head>
      <Table.Head class="w-28">
        <div class="flex items-center space-x-2">
          <span>Status</span>
          <div class="relative filter-dropdown">
            <span class="inline-block" bind:this={statusFilterAnchor}>
            <Button
              variant="ghost"
              size="sm"
              class="h-6 w-6 p-0"
              onclick={() => { showStatusFilter = !showStatusFilter; if (showStatusFilter) showTypeFilter = false; }}
            >
              <ListFilter class="h-4 w-4" />
            </Button>
            </span>
            {#if showStatusFilter}
              <div class="fixed z-50 filter-dropdown bg-white border border-gray-200 rounded-md shadow-lg p-2 min-w-32 overflow-auto" style={getStatusDropdownStyle()}>
                <div class="space-y-1">
                  <button
                    class="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                    class:bg-blue-100={selectedStatusFilter === 'all'}
                    onclick={() => { selectedStatusFilter = 'all'; showStatusFilter = false; }}
                  >
                    All
                  </button>
                  <button
                    class="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                    class:bg-blue-100={selectedStatusFilter === 'graded'}
                    onclick={() => { selectedStatusFilter = 'graded'; showStatusFilter = false; }}
                  >
                    Graded
                  </button>
                  <button
                    class="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                    class:bg-blue-100={selectedStatusFilter === 'pending'}
                    onclick={() => { selectedStatusFilter = 'pending'; showStatusFilter = false; }}
                  >
                    Pending
                  </button>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </Table.Head>
      <Table.Head class="w-32">Due Date</Table.Head>
      {#if showFeedback}
        <Table.Head>Feedback</Table.Head>
      {/if}
    </Table.Row>
  </Table.Header>
      </Table.Root>
    </div>
  <div class="h-76 overflow-y-auto [scrollbar-gutter:stable]">
      <Table.Root class="w-full table-fixed">
        <Table.Body>
          {#each filteredTasks() as task}
            <Table.Row>
              <Table.Cell class="w-96 font-medium">
                <span class="truncate block">{task.name}</span>
              </Table.Cell>
              <Table.Cell class="w-28">
                <Badge variant={getTypeColor(task.type)}>
                  {task.type}
                </Badge>
              </Table.Cell>
              <Table.Cell class="w-32">
                {#if task.studentGrade !== null}
                  <span class={getGradeColor((task.studentGrade / task.maxPoints) * 100)}>
                    {task.studentGrade}/{task.maxPoints}
                  </span>
                  <span class="text-sm text-muted-foreground ml-2">
                    ({Math.round((task.studentGrade / task.maxPoints) * 100)}%)
                  </span>
                {:else}
                  <span class="text-muted-foreground">Not graded</span>
                {/if}
              </Table.Cell>
              <Table.Cell class="w-20">
                {#if task.weight !== null}
                  <span class="text-sm">{task.weight}%</span>
                {:else}
                  <span class="text-sm text-muted-foreground">—</span>
                {/if}
              </Table.Cell>
              <Table.Cell class="w-28">
                <Badge variant={getStatusColor(task.status)}>
                  {task.status}
                </Badge>
              </Table.Cell>
              <Table.Cell class="w-32">
                {format(new Date(task.dueDate), 'MMM dd, yyyy')}
              </Table.Cell>
              {#if showFeedback}
                <Table.Cell class="max-w-108">
                  <span class="text-sm text-muted-foreground truncate block">
                    {task.feedback || 'No feedback'}
                  </span>
                </Table.Cell>
              {/if}
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
    <div class="flex justify-end mt-2">
      <div class="text-sm text-muted-foreground">
        Showing {filteredTasks().length} of {tasks.length} tasks
      </div>
    </div>
  </Card.Content>
</Card.Root>
