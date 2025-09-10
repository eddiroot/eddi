<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';

	interface Props {
		onSubmit: (values: Record<string, any>) => void;
		onCancel: () => void;
		initialValues?: Record<string, any>;
	}

	let { onSubmit, onCancel, initialValues = {} }: Props = $props();

	// Form state
	let weightPercentage = $state(initialValues.Weight_Percentage || 100);
	let maxGaps = $state(initialValues.Max_Gaps || 3);
	let comments = $state(initialValues.Comments || '');

	function handleSubmit() {
		const values = {
			Weight_Percentage: weightPercentage,
			Max_Gaps: maxGaps,
			Active: true,
			Comments: comments || null
		};
		onSubmit(values);
	}

	// Validation
	let isValid = $derived(
		maxGaps >= 0 && 
		maxGaps <= 20 &&
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

		<!-- Max Gaps -->
		<div class="space-y-2">
			<Label for="maxGaps">Maximum Gaps Per Week (0-20)</Label>
			<Input
				id="maxGaps"
				type="number"
				min="0"
				max="20"
				bind:value={maxGaps}
				placeholder="3"
			/>
			<p class="text-sm text-muted-foreground">
				Maximum number of free periods (gaps) teachers can have in their weekly schedule. Lower values create more compact schedules.
			</p>
		</div>

		<!-- Comments -->
		<div class="space-y-2">
			<Label for="comments">Comments (Optional)</Label>
			<Textarea
				id="comments"
				bind:value={comments}
				placeholder="Additional notes about gap constraints..."
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
