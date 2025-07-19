<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { convertToFullName } from '$lib/utils';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import { fade, scale } from 'svelte/transition';
	import type { SuperForm } from 'sveltekit-superforms';
	import type {
		SubjectClassAllocation,
		SubjectClassAllocationAttendance,
		User
	} from '$lib/server/db/schema';

	type AttendanceRecord = {
		user: Pick<User, 'id' | 'firstName' | 'middleName' | 'lastName'>;
		attendance?: Pick<
			SubjectClassAllocationAttendance,
			'didAttend' | 'wasAbsent' | 'attendanceNote' | 'behaviourNote'
		> | null;
		subjectClassAllocation: Pick<SubjectClassAllocation, 'id'>;
	};

	let {
		attendanceRecord,
		form,
		enhance,
		type = 'unmarked'
	}: {
		attendanceRecord: AttendanceRecord;
		form: SuperForm<any>;
		enhance: any;
		type?: 'unmarked' | 'marked';
	} = $props();

	const user = $derived(attendanceRecord.user);
	const attendance = $derived(attendanceRecord.attendance);
	const subjectClassAllocation = $derived(attendanceRecord.subjectClassAllocation);
	const fullName = $derived(convertToFullName(user.firstName, user.middleName, user.lastName));

	const wasAbsent = $derived(attendance?.wasAbsent || false);
	const isPresent = $derived(attendance?.didAttend === true);
	const isNotPresent = $derived(attendance?.didAttend === false);

	function getAttendanceStatus(attendance: any): {
		status: string;
		variant: 'default' | 'secondary' | 'destructive';
	} {
		if (!attendance) return { status: 'Unrecorded', variant: 'secondary' };
		if (attendance.wasAbsent) return { status: 'Away', variant: 'destructive' };
		if (attendance.didAttend === true) return { status: 'Present', variant: 'default' };
		return { status: 'Absent', variant: 'destructive' };
	}

	const statusInfo = $derived(getAttendanceStatus(attendance));
</script>

<div class="h-full" in:fade={{ duration: 200 }} out:scale={{ duration: 200, start: 0.95 }}>
	<Card class="h-full gap-3 {type === 'marked' ? 'opacity-80 transition-all' : 'transition-all'}">
		<CardHeader>
			<div class="flex items-start justify-between">
				<CardTitle>{fullName}</CardTitle>
				<Badge variant={statusInfo.variant} class="text-xs">
					{statusInfo.status}
				</Badge>
			</div>
		</CardHeader>
		<CardContent class="space-y-4">
			{#if isNotPresent && attendance?.attendanceNote}
				<div class="text-muted-foreground text-sm">
					<span class="font-medium">Attendance Note:</span>
					{attendance.attendanceNote}
				</div>
			{/if}

			{#if isPresent && attendance?.behaviourNote}
				<div class="text-muted-foreground text-sm">
					<span class="font-medium">Behavioural Note:</span>
					{attendance.behaviourNote}
				</div>
			{/if}

			<!-- Quick action buttons -->
			<div class="flex gap-2">
				<form method="POST" action="?/updateAttendance" use:enhance>
					<input type="hidden" name="didAttend" value="true" />
					<input type="hidden" name="userId" value={user.id} />
					<input type="hidden" name="subjectClassAllocationId" value={subjectClassAllocation.id} />
					<Button size="sm" type="submit" disabled={wasAbsent}>
						<Check />
						Present
					</Button>
				</form>
				<form method="POST" action="?/updateAttendance" use:enhance>
					<input type="hidden" name="didAttend" value="false" />
					<input type="hidden" name="userId" value={user.id} />
					<input type="hidden" name="subjectClassAllocationId" value={subjectClassAllocation.id} />
					<Button variant="destructive" size="sm" type="submit" disabled={wasAbsent}>
						<X />
						Absent
					</Button>
				</form>
			</div>

			{#if type === 'marked' && isPresent && !wasAbsent}
				<form method="POST" action="?/updateAttendance" use:enhance class="space-y-2">
					<input type="hidden" name="didAttend" value="true" />
					<input type="hidden" name="userId" value={user.id} />
					<input type="hidden" name="subjectClassAllocationId" value={subjectClassAllocation.id} />

					<Form.Field {form} name="behaviourNote">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="text-sm font-medium">Behavioural Notes</Form.Label>
								<Textarea
									{...props}
									name="behaviourNote"
									placeholder="Add behavioural observations..."
									class="min-h-20 resize-none"
									value={attendance?.behaviourNote || ''}
									onblur={(e) => {
										(e.target as HTMLTextAreaElement)?.form?.requestSubmit();
									}}
								/>
							{/snippet}
						</Form.Control>
					</Form.Field>
				</form>
			{/if}

			{#if type === 'marked' && isNotPresent && !wasAbsent}
				<form method="POST" action="?/updateAttendance" use:enhance class="space-y-2">
					<input type="hidden" name="didAttend" value="false" />
					<input type="hidden" name="userId" value={user.id} />
					<input type="hidden" name="subjectClassAllocationId" value={subjectClassAllocation.id} />

					<Form.Field {form} name="attendanceNote">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="text-sm font-medium">Attendance Notes</Form.Label>
								<Textarea
									{...props}
									name="attendanceNote"
									placeholder="Add attendance notes..."
									class="min-h-20 resize-none"
									value={attendance?.attendanceNote || ''}
									onblur={(e) => {
										(e.target as HTMLTextAreaElement)?.form?.requestSubmit();
									}}
								/>
							{/snippet}
						</Form.Control>
					</Form.Field>
				</form>
			{/if}
		</CardContent>
	</Card>
</div>
