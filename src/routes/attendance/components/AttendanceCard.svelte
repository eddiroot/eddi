<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';
	import { formatTimestampAsTime } from '$lib/utils';
	import type { AttendanceRecord } from '../attendance-helpers.js';

	let { attendance }: { attendance: AttendanceRecord } = $props();
</script>

<Card.Root
	class="relative p-0 {attendance.attendance.didAttend
		? 'bg-success/10 border-success/20'
		: 'bg-destructive/10 border-destructive/20'}"
>
	<Card.Content class="p-3 pl-6">
		<div
			class="absolute inset-y-2 left-2 w-1 rounded-full {attendance.attendance.didAttend
				? 'bg-success'
				: 'bg-destructive'}"
		></div>
		<div class="mb-1 flex items-center gap-2">
			<div class="text-sm font-medium">
				{attendance.subject.name} - {attendance.subjectOfferingClass.name}
			</div>
			{#if attendance.attendance.didAttend}
				<CheckIcon class="text-success h-4 w-4" />
			{:else}
				<XIcon class="text-destructive h-4 w-4" />
			{/if}
		</div>
		<div
			class="text-xs {attendance.attendance.didAttend ? 'text-success/70' : 'text-destructive/70'}"
		>
			{attendance.attendance.didAttend ? 'Present' : 'Absent'}
			- {formatTimestampAsTime(attendance.subjectClassAllocation.startTimestamp)}
		</div>
	</Card.Content>
</Card.Root>
