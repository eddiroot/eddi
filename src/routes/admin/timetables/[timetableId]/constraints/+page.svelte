<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import XIcon from '@lucide/svelte/icons/x';
	import EditIcon from '@lucide/svelte/icons/edit';
	import CheckIcon from '@lucide/svelte/icons/check';
	import type { constraintTypeEnum } from '$lib/enums';

	interface Constraint {
		name: string;
		description: string;
		type: constraintTypeEnum;
		active: boolean;
		parameterSchema: Record<string, unknown>;
		exampleParameters: Record<string, unknown>;
	}

	let { data } = $props();
	let { user, timeConstraints, spaceConstraints, timetableId } = data;

	console.log('User:', user);
	console.log('Time Constraints:', timeConstraints);
	console.log('Space Constraints:', spaceConstraints);
	console.log('Timetable ID:', timetableId);

	// // Mock data based on constraints.json structure
	// let timeConstraints = $state([
	// 	{
	// 		id: 1,
	// 		name: 'Basic Compulsory Time',
	// 		type: 'ConstraintBasicCompulsoryTime',
	// 		enabled: true,
	// 		parameters: {
	// 			Weight_Percentage: '100',
	// 			Active: 'true',
	// 			Comments: null
	// 		}
	// 	},
	// 	{
	// 		id: 2,
	// 		name: 'Students Early Max Beginnings At Second Hour',
	// 		type: 'ConstraintStudentsEarlyMaxBeginningsAtSecondHour',
	// 		enabled: true,
	// 		parameters: {
	// 			Weight_Percentage: '100',
	// 			Max_Beginnings_At_Second_Hour: '0',
	// 			Active: 'true',
	// 			Comments: null
	// 		}
	// 	},
	// 	{
	// 		id: 3,
	// 		name: 'Students Max Gaps Per Week',
	// 		type: 'ConstraintStudentsMaxGapsPerWeek',
	// 		enabled: true,
	// 		parameters: {
	// 			Weight_Percentage: '100',
	// 			Max_Gaps: '0',
	// 			Active: 'true',
	// 			Comments: null
	// 		}
	// 	},
	// 	{
	// 		id: 4,
	// 		name: 'Min Days Between Activities',
	// 		type: 'ConstraintMinDaysBetweenActivities',
	// 		enabled: true,
	// 		parameters: {
	// 			Weight_Percentage: '95',
	// 			Consecutive_If_Same_Day: 'true',
	// 			Number_of_Activities: '4',
	// 			Activity_Ids: ['21', '22', '23', '24'],
	// 			MinDays: '1',
	// 			Active: 'true',
	// 			Comments: null
	// 		}
	// 	},
	// 	{
	// 		id: 5,
	// 		name: 'Teachers Max Gaps Per Week',
	// 		type: 'ConstraintTeachersMaxGapsPerWeek',
	// 		enabled: true,
	// 		parameters: {
	// 			Weight_Percentage: '100',
	// 			Max_Gaps: '3',
	// 			Active: 'true',
	// 			Comments: null
	// 		}
	// 	}
	// ]);

	// let spaceConstraints = $state([
	// 	{
	// 		id: 6,
	// 		name: 'Teacher Not Available Times - Sepp',
	// 		type: 'ConstraintTeacherNotAvailableTimes',
	// 		enabled: true,
	// 		parameters: {
	// 			Weight_Percentage: '100',
	// 			Teacher: 'Sepp',
	// 			Number_of_Not_Available_Times: '6',
	// 			Not_Available_Times: [
	// 				{ Day: 'Monday', Hour: '1' },
	// 				{ Day: 'Monday', Hour: '2' },
	// 				{ Day: 'Monday', Hour: '3' },
	// 				{ Day: 'Monday', Hour: '4' },
	// 				{ Day: 'Monday', Hour: '5' },
	// 				{ Day: 'Monday', Hour: '6' }
	// 			],
	// 			Active: 'true',
	// 			Comments: null
	// 		}
	// 	},
	// 	{
	// 		id: 7,
	// 		name: 'Teacher Max Days Per Week - Julia',
	// 		type: 'ConstraintTeacherMaxDaysPerWeek',
	// 		enabled: true,
	// 		parameters: {
	// 			Weight_Percentage: '100',
	// 			Teacher_Name: 'Julia',
	// 			Max_Days_Per_Week: '4',
	// 			Active: 'true',
	// 			Comments: null
	// 		}
	// 	},
	// 	{
	// 		id: 8,
	// 		name: 'Activities Preferred Starting Times',
	// 		type: 'ConstraintActivitiesPreferredStartingTimes',
	// 		enabled: true,
	// 		parameters: {
	// 			Weight_Percentage: '100',
	// 			Teacher_Name: null,
	// 			Students_Name: null,
	// 			Subject_Name: null,
	// 			Activity_Tag_Name: '1,3,5',
	// 			Duration: null,
	// 			Number_of_Preferred_Starting_Times: '15',
	// 			Preferred_Starting_Time: '\n\t\t',
	// 			Active: 'true',
	// 			Comments: null
	// 		}
	// 	},
	// 	{
	// 		id: 9,
	// 		name: 'Activity Preferred Starting Time - Specific',
	// 		type: 'ConstraintActivityPreferredStartingTime',
	// 		enabled: true,
	// 		parameters: {
	// 			Weight_Percentage: '100',
	// 			Activity_Ids: ['478'],
	// 			Preferred_Day: 'Thursday',
	// 			Preferred_Hour: '5',
	// 			Permanently_Locked: 'true',
	// 			Active: 'true',
	// 			Comments: null
	// 		}
	// 	}
	// ]);

	// Modal state
	let editModalOpen = $state(false);
	let editingConstraint = $state<Constraint | null>(null);
	let tempParameters = $state<Record<string, any>>({});

	function openEditModal(constraint: Constraint) {
		editingConstraint = constraint;
		tempParameters = { ...constraint.parameterSchema };
		editModalOpen = true;
	}

	function closeEditModal() {
		editModalOpen = false;
		editingConstraint = null;
		tempParameters = {};
	}

	function saveConstraint() {
		if (editingConstraint) {
			editingConstraint.parameterSchema = { ...tempParameters };
		}
		closeEditModal();
	}

	function toggleConstraint(constraint: Constraint) {
		constraint.active = !constraint.active;
	}

	function formatParameterKey(key: string): string {
		return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
	}

	function formatParameterValue(value: any): string {
		if (Array.isArray(value)) {
			return value.join(', ');
		}
		if (typeof value === 'object' && value !== null) {
			return JSON.stringify(value);
		}
		return String(value);
	}
