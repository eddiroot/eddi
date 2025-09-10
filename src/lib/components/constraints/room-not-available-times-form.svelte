<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash';

	interface Props {
		onSubmit: (values: Record<string, any>) => void;
		onCancel: () => void;
		initialValues?: Record<string, any>;
	}

	let { onSubmit, onCancel, initialValues = {} }: Props = $props();

	const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
	const HOURS = Array.from({ length: 10 }, (_, i) => i + 1);

	// Form state
	let weightPercentage = $state(initialValues.Weight_Percentage || 100);
	let room = $state(initialValues.Room || '');
	let notAvailableTimes = $state<Array<{ Day: string; Hour: number }>>(
		initialValues.Not_Available_Time || [{ Day: 'Monday', Hour: 1 }]
	);
	let comments = $state(initialValues.Comments || '');

	function addNotAvailableTime() {
		notAvailableTimes = [...notAvailableTimes, { Day: 'Monday', Hour: 1 }];
	}

	function removeNotAvailableTime(index: number) {
		notAvailableTimes = notAvailableTimes.filter((_, i) => i !== index);
	}

	function updateDay(index: number, day: string) {
		notAvailableTimes[index].Day = day;
	}

	function updateHour(index: number, hour: number) {
		notAvailableTimes[index].Hour = hour;
	}

	function handleSubmit() {
		const values = {
			Weight_Percentage: weightPercentage,
			Room: room,
			Number_of_Not_Available_Times: notAvailableTimes.length,
			Not_Available_Time: notAvailableTimes,
			Active: true,
			Comments: comments || null
		};
		onSubmit(values);
	}

	// Validation
	let isValid = $derived(
		room.trim() !== '' && 
		notAvailableTimes.length > 0 &&
		weightPercentage >= 1 && 
		weightPercentage <= 100
	);
</script>

<div class="space-y-6">
	<div class="space-y-4">
		<!-- Weight Percentage -->
		<div class="space-y-2">
			<Label for="weight">Weight Percentage (1-100)</Label>
			<Input
				id="weight"
				type="number"
				min="1"
				max="100"
				bind:value={weightPercentage}
				placeholder="100"
			/>
		</div>

		<!-- Room -->
		<div class="space-y-2">
			<Label for="room">Room *</Label>
			<Input
				id="room"
				bind:value={room}
				placeholder="e.g., Science Lab A, Room 101, Library"
				required
			/>
		</div>

		<!-- Not Available Times -->
		<div class="space-y-2">
			<Label>Not Available Times *</Label>
			<div class="space-y-3">
				{#each notAvailableTimes as time, index}
					<div class="flex gap-2 items-end">
						<div class="flex-1 space-y-1">
							<Label class="text-xs">Day</Label>
							<select 
								bind:value={time.Day}
								class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
							>
								{#each DAYS as day}
									<option value={day}>{day}</option>
								{/each}
							</select>
						</div>
						
						<div class="flex-1 space-y-1">
							<Label class="text-xs">Period</Label>
							<select 
								bind:value={time.Hour}
								class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
							>
								{#each HOURS as hour}
									<option value={hour}>Period {hour}</option>
								{/each}
							</select>
						</div>

						{#if notAvailableTimes.length > 1}
							<Button
								variant="outline"
								size="sm"
								onclick={() => removeNotAvailableTime(index)}
								type="button"
							>
								<TrashIcon class="h-4 w-4" />
							</Button>
						{/if}
					</div>
				{/each}
				
				<Button
					variant="outline"
					size="sm"
					onclick={addNotAvailableTime}
					type="button"
					class="w-full"
				>
					<PlusIcon class="h-4 w-4 mr-2" />
					Add Time Slot
				</Button>
			</div>
			<p class="text-sm text-muted-foreground">
				Specify when this room is not available for scheduling (e.g., maintenance, other bookings).
			</p>
		</div>

		<!-- Comments -->
		<div class="space-y-2">
			<Label for="comments">Comments (Optional)</Label>
			<Textarea
				id="comments"
				bind:value={comments}
				placeholder="Reason for unavailability (e.g., maintenance, meetings)..."
				rows={3}
			/>
		</div>
	</div>

	<!-- Form Actions -->
	<div class="flex justify-end gap-3">
		<Button variant="outline" onclick={onCancel}>
			Cancel
		</Button>
		<Button onclick={handleSubmit} disabled={!isValid}>
			Add Constraint
		</Button>
	</div>
</div>
