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
	let comments = $state(initialValues.Comments || '');

	function handleSubmit() {
		const values = {
			Weight_Percentage: weightPercentage,
			Active: true,
			Comments: comments || null
		};
		onSubmit(values);
	}

	// Validation
	let isValid = $derived(
		weightPercentage >= 1 && 
		weightPercentage <= 100
	);
</script>

<div class="space-y-6">
	<div class="space-y-4">
		<div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
			<h3 class="font-semibold text-blue-900 mb-2">Mandatory Constraint</h3>
			<p class="text-sm text-blue-800">
				This constraint ensures all activities are assigned to appropriate spaces. 
				It is required for the timetabling system to function properly.
			</p>
		</div>

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
			<p class="text-sm text-muted-foreground">
				For mandatory constraints, this should typically be set to 100%.
			</p>
		</div>

		<!-- Comments -->
		<div class="space-y-2">
			<Label for="comments">Comments (Optional)</Label>
			<Textarea
				id="comments"
				bind:value={comments}
				placeholder="Additional notes about this mandatory constraint..."
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
