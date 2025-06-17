<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

  //let { data } = $props();

  const days = [
    { name: 'Monday', value: 'monday' },
    { name: 'Tuesday', value: 'tuesday' },
    { name: 'Wednesday', value: 'wednesday' },
    { name: 'Thursday', value: 'thursday' },
    { name: 'Friday', value: 'friday' },
  ];

  function generateTimeslots(startHour = 8, endHour = 18): string[] {
    const slots: string[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }

  
  const classTimes = [
    { subject: 'Math', startTime: '08:00', duration: '01:00', dayOfWeek: 'monday' },
    { subject: 'English', startTime: '09:00', duration: '01:30', dayOfWeek: 'monday' },
    { subject: 'Science', startTime: '10:30', duration: '01:00', dayOfWeek: 'tuesday' },
    { subject: 'History', startTime: '11:30', duration: '01:00', dayOfWeek: 'wednesday' },
    { subject: 'Art', startTime: '13:00', duration: '02:00', dayOfWeek: 'thursday' },
    { subject: 'PE', startTime: '15:00', duration: '01:00', dayOfWeek: 'friday' },
  ];

  let timeslots = generateTimeslots();

  function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  function durationToMinutes(duration: string): number {
    const [hours, minutes] = duration.split(':').map(Number);
    return hours * 60 + minutes;
  }

  function getClassPosition(startTime: string, duration: string) {
    const startMinutes = timeToMinutes(startTime);
    const startOfDay = 8 * 60; // 8:00 AM in minutes
    const totalSlots = timeslots.length;
    const slotHeight = 100 / totalSlots; // Percentage height per slot
    
    const slotIndex = (startMinutes - startOfDay) / 30; // Each slot is 30 minutes
    const topPosition = slotIndex * slotHeight;
    const durationInSlots = durationToMinutes(duration) / 30;
    const height = durationInSlots * slotHeight;
    
    return { top: `${topPosition}%`, height: `${height}%` };
  }
</script>

<Card class="h-full">
  <CardHeader>
    <CardTitle class="text-xl">Weekly Timetable</CardTitle>
  </CardHeader>
  <CardContent class="h-[calc(100%-40px)]">
    <!-- Day titles -->
    <div class="grid grid-cols-5 gap-4 mb-4">
      {#each days as day}
        <div class="text-center font-semibold text-base border-b-2 border-primary/20 pb-3 text-foreground">
          {day.name}
        </div>
      {/each}
    </div>

    <!-- Timetable grid -->
    <div class="grid grid-cols-5 h-[calc(100%-60px)] relative border rounded-lg overflow-hidden bg-muted/10">
      {#each days as day}
        <div class="relative border-r border-border/50 last:border-r-0">
          <!-- Background timeslot lines -->
          {#each timeslots as time, index}
            <div 
              class="border-t border-border/30 flex items-center justify-start pl-2 text-xs text-muted-foreground hover:bg-muted/20 transition-colors"
              style="height: {100 / timeslots.length}%;"
            >
            </div>
          {/each}

          <!-- Classes for this day -->
          {#each classTimes.filter(c => c.dayOfWeek === day.value) as cls}
            {@const position = getClassPosition(cls.startTime, cls.duration)}
            <div 
              class="absolute left-2 right-2 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-3 rounded-lg text-sm font-medium shadow-lg border border-primary/20 flex flex-col justify-center hover:shadow-xl transition-shadow"
              style="top: {position.top}; height: {position.height};"
            >
              <div class="font-semibold text-sm">{cls.subject}</div>
              <div class="text-xs opacity-90 mt-1">{cls.startTime}</div>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </CardContent>
</Card>
