<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import * as Select from '$lib/components/ui/select';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash';

	interface Props {
		onSubmit: (values: Record<string, any>) => void;
		onCancel: () => void;
		initialValues?: Record<string, any>;
	}

	let { onSubmit, onCancel, initialValues = {} }: Props = $props();

	// Form state
	let weightPercentage = $state(initialValues.Weight_Percentage || 100);
	let subject = $state(initialValues.Subject || '');
	let numberOfRooms = $state(initialValues.Number_of_Preferred_Rooms || 1);
	let preferredRooms = $state<string[]>(initialValues.Preferred_Room || ['']);
	let comments = $state(initialValues.Comments || '');

	// Update rooms array when numberOfRooms changes
	$effect(() => {
		if (numberOfRooms > preferredRooms.length) {
			// Add more rooms
			const diff = numberOfRooms - preferredRooms.length;
			preferredRooms = [...preferredRooms, ...Array(diff).fill('')];
		} else if (numberOfRooms < preferredRooms.length) {
			// Remove excess rooms
			preferredRooms = preferredRooms.slice(0, numberOfRooms);
		}
	});

	function addRoom() {
		preferredRooms = [...preferredRooms, ''];
		numberOfRooms = preferredRooms.length;
	}

	function removeRoom(index: number) {
		preferredRooms = preferredRooms.filter((_, i) => i !== index);
		numberOfRooms = preferredRooms.length;
	}

	function handleSubmit() {
		const values = {
			Weight_Percentage: weightPercentage,
			Subject: subject,
			Number_of_Preferred_Rooms: numberOfRooms,
			Preferred_Room: preferredRooms.filter(room => room.trim() !== ''),
			Active: true,
			Comments: comments || null
		};
		onSubmit(values);
	}

	// Validation
	let isValid = $derived(
		subject.trim() !== '' && 
		preferredRooms.some(room => room.trim() !== '') &&
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

		<!-- Subject -->
		<div class="space-y-2">
			<Label for="subject">Subject *</Label>
			<Input
				id="subject"
				bind:value={subject}
				placeholder="e.g., Mathematics, Science, English"
				required
			/>
		</div>

		<!-- Preferred Rooms -->
		<div class="space-y-2">
			<Label>Preferred Rooms *</Label>
			<div class="space-y-3">
				{#each preferredRooms as room, index}
					<div class="flex gap-2">
						<Input
							bind:value={preferredRooms[index]}
							placeholder="Room name"
							class="flex-1"
						/>
						{#if preferredRooms.length > 1}
							<Button
								variant="outline"
								size="sm"
								onclick={() => removeRoom(index)}
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
					onclick={addRoom}
					type="button"
					class="w-full"
				>
					<PlusIcon class="h-4 w-4 mr-2" />
					Add Room
				</Button>
			</div>
			<p class="text-sm text-muted-foreground">
				Add multiple rooms that can be used for this subject. The system will prefer these rooms when scheduling.
			</p>
		</div>

		<!-- Comments -->
		<div class="space-y-2">
			<Label for="comments">Comments (Optional)</Label>
			<Textarea
				id="comments"
				bind:value={comments}
				placeholder="Additional notes or requirements..."
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
