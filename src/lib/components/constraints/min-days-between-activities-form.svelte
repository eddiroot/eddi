<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash';

	interface Props {
		onSubmit: (values: Record<string, any>) => void;
		onCancel: () => void;
		initialValues?: Record<string, any>;
	}

	let { onSubmit, onCancel, initialValues = {} }: Props = $props();

	// Form state
	let weightPercentage = $state(initialValues.Weight_Percentage || 95);
	let consecutiveIfSameDay = $state(initialValues.Consecutive_If_Same_Day ?? true);
	let minDays = $state(initialValues.MinDays || 1);
	let activityIds = $state<number[]>(initialValues.Activity_Id || []);
	let comments = $state(initialValues.Comments || '');

	// New activity ID input
	let newActivityId = $state('');

	function addActivityId() {
		const id = parseInt(newActivityId);
		if (!isNaN(id) && !activityIds.includes(id)) {
			activityIds = [...activityIds, id];
			newActivityId = '';
		}
	}

	function removeActivityId(index: number) {
		activityIds = activityIds.filter((_, i) => i !== index);
	}

	function handleSubmit() {
		const values = {
			Weight_Percentage: weightPercentage,
			Consecutive_If_Same_Day: consecutiveIfSameDay,
			MinDays: minDays,
			Number_of_Activities: activityIds.length,
			Activity_Id: activityIds,
			Active: true,
			Comments: comments || null
		};
		onSubmit(values);
	}

	// Validation
	let isValid = $derived(
		activityIds.length >= 2 && 
		minDays >= 1 && 
		minDays <= 6 &&
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
				placeholder="95"
			/>
		</div>

		<!-- Minimum Days -->
		<div class="space-y-2">
			<Label for="minDays">Minimum Days Between Activities (1-6)</Label>
			<Input
				id="minDays"
				type="number"
				min="1"
				max="6"
				bind:value={minDays}
				placeholder="1"
			/>
			<p class="text-sm text-muted-foreground">
				Minimum number of days that must pass between the specified activities.
			</p>
		</div>

		<!-- Consecutive If Same Day -->
		<div class="flex items-center space-x-2">
			<Checkbox 
				id="consecutive" 
				bind:checked={consecutiveIfSameDay}
			/>
			<Label for="consecutive" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
				Consecutive if same day
			</Label>
		</div>
		<p class="text-sm text-muted-foreground ml-6">
			If activities are scheduled on the same day, they should be consecutive periods.
		</p>

		<!-- Activity IDs -->
		<div class="space-y-2">
			<Label>Activity IDs * (minimum 2 required)</Label>
			<div class="space-y-3">
				<!-- Existing Activity IDs -->
				{#if activityIds.length > 0}
					<div class="space-y-2">
						{#each activityIds as id, index}
							<div class="flex gap-2 items-center">
								<Input
									value={id}
									readonly
									class="flex-1"
								/>
								<Button
									variant="outline"
									size="sm"
									onclick={() => removeActivityId(index)}
									type="button"
								>
									<TrashIcon class="h-4 w-4" />
								</Button>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Add new Activity ID -->
				<div class="flex gap-2">
					<Input
						bind:value={newActivityId}
						placeholder="Enter activity ID"
						type="number"
						class="flex-1"
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								addActivityId();
							}
						}}
					/>
					<Button
						variant="outline"
						size="sm"
						onclick={addActivityId}
						type="button"
						disabled={!newActivityId || isNaN(parseInt(newActivityId))}
					>
						<PlusIcon class="h-4 w-4" />
					</Button>
				</div>
			</div>
			<p class="text-sm text-muted-foreground">
				Specify the activities that should be spaced apart. You need at least 2 activities for this constraint to work.
			</p>
		</div>

		<!-- Comments -->
		<div class="space-y-2">
			<Label for="comments">Comments (Optional)</Label>
			<Textarea
				id="comments"
				bind:value={comments}
				placeholder="Reason for spacing activities (e.g., student fatigue, preparation time)..."
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