</script>

<div class="space-y-8">
	<h1 class="text-2xl leading-tight font-bold">Timetabling Constraints</h1>

	<!-- Time Constraints Section -->
	<div class="space-y-4">
		<h2 class="text-2xl leading-tight font-bold">Time Constraints</h2>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="overflow-x-auto">
					<table class="w-full border-collapse">
						<thead>
							<tr class="border-b">
								<th class="px-4 py-2 text-left">Constraint Name</th>
								<th class="px-4 py-2 text-left">Enabled</th>
								<th class="px-4 py-2 text-left">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each timeConstraints as constraint}
								<tr class="hover:bg-muted/50 border-b">
									<td class="px-4 py-2 font-medium">{constraint.name}</td>
									<td class="px-4 py-2">
										<Checkbox
											checked={constraint.enabled}
											onCheckedChange={() => toggleConstraint(constraint)}
										/>
									</td>
									<td class="px-4 py-2">
										<Button variant="ghost" size="sm" onclick={() => openEditModal(constraint)}>
											<EditIcon class="h-4 w-4" />
										</Button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Space Constraints Section -->
	<div class="space-y-4">
		<h2 class="text-2xl leading-tight font-bold">Space Constraints</h2>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="overflow-x-auto">
					<table class="w-full border-collapse">
						<thead>
							<tr class="border-b">
								<th class="px-4 py-2 text-left">Constraint Name</th>
								<th class="px-4 py-2 text-left">Enabled</th>
								<th class="px-4 py-2 text-left">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each spaceConstraints as constraint}
								<tr class="hover:bg-muted/50 border-b">
									<td class="px-4 py-2 font-medium">{constraint.name}</td>
									<td class="px-4 py-2">
										<Checkbox
											checked={constraint.active}
											onCheckedChange={() => toggleConstraint(constraint)}
										/>
									</td>
									<td class="px-4 py-2">
										<Button variant="ghost" size="sm" onclick={() => openEditModal(constraint)}>
											<EditIcon class="h-4 w-4" />
										</Button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>
<!-- Edit Modal -->
{#if editModalOpen && editingConstraint}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<div class="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-xl font-semibold">Edit Constraint: {editingConstraint.name}</h3>
				<Button variant="ghost" size="sm" onclick={closeEditModal}>
					<XIcon class="h-4 w-4" />
				</Button>
			</div>

			<div class="space-y-4">
				{#each Object.entries(tempParameters) as [key, value]}
					<div class="space-y-2">
						<Label for={key}>{formatParameterKey(key)}</Label>
						{#if Array.isArray(value)}
							<Input
								id={key}
								bind:value={tempParameters[key]}
								placeholder={`Enter ${formatParameterKey(key).toLowerCase()}`}
								readonly={true}
								class="bg-gray-50"
							/>
							<p class="text-sm text-gray-500">Array values: {formatParameterValue(value)}</p>
						{:else if typeof value === 'object' && value !== null}
							<Input
								id={key}
								bind:value={tempParameters[key]}
								placeholder={`Enter ${formatParameterKey(key).toLowerCase()}`}
								readonly={true}
								class="bg-gray-50"
							/>
							<p class="text-sm text-gray-500">Object value: {formatParameterValue(value)}</p>
						{:else}
							<Input
								id={key}
								bind:value={tempParameters[key]}
								placeholder={`Enter ${formatParameterKey(key).toLowerCase()}`}
							/>
						{/if}
					</div>
				{/each}
			</div>

			<div class="mt-6 flex justify-end space-x-2">
				<Button variant="outline" onclick={closeEditModal}>Cancel</Button>
				<Button onclick={saveConstraint}>
					<CheckIcon class="mr-2 h-4 w-4" />
					Save
				</Button>
			</div>
		</div>
	</div>
{/if}
