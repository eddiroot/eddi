<script lang="ts">
	import { flip } from 'svelte/animate';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { convertToFullName } from '$lib/utils';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { attendanceSchema } from './schema.js';
	import StudentAttendanceListItem from './components/StudentAttendanceListItem.svelte';

	const { data } = $props();
	const attendances = $derived(data.attendances || []);

	let searchTerm = $state('');

	const form = superForm(data.form!, {
		validators: zodClient(attendanceSchema)
	});
	const { enhance } = form;

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
</script>

<div class="flex h-full flex-col space-y-6 p-8">
	<div class="flex flex-col space-y-4">
		<h1 class="text-3xl font-bold tracking-tight">Attendance</h1>
		{#if attendances.length >= 0}
			<Input placeholder="Search students..." bind:value={searchTerm} class="max-w-sm" />
		{/if}
	</div>

	<!-- Unmarked Attendance Section -->
	{#if unmarkedAttendances.length > 0}
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-foreground text-xl font-semibold">
					Unrecorded ({unmarkedAttendances.length})
				</h2>
				<Badge variant="secondary" class="text-sm">
					{unmarkedAttendances.length} remaining
				</Badge>
			</div>
			<div class="bg-card border-border overflow-hidden rounded-lg border">
				{#each unmarkedAttendances as attendanceRecord (attendanceRecord.user.id)}
					<div animate:flip={{ duration: 400 }}>
						<StudentAttendanceListItem {attendanceRecord} {form} {enhance} type="unmarked" />
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
					Recorded ({markedAttendances.length})
				</h2>
				<div class="text-muted-foreground text-sm">
					{markedAttendances.filter((a) => a.attendance?.didAttend === true).length} present,
					{markedAttendances.filter(
						(a) => a.attendance?.didAttend === false && !a.attendance?.wasAbsent
					).length} absent,
					{markedAttendances.filter((a) => a.attendance?.wasAbsent).length} away today
				</div>
			</div>
			<div class="bg-card border-border overflow-hidden rounded-lg border">
				{#each markedAttendances as attendanceRecord (attendanceRecord.user.id)}
					<div animate:flip={{ duration: 400 }}>
						<StudentAttendanceListItem {attendanceRecord} {form} {enhance} type="marked" />
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
