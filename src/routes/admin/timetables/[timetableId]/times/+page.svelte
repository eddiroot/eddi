<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as Form from '$lib/components/ui/form';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { days, formatTime } from '$lib/utils.js';
	import { updateDaysSchema, addPeriodSchema, deletePeriodSchema } from './schema.js';

	let { data } = $props();

	const updateDaysForm = superForm(data.updateDaysForm, {
		validators: zod4(updateDaysSchema),
		resetForm: false
	});
	const { form: updateDaysData, enhance: updateDaysEnhance } = updateDaysForm;
	let updateDaysFormElement: HTMLFormElement;

	const addPeriodForm = superForm(data.addPeriodForm, {
		validators: zod4(addPeriodSchema),
		resetForm: true
	});
	const { form: addPeriodData, enhance: addPeriodEnhance, errors: addPeriodErrors } = addPeriodForm;

	const deletePeriodForm = superForm(data.deletePeriodForm, {
		validators: zod4(deletePeriodSchema)
	});
	const { enhance: deletePeriodEnhance } = deletePeriodForm;
</script>

<div class="space-y-8">
	<form
		method="POST"
		bind:this={updateDaysFormElement}
		action="?/updateDays"
		class="space-y-4"
		use:updateDaysEnhance
	>
		<h2 class="text-2xl leading-tight font-bold">Days</h2>
		<Form.Field form={updateDaysForm} name="selectedDays">
			<ol class="grid grid-cols-5 gap-2">
				{#each days as day}
					{@const isSelected = $updateDaysData.selectedDays.includes(day.number)}
					{@const canUncheck = $updateDaysData.selectedDays.length > 1 || !isSelected}
					<li>
						<Form.Control>
							{#snippet children({ props })}
								<input
									{...props}
									type="checkbox"
									id={day.number.toString()}
									name="selectedDays"
									value={day.number}
									class="peer hidden"
									bind:group={$updateDaysData.selectedDays}
									disabled={!canUncheck}
									onchange={() => {
										updateDaysFormElement.requestSubmit();
									}}
								/>
							{/snippet}
						</Form.Control>
						<label
							for={day.number.toString()}
							class="border-border peer-checked:border-primary peer-checked:bg-primary/10 inline-flex w-full cursor-pointer items-center justify-center rounded-lg border-2 p-5 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
							class:cursor-not-allowed={!canUncheck}
						>
							<span class="text-xl font-bold">{day.name}</span>
						</label>
					</li>
				{/each}
			</ol>
			<Form.FieldErrors />
		</Form.Field>
	</form>

	<div class="space-y-4">
		<h2 class="text-2xl leading-tight font-bold">Periods</h2>
		<form method="POST" action="?/updatePeriods" class="space-y-4" use:addPeriodEnhance>
			<div class="flex flex-row gap-2">
				<Form.Field form={addPeriodForm} name="startTime">
					<Form.Control>
						{#snippet children({ props })}
							<Input
								{...props}
								type="time"
								class="w-32"
								placeholder="Start time"
								bind:value={$addPeriodData.startTime}
							/>
						{/snippet}
					</Form.Control>
				</Form.Field>
				<Form.Field form={addPeriodForm} name="endTime">
					<Form.Control>
						{#snippet children({ props })}
							<Input
								{...props}
								type="time"
								class="w-32"
								placeholder="End time"
								bind:value={$addPeriodData.endTime}
							/>
						{/snippet}
					</Form.Control>
				</Form.Field>
				<Button type="submit"><PlusIcon />Add</Button>
			</div>

			<!-- Display validation errors -->
			<div class="space-y-1">
				{#if $addPeriodErrors.startTime}
					<div class="text-destructive text-sm">{$addPeriodErrors.startTime}</div>
				{/if}
				{#if $addPeriodErrors.endTime}
					<div class="text-destructive text-sm">{$addPeriodErrors.endTime}</div>
				{/if}
			</div>
		</form>

		{#if data.periods.length === 0}
			<p class="text-muted-foreground text-sm">No periods defined yet. Add a period above.</p>
		{:else}
			<ol class="space-y-2">
				{#each data.periods as period}
					<li
						class="border-border bg-card hover:border-primary hover:bg-primary/5 flex min-h-10 w-full items-center justify-between rounded-lg border-2 px-4 py-3 transition-colors"
					>
						<span class="font-semibold">
							{formatTime(period.startTime)} - {formatTime(period.endTime)}
						</span>
						{#if data.periods.length > 1}
							<form method="POST" action="?/deletePeriod" use:deletePeriodEnhance class="ml-2">
								<input type="hidden" name="periodId" value={period.id} />
								<Button
									type="submit"
									variant="ghost"
									size="sm"
									class="text-destructive hover:text-destructive"
								>
									<TrashIcon class="h-4 w-4" />
								</Button>
							</form>
						{/if}
					</li>
				{/each}
			</ol>
		{/if}

		{#if data.periods.length === 1}
			<p class="text-muted-foreground text-sm">
				At least one period is required. Add more periods above or delete periods when you have more
				than one.
			</p>
		{/if}
	</div>
</div>
