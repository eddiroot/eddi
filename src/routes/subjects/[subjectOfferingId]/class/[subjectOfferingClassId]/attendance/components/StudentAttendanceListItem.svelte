<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { convertToFullName } from '$lib/utils';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import Clock from '@lucide/svelte/icons/clock';
	import NotebookPen from '@lucide/svelte/icons/notebook-pen';
	import { fade } from 'svelte/transition';
	import type { SuperForm } from 'sveltekit-superforms';
	import type {
		SubjectClassAllocation,
		SubjectClassAllocationAttendance,
		User
	} from '$lib/server/db/schema';
	import { PenIcon, MessageCircleWarning } from '@lucide/svelte';

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
		variant: 'success' | 'destructive' | 'outline';
	} {
		if (!attendance) return { status: 'Unrecorded', variant: 'outline' };
		if (attendance.wasAbsent) return { status: 'Away', variant: 'destructive' };
		if (attendance.didAttend === true) return { status: 'Present', variant: 'success' };
		return { status: 'Absent', variant: 'destructive' };
	}

	const statusInfo = $derived(getAttendanceStatus(attendance));

	let dialogOpen = $state(false);
</script>

<div class="border-border border-b transition-all last:border-b-0" in:fade={{ duration: 200 }}>
	<div class="flex items-center justify-between p-4">
		<!-- Student info and status -->
		<div class="flex items-center gap-2">
			<div class="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
				<span class="text-sm font-medium">
					{user.firstName.charAt(0)}{user.lastName.charAt(0)}
				</span>
			</div>
			<div class="flex flex-col">
				<h3 class="truncate font-medium">{fullName}</h3>
				<div class="flex items-center gap-2">
					<Badge variant={statusInfo.variant} class="text-xs">
						{statusInfo.status}
					</Badge>
					<div class="flex items-center gap-2">
						{#if attendance?.behaviourNote}
							<NotebookPen class="size-4" />
						{/if}

						{#if attendance?.attendanceNote}
							<MessageCircleWarning class="text-destructive size-4" />
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Action buttons -->
		<div class="flex items-center gap-2">
			{#if type === 'marked' && isNotPresent && !wasAbsent}
				<form method="POST" action="?/updateAttendance" use:enhance>
					<input type="hidden" name="didAttend" value="true" />
					<input type="hidden" name="userId" value={user.id} />
					<input type="hidden" name="subjectClassAllocationId" value={subjectClassAllocation.id} />
					<input type="hidden" name="behaviourNote" value="Amended from absent - arrived late" />
					<Button variant="outline" size="sm" type="submit">
						<Clock />
						Amend as Late
					</Button>
				</form>
			{/if}

			{#if type === 'unmarked' || isPresent}
				<form method="POST" action="?/updateAttendance" use:enhance>
					<input type="hidden" name="didAttend" value="false" />
					<input type="hidden" name="userId" value={user.id} />
					<input type="hidden" name="subjectClassAllocationId" value={subjectClassAllocation.id} />
					<Button variant="destructive" size="sm" type="submit" disabled={wasAbsent}>
						<X />
						Absent
					</Button>
				</form>
			{/if}

			{#if isPresent}
				<Button size="sm" onclick={() => (dialogOpen = true)} disabled={type === 'unmarked'}>
					<PenIcon />
					Add Notes
				</Button>
			{/if}

			{#if !attendance?.attendanceNote && (type === 'unmarked' || isNotPresent)}
				<form method="POST" action="?/updateAttendance" use:enhance>
					<input type="hidden" name="didAttend" value="true" />
					<input type="hidden" name="userId" value={user.id} />
					<input type="hidden" name="subjectClassAllocationId" value={subjectClassAllocation.id} />
					<Button size="sm" type="submit" disabled={wasAbsent} variant="success">
						<Check />
						Present
					</Button>
				</form>
			{/if}

			{#if attendance?.attendanceNote}
				<p class="text-muted-foreground text-sm">{attendance?.attendanceNote}</p>
			{/if}
		</div>
	</div>
</div>

<!-- Modal Dialog -->
<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="max-w-md">
		<form method="POST" action="?/updateAttendance" use:enhance>
			<Dialog.Header>
				<Dialog.Title>{fullName}</Dialog.Title>
			</Dialog.Header>
			<div class="space-y-4 py-4">
				{#if type === 'marked' && isPresent && !wasAbsent}
					<div class="space-y-2">
						<input type="hidden" name="didAttend" value="true" />
						<input type="hidden" name="userId" value={user.id} />
						<input
							type="hidden"
							name="subjectClassAllocationId"
							value={subjectClassAllocation.id}
						/>

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
									/>
								{/snippet}
							</Form.Control>
						</Form.Field>
					</div>
				{/if}
			</div>

			<Dialog.Footer>
				<Dialog.Close>
					<Button variant="outline">Close</Button>
					<Button variant="default" type="submit">Save</Button>
				</Dialog.Close>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
