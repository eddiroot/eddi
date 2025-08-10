<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Badge, type BadgeVariant } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { convertToFullName, formatTimestampAsDate, formatTimestampAsTime } from '$lib/utils';
	import { ArrowLeft, Calendar, Clock, MapPin, FileText, Check, X, Minus } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import type { Component } from 'svelte';

	const { data } = $props();
	const student = $derived(data.student);
	const classDetails = $derived(data.classDetails);
	const attendanceHistory = $derived(data.attendanceHistory || []);

	const studentName = $derived(
		convertToFullName(student.firstName, student.middleName, student.lastName)
	);
	const subjectName = $derived(classDetails.subject.name);
	const className = $derived(classDetails.subjectOfferingClass.name);

	function getAttendanceStatus(attendance: any): {
		status: string;
		variant: BadgeVariant;
		icon: Component<any>;
	} {
		if (!attendance) {
			return { status: 'Not Recorded', variant: 'outline', icon: Minus };
		}
		if (attendance.wasAbsent) {
			return { status: 'Away', variant: 'secondary', icon: Minus };
		}
		if (attendance.didAttend === true) {
			return { status: 'Present', variant: 'success', icon: Check };
		}
		if (attendance.didAttend === false) {
			return { status: 'Absent', variant: 'destructive', icon: X };
		}
		return { status: 'Not Recorded', variant: 'outline', icon: Minus };
	}

	function calculateAttendanceStats() {
		const total = attendanceHistory.length;
		const recorded = attendanceHistory.filter((record) => record.attendance !== null).length;
		const present = attendanceHistory.filter(
			(record) => record.attendance?.didAttend === true
		).length;
		const absent = attendanceHistory.filter(
			(record) => record.attendance?.didAttend === false && !record.attendance?.wasAbsent
		).length;
		const away = attendanceHistory.filter((record) => record.attendance?.wasAbsent === true).length;

		const attendanceRate = recorded > 0 ? Math.round((present / recorded) * 100) : 0;

		return { total, recorded, present, absent, away, attendanceRate };
	}

	const stats = $derived(calculateAttendanceStats());

	function handleGoBack() {
		goto(
			`/subjects/${classDetails.subjectOffering.id}/class/${classDetails.subjectOfferingClass.id}/attendance`
		);
	}
</script>

<div class="flex h-full flex-col space-y-6 p-8">
	<!-- Header -->
	<div class="flex flex-col space-y-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-4">
				<Avatar.Root class="h-16 w-16">
					<Avatar.Image src={student.avatarUrl} alt={studentName} />
					<Avatar.Fallback class="text-lg">
						{student.firstName.charAt(0)}{student.lastName.charAt(0)}
					</Avatar.Fallback>
				</Avatar.Root>

				<div>
					<h1 class="text-3xl font-bold tracking-tight">{studentName}</h1>
					<p class="text-muted-foreground text-lg">
						{subjectName} - {className}
					</p>
				</div>
			</div>

			<Button variant="ghost" size="sm" onclick={handleGoBack}>
				<ArrowLeft />
				Back to Class Attendance
			</Button>
		</div>
	</div>

	<!-- Stats Cards -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Total Classes</Card.Title>
				<Calendar />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{stats.total}</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Attendance Rate</Card.Title>
				<div class="bg-success/10 rounded-full p-1">
					<Check class="text-success h-4 w-4" />
				</div>
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{stats.attendanceRate}%</div>
				<p class="text-muted-foreground text-xs">
					{stats.present} of {stats.recorded} recorded
				</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Present</Card.Title>
				<div class="bg-success/10 rounded-full p-1">
					<Check class="text-success h-4 w-4" />
				</div>
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{stats.present}</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Absent</Card.Title>
				<div class="bg-destructive/10 rounded-full p-1">
					<X class="text-destructive h-4 w-4" />
				</div>
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{stats.absent}</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Away</Card.Title>
				<div class="bg-secondary/10 rounded-full p-1">
					<Minus class="text-secondary h-4 w-4" />
				</div>
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{stats.away}</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Attendance History Table -->
	<div class="flex min-h-0 flex-1 flex-col">
		<h2 class="mb-4 text-xl font-semibold">Attendance History</h2>
		<div class="flex flex-1 flex-col overflow-hidden rounded-md border">
			<Table.Root class="h-full">
				<Table.Header class="bg-background sticky top-0 z-10">
					<Table.Row>
						<Table.Head>Date</Table.Head>
						<Table.Head>Time</Table.Head>
						<Table.Head>Location</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head>Notes</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body class="overflow-auto">
					{#each attendanceHistory as record}
						{@const status = getAttendanceStatus(record.attendance)}
						<Table.Row>
							<Table.Cell class="font-medium">
								{formatTimestampAsDate(record.subjectClassAllocation.startTimestamp)}
							</Table.Cell>
							<Table.Cell>
								<div class="flex items-center gap-1">
									<Clock class="text-muted-foreground h-4 w-4" />
									{formatTimestampAsTime(record.subjectClassAllocation.startTimestamp)} -
									{formatTimestampAsTime(record.subjectClassAllocation.endTimestamp)}
								</div>
							</Table.Cell>
							<Table.Cell>
								{#if record.schoolSpace}
									<div class="flex items-center gap-1">
										<MapPin class="text-muted-foreground h-4 w-4" />
										{record.schoolSpace.name}
									</div>
								{:else}
									<span class="text-muted-foreground">Not specified</span>
								{/if}
							</Table.Cell>
							<Table.Cell>
								<Badge variant={status.variant} class="flex items-center gap-1">
									<status.icon class="h-3 w-3" />
									{status.status}
								</Badge>
							</Table.Cell>
							<Table.Cell>
								{#if record.attendance?.attendanceNote || record.attendance?.behaviourNote}
									<div class="flex flex-col gap-1">
										{#if record.attendance.attendanceNote}
											<div class="flex items-center gap-1 text-sm">
												<FileText class="text-muted-foreground h-3 w-3" />
												{record.attendance.attendanceNote}
											</div>
										{/if}
										{#if record.attendance.behaviourNote}
											<div class="text-destructive flex items-center gap-1 text-sm">
												<FileText class="text-destructive h-3 w-3" />
												{record.attendance.behaviourNote}
											</div>
										{/if}
									</div>
								{:else}
									<span class="text-muted-foreground">-</span>
								{/if}
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={5} class="h-24 text-center"
								>No attendance records found for this student in this class.</Table.Cell
							>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	</div>
</div>
