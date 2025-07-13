<script lang="ts">
	import {
		type ColumnDef,
		type ColumnFiltersState,
		type SortingState,
		type VisibilityState,
		getCoreRowModel,
		getFilteredRowModel,
		getSortedRowModel
	} from '@tanstack/table-core';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		FlexRender,
		createSvelteTable,
		renderComponent
	} from '$lib/components/ui/data-table/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { convertToFullName } from '$lib/utils';
	import { invalidateAll } from '$app/navigation';

	const { data } = $props();
	const attendances = $derived(data.attendances || []);

	async function handleAttendanceToggle(
		subjectClassAllocationId: number,
		userId: string,
		currentDidAttend: boolean,
		wasAbsent: boolean
	) {
		if (wasAbsent) return;

		const formData = new FormData();
		formData.append('subjectClassAllocationId', subjectClassAllocationId.toString());
		formData.append('userId', userId);
		formData.append('didAttend', (!currentDidAttend).toString());

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

	const columns: ColumnDef<(typeof attendances)[number]>[] = [
		{
			accessorKey: 'user',
			header: 'Student Name',
			filterFn: 'includesString',
			size: 250,
			cell: ({ getValue }) => {
				const user = getValue() as any;
				return convertToFullName(user.firstName, user.middleName, user.lastName);
			}
		},
		{
			id: 'attendance',
			header: 'Present',
			size: 100,
			cell: ({ row }) => {
				const attendance = row.original.attendance;
				const user = row.original.user;
				const subjectClassAllocation = row.original.subjectClassAllocation;
				const isPresent = attendance?.didAttend || false;
				const wasAbsent = attendance?.wasAbsent || false;

				return renderComponent(Switch, {
					checked: isPresent,
					disabled: wasAbsent,
					onCheckedChange: () => {
						if (!wasAbsent) {
							handleAttendanceToggle(subjectClassAllocation.id, user.id, isPresent, wasAbsent);
						}
					}
				});
			}
		},
		{
			id: 'status',
			header: 'Status',
			size: 120,
			cell: ({ row }) => {
				const attendance = row.original.attendance;
				if (!attendance) {
					return 'Not recorded';
				}
				if (attendance.wasAbsent) {
					return 'Absent';
				}
				return attendance.didAttend ? 'Present' : 'Not present';
			}
		},
		{
			id: 'note',
			header: 'Note',
			size: 200,
			cell: ({ row }) => {
				const note = row.original.attendance?.note;
				return note || 'No comments';
			}
		}
	];

	let sorting = $state<SortingState>([]);
	let columnFilters = $state<ColumnFiltersState>([]);
	let columnVisibility = $state<VisibilityState>({});

	const table = createSvelteTable({
		get data() {
			return attendances;
		},
		columns,
		getRowId: (row) => `${row.user.id}-${row.subjectClassAllocation.id}`,
		state: {
			get sorting() {
				return sorting;
			},
			get columnVisibility() {
				return columnVisibility;
			},
			get columnFilters() {
				return columnFilters;
			}
		},
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: (updater) => {
			if (typeof updater === 'function') {
				sorting = updater(sorting);
			} else {
				sorting = updater;
			}
		},
		onColumnFiltersChange: (updater) => {
			if (typeof updater === 'function') {
				columnFilters = updater(columnFilters);
			} else {
				columnFilters = updater;
			}
		},
		onColumnVisibilityChange: (updater) => {
			if (typeof updater === 'function') {
				columnVisibility = updater(columnVisibility);
			} else {
				columnVisibility = updater;
			}
		}
	});
</script>

<div class="flex h-full flex-col space-y-2 p-8">
	<h1 class="text-3xl font-bold tracking-tight">Attendance</h1>

	{#if attendances.length === 0}
		<p class="text-muted-foreground">No students found for the current day.</p>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col">
			<div class="flex items-center py-4">
				<Input
					placeholder="Filter students..."
					value={(table.getColumn('user')?.getFilterValue() as string) ?? ''}
					oninput={(e) => table.getColumn('user')?.setFilterValue(e.currentTarget.value)}
					onchange={(e) => {
						table.getColumn('user')?.setFilterValue(e.currentTarget.value);
					}}
					class="max-w-sm"
				/>
			</div>
			<div class="flex flex-1 flex-col overflow-hidden rounded-md border">
				<Table.Root class="h-full">
					<Table.Header class="bg-background sticky top-0 z-10">
						{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
							<Table.Row>
								{#each headerGroup.headers as header (header.id)}
									<Table.Head class="[&:has([role=checkbox])]:pl-3">
										{#if !header.isPlaceholder}
											<FlexRender
												content={header.column.columnDef.header}
												context={header.getContext()}
											/>
										{/if}
									</Table.Head>
								{/each}
							</Table.Row>
						{/each}
					</Table.Header>
					<Table.Body class="overflow-auto">
						{#each table.getRowModel().rows as row (row.id)}
							<Table.Row data-row-id={row.id}>
								{#each row.getVisibleCells() as cell (cell.id)}
									<Table.Cell class="[&:has([role=checkbox])]:pl-3">
										<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
									</Table.Cell>
								{/each}
							</Table.Row>
						{:else}
							<Table.Row>
								<Table.Cell colspan={columns.length} class="h-24 text-center"
									>No students found.</Table.Cell
								>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
			<div class="flex items-center justify-end space-x-2 pt-4">
				<div class="text-muted-foreground flex-1 text-sm">
					{table.getFilteredRowModel().rows.filter((row) => row.original.attendance?.didAttend)
						.length} of
					{table.getFilteredRowModel().rows.length} student(s) present.
				</div>
			</div>
		</div>
	{/if}
</div>
