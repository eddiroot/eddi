<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { convertToFullName } from '$lib/utils';
	import { invalidateAll } from '$app/navigation';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';

	const { data } = $props();
	const attendances = $derived(data.attendances || []);

	let searchTerm = $state('');

	const filteredAttendances = $derived(
		attendances
			.filter((attendance) => {
				const fullName = convertToFullName(
					attendance.user.firstName,
					attendance.user.middleName,
					attendance.user.lastName
				);
				return fullName.toLowerCase().includes(searchTerm.toLowerCase());
			})
			.sort((a, b) => {
				// Priority order:
				// 1. Not yet marked (no attendance record or didAttend is null/undefined)
				// 2. Marked as present or not present
				// 3. Was absent (at the end)
				
				const aWasAbsent = a.attendance?.wasAbsent || false;
				const bWasAbsent = b.attendance?.wasAbsent || false;
				
				// If one is absent and the other isn't, put absent at the end
				if (aWasAbsent && !bWasAbsent) return 1;
				if (!aWasAbsent && bWasAbsent) return -1;
				
				// If both are absent or both are not absent, check attendance status
				const aHasAttendance = a.attendance && (a.attendance.didAttend === true || a.attendance.didAttend === false);
				const bHasAttendance = b.attendance && (b.attendance.didAttend === true || b.attendance.didAttend === false);
				
				// Unmarked attendance comes first
				if (!aHasAttendance && bHasAttendance) return -1;
				if (aHasAttendance && !bHasAttendance) return 1;
				
				// If both have same attendance status, sort alphabetically by name
				const aName = convertToFullName(a.user.firstName, a.user.middleName, a.user.lastName);
				const bName = convertToFullName(b.user.firstName, b.user.middleName, b.user.lastName);
				return aName.localeCompare(bName);
			})
	);

	async function handleAttendanceUpdate(
		subjectClassAllocationId: number,
		userId: string,
		didAttend: boolean | null
	) {
		const formData = new FormData();
		formData.append('subjectClassAllocationId', subjectClassAllocationId.toString());
		formData.append('userId', userId);

		if (didAttend !== null) {
			formData.append('didAttend', didAttend.toString());
		}

		try {
			const response = await fetch('?/updateAttendance', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				await invalidateAll();
			}
		} catch (error) {
			console.error('Error updating attendance:', error);
		}
	}

	function getAttendanceStatus(attendance: any) {
		if (!attendance) return { status: 'unrecorded', variant: 'secondary' as const };
		if (attendance.wasAbsent) return { status: 'Absent', variant: 'destructive' as const };
		if (attendance.didAttend === true) return { status: 'Present', variant: 'default' as const };
		if (attendance.didAttend === false)
			return { status: 'Not Present', variant: 'destructive' as const };
		return { status: 'Not recorded', variant: 'secondary' as const };
	}
</script>

<div class="flex h-full flex-col space-y-6 p-8">
	<div class="flex flex-col space-y-4">
		<h1 class="text-3xl font-bold tracking-tight">Attendance</h1>

		{#if attendances.length === 0}
			<p class="text-muted-foreground">No students found for the current day.</p>
		{:else}
			<div class="flex items-center space-x-4">
				<Input placeholder="Search students..." bind:value={searchTerm} class="max-w-sm" />
				<div class="text-muted-foreground text-sm">
					{filteredAttendances.filter((a) => a.attendance?.didAttend === true).length} of {filteredAttendances.length}
					student(s) present
				</div>
			</div>
		{/if}
	</div>

	{#if filteredAttendances.length > 0}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each filteredAttendances as attendanceRecord (attendanceRecord.user.id + '-' + attendanceRecord.subjectClassAllocation.id)}
				{@const user = attendanceRecord.user}
				{@const attendance = attendanceRecord.attendance}
				{@const subjectClassAllocation = attendanceRecord.subjectClassAllocation}
				{@const fullName = convertToFullName(user.firstName, user.middleName, user.lastName)}
				{@const statusInfo = getAttendanceStatus(attendance)}
				{@const wasAbsent = attendance?.wasAbsent || false}
				{@const isPresent = attendance?.didAttend === true}
				{@const isNotPresent = attendance?.didAttend === false}

				<Card class="transition-all hover:shadow-md">
					<CardHeader class="pb-3">
						<div class="flex items-start justify-between">
							<h3 class="text-lg leading-tight font-semibold">{fullName}</h3>
							<Badge variant={statusInfo.variant} class="text-xs">
								{statusInfo.status}
							</Badge>
						</div>
					</CardHeader>
					<CardContent class="space-y-4">
						{#if attendance?.note}
							<div class="text-muted-foreground text-sm">
								<span class="font-medium">Note:</span>
								{attendance.note}
							</div>
						{/if}

						{#if !wasAbsent}
							<div class="flex gap-2">
								<Button
									variant={isPresent ? 'default' : 'outline'}
									size="sm"
									class="flex-1 gap-2"
									onclick={() => handleAttendanceUpdate(subjectClassAllocation.id, user.id, true)}
								>
									<Check class="h-4 w-4" />
									Present
								</Button>
								<Button
									variant={isNotPresent ? 'destructive' : 'outline'}
									size="sm"
									class="flex-1 gap-2"
									onclick={() => handleAttendanceUpdate(subjectClassAllocation.id, user.id, false)}
								>
									<X class="h-4 w-4" />
									Absent
								</Button>
							</div>
						{:else}
							<div class="text-muted-foreground bg-muted rounded p-4 text-center text-sm">
								Student is absent from school today and cannot be updated
							</div>
						{/if}
					</CardContent>
				</Card>
			{/each}
		</div>
	{:else if attendances.length > 0}
		<div class="text-muted-foreground py-8 text-center">
			No students found matching your search.
		</div>
	{/if}
</div>
