<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { convertToFullName } from '$lib/utils';
	import { invalidateAll } from '$app/navigation';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import { flip } from 'svelte/animate';
	import { fade, scale } from 'svelte/transition';

	const { data } = $props();
	const attendances = $derived(data.attendances || []);

	let searchTerm = $state('');

	const filteredAttendances = $derived(
		attendances.filter((attendance) => {
			const fullName = convertToFullName(
				attendance.user.firstName,
				attendance.user.middleName,
				attendance.user.lastName
			);
			return fullName.toLowerCase().includes(searchTerm.toLowerCase());
		})
	);

	// Split attendances into unmarked and marked sections
	const unmarkedAttendances = $derived(
		filteredAttendances
			.filter((attendance) => {
				// Include if no attendance record or didAttend is null/undefined, and not absent
				const hasAttendance =
					attendance.attendance &&
					(attendance.attendance.didAttend === true || attendance.attendance.didAttend === false);
				const wasAbsent = attendance.attendance?.wasAbsent || false;
				return !hasAttendance && !wasAbsent;
			})
			.sort((a, b) => {
				const aName = convertToFullName(a.user.firstName, a.user.middleName, a.user.lastName);
				const bName = convertToFullName(b.user.firstName, b.user.middleName, b.user.lastName);
				return aName.localeCompare(bName);
			})
	);

	const markedAttendances = $derived(
		filteredAttendances
			.filter((attendance) => {
				// Include if attendance is marked (present/absent) or student was absent
				const hasAttendance =
					attendance.attendance &&
					(attendance.attendance.didAttend === true || attendance.attendance.didAttend === false);
				const wasAbsent = attendance.attendance?.wasAbsent || false;
				return hasAttendance || wasAbsent;
			})
			.sort((a, b) => {
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
		if (attendance.wasAbsent) return { status: 'Away today', variant: 'destructive' as const };
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
					{markedAttendances.filter((a) => a.attendance?.didAttend === true).length} of {filteredAttendances.length}
					student(s) present
				</div>
			</div>
		{/if}
	</div>

	<!-- Unmarked Attendance Section -->
	{#if unmarkedAttendances.length > 0}
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-foreground text-xl font-semibold">
					Attendance Unrecorded ({unmarkedAttendances.length})
				</h2>
				<Badge variant="secondary" class="text-sm">
					{unmarkedAttendances.length} remaining
				</Badge>
			</div>
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each unmarkedAttendances as attendanceRecord (attendanceRecord.user.id + '-' + attendanceRecord.subjectClassAllocation.id)}
					{@const user = attendanceRecord.user}
					{@const attendance = attendanceRecord.attendance}
					{@const subjectClassAllocation = attendanceRecord.subjectClassAllocation}
					{@const fullName = convertToFullName(user.firstName, user.middleName, user.lastName)}
					{@const statusInfo = getAttendanceStatus(attendance)}
					{@const wasAbsent = attendance?.wasAbsent || false}
					{@const isPresent = attendance?.didAttend === true}
					{@const isNotPresent = attendance?.didAttend === false}

					<div
						animate:flip={{ duration: 400 }}
						in:fade={{ duration: 200 }}
						out:scale={{ duration: 200, start: 0.95 }}
					>
						<Card class="transition-all hover:shadow-md">
							<CardHeader class="pb-3">
								<div class="flex items-start justify-between">
									<h3 class="text-lg leading-tight font-semibold">{fullName}</h3>
									<Badge variant="secondary" class="text-xs">Unrecorded</Badge>
								</div>
							</CardHeader>
							<CardContent class="space-y-4">
								{#if attendance?.note}
									<div class="text-muted-foreground text-sm">
										<span class="font-medium">Note:</span>
										{attendance.note}
									</div>
								{/if}

								<div class="flex gap-2">
									<Button
										variant="default"
										size="sm"
										class="flex-1 gap-2"
										onclick={() => handleAttendanceUpdate(subjectClassAllocation.id, user.id, true)}
									>
										<Check class="h-4 w-4" />
										Present
									</Button>
									<Button
										variant="destructive"
										size="sm"
										class="flex-1 gap-2"
										onclick={() =>
											handleAttendanceUpdate(subjectClassAllocation.id, user.id, false)}
									>
										<X class="h-4 w-4" />
										Absent
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Marked Attendance Section -->
	{#if markedAttendances.length > 0}
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-foreground text-xl font-semibold">
					Attendance Recorded ({markedAttendances.length})
				</h2>
				<div class="text-muted-foreground text-sm">
					{markedAttendances.filter((a) => a.attendance?.didAttend === true).length} present,
					{markedAttendances.filter((a) => a.attendance?.didAttend === false).length} absent,
					{markedAttendances.filter((a) => a.attendance?.wasAbsent).length} away today
				</div>
			</div>
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each markedAttendances as attendanceRecord (attendanceRecord.user.id + '-' + attendanceRecord.subjectClassAllocation.id)}
					{@const user = attendanceRecord.user}
					{@const attendance = attendanceRecord.attendance}
					{@const subjectClassAllocation = attendanceRecord.subjectClassAllocation}
					{@const fullName = convertToFullName(user.firstName, user.middleName, user.lastName)}
					{@const statusInfo = getAttendanceStatus(attendance)}
					{@const wasAbsent = attendance?.wasAbsent || false}
					{@const isPresent = attendance?.didAttend === true}
					{@const isNotPresent = attendance?.didAttend === false}

					<div
						animate:flip={{ duration: 400 }}
						in:fade={{ duration: 200 }}
						out:scale={{ duration: 200, start: 0.95 }}
					>
						<Card class="opacity-75 transition-all hover:shadow-md">
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
											onclick={() =>
												handleAttendanceUpdate(subjectClassAllocation.id, user.id, true)}
										>
											<Check class="h-4 w-4" />
											Present
										</Button>
										<Button
											variant={isNotPresent ? 'destructive' : 'outline'}
											size="sm"
											class="flex-1 gap-2"
											onclick={() =>
												handleAttendanceUpdate(subjectClassAllocation.id, user.id, false)}
										>
											<X class="h-4 w-4" />
											Absent
										</Button>
									</div>
								{:else}
									<div class="text-muted-foreground bg-muted rounded p-4 text-center text-sm">
										Student is away today and cannot be updated
									</div>
								{/if}
							</CardContent>
						</Card>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- No results messages -->
	{#if filteredAttendances.length === 0 && attendances.length > 0}
		<div class="text-muted-foreground py-8 text-center">
			No students found matching your search.
		</div>
	{:else if unmarkedAttendances.length === 0 && markedAttendances.length === 0 && attendances.length > 0}
		<div class="text-muted-foreground py-8 text-center">
			No students found matching your search.
		</div>
	{/if}
</div>
