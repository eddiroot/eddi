<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { formatTimestampAsTime } from '$lib/utils';
	import type { ScheduleRecord } from '../attendance-helpers.js';

	let { schedule }: { schedule: ScheduleRecord } = $props();
</script>

<Card.Root class="bg-muted/20 relative border-dashed p-0">
	<Card.Content class="p-3 pl-6">
		<div class="bg-muted absolute inset-y-2 left-2 w-1 rounded-full"></div>
		<div class="mb-1 flex items-center gap-2">
			<div class="text-muted-foreground text-sm font-medium">
				{schedule.subject.name} - {schedule.subjectOfferingClass.name}
			</div>
		</div>
		<div class="text-muted-foreground text-xs">
			Scheduled - {formatTimestampAsTime(schedule.subjectClassAllocation.startTimestamp)}
		</div>
	</Card.Content>
</Card.Root>
