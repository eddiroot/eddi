<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Label from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea';
	import { formatTimestampAsDate } from '$lib/utils';
	import { getLocalTimeZone, type DateValue } from '@internationalized/date';

	let {
		open = $bindable(),
		selectedDate,
		form,
		enhance,
		errors,
		onMarkAbsent
	}: {
		open: boolean;
		selectedDate: DateValue;
		form: any;
		enhance: any;
		errors: any;
		onMarkAbsent: (studentId: string) => void;
	} = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Mark Student Absent</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to mark this student as absent for {formatTimestampAsDate(
					selectedDate.toDate(getLocalTimeZone())
				)}? You can optionally add a note explaining the absence.
			</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/markAttendance" use:enhance class="space-y-4">
			<input type="hidden" name="studentId" bind:value={$form.studentId} />
			<input type="hidden" name="date" bind:value={$form.date} />
			<div class="space-y-2">
				<Label.Root for="note">Note (optional)</Label.Root>
				<Textarea
					id="note"
					name="note"
					bind:value={$form.note}
					placeholder="Reason for absence..."
					class="min-h-[80px]"
				/>
			</div>
			{#if $errors._errors}
				<div class="text-destructive text-sm font-medium">{$errors._errors}</div>
			{/if}
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
				<Button type="submit" variant="destructive">Mark Absent</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
