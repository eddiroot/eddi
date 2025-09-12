<script lang="ts">
import * as Popover from '$lib/components/ui/popover';
import Calendar from '$lib/components/ui/calendar/calendar.svelte';
import { getLocalTimeZone, type DateValue, CalendarDate, today } from '@internationalized/date';
import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
import { Switch } from '$lib/components/ui/switch';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();

// Form state - restore from form data if validation failed, or use existing config
let wholeSchool = $state(
	form?.formData?.wholeSchool ?? 
	data.existingConfig?.wholeSchool ?? 
	true
);
let yearLevels = $state<string[]>(
	form?.formData?.yearLevels ?? 
	(Array.isArray(data.existingConfig?.yearLevels) ? data.existingConfig.yearLevels : [])
);
let selectedDates = $state<DateValue[]>(
	form?.formData?.selectedDates ? 
		form.formData.selectedDates.map((dateStr: string) => {
			const [year, month, day] = dateStr.split('-').map(Number);
			return new CalendarDate(year, month, day);
		}) : 
	Array.isArray(data.existingConfig?.interviewDates) ?
		data.existingConfig.interviewDates.map((dateStr: string) => {
			const [year, month, day] = dateStr.split('-').map(Number);
			return new CalendarDate(year, month, day);
		}) : []
);
let dateTimeRanges = $state<Record<string, { start: string; end: string; breaks: { start: string; end: string }[] }>>(
	form?.formData?.dateTimeRanges ?? 
	(typeof data.existingConfig?.dateTimeRanges === 'string' ? JSON.parse(data.existingConfig.dateTimeRanges) : {})
);
let slotGenerationMode = $state<'teacher' | 'class'>((
	form?.formData?.slotGenerationMode as 'teacher' | 'class'
) ?? (
	data.existingConfig?.slotGenerationMode as 'teacher' | 'class'
) ?? 'teacher');
let duration = $state(
	form?.formData?.duration ?? 
	data.existingConfig?.durationMinutes ?? 
	15
);
let autoAssign = $state(
	form?.formData?.autoAssign ?? 
	data.existingConfig?.autoAssign ?? 
	true
);
let calendarOpen = $state(false);

// Validation errors
const errors = $derived(form?.errors ?? {});

const currentDate = today(getLocalTimeZone());
function toIsoDate(value: DateValue): string {
	return value.toString();
}
function formatSelectedDates(): string {
	if (selectedDates.length === 0) return "Select dates";
	if (selectedDates.length === 1) return selectedDates[0].toDate(getLocalTimeZone()).toLocaleDateString();
	return `${selectedDates.length} dates selected (click to edit)`;
}
function addBreakForDate(date: string) {
	if (dateTimeRanges[date]) {
		dateTimeRanges[date].breaks = [...dateTimeRanges[date].breaks, { start: '18:30', end: '19:00' }];
	}
}
function removeBreakForDate(date: string, breakIndex: number) {
	if (dateTimeRanges[date]) {
		dateTimeRanges[date].breaks = dateTimeRanges[date].breaks.filter((_, i) => i !== breakIndex);
	}
}
function removeDate(dateToRemove: DateValue) {
	selectedDates = selectedDates.filter(date => toIsoDate(date) !== toIsoDate(dateToRemove));
	const dateStr = toIsoDate(dateToRemove);
	delete dateTimeRanges[dateStr];
	dateTimeRanges = { ...dateTimeRanges };
}

$effect(() => {
	selectedDates.forEach(date => {
		const dateStr = toIsoDate(date);
		if (!dateTimeRanges[dateStr]) {
			dateTimeRanges[dateStr] = { start: '17:00', end: '20:00', breaks: [] };
		}
	});
});
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold tracking-tight">Interview Setup</h1>
	</div>
	<form method="POST">
		{#if form?.error}
			<div class="mb-6 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-4">
				<h4 class="font-medium mb-2">Please fix the following errors:</h4>
				<ul class="text-sm space-y-1">
					{#each Object.values(errors) as error}
						<li>• {error}</li>
					{/each}
				</ul>
			</div>
		{/if}
		<input type="hidden" name="wholeSchool" value={wholeSchool} />
		{#each yearLevels as yl}
			<input type="hidden" name="yearLevels" value={yl} />
		{/each}
		<input type="hidden" name="selectedDates" value={JSON.stringify(selectedDates.map(toIsoDate))} />
		<input type="hidden" name="dateTimeRanges" value={JSON.stringify(dateTimeRanges)} />
		<input type="hidden" name="duration" value={duration} />
		<input type="hidden" name="autoAssign" value={autoAssign} />
		<input type="hidden" name="slotGenerationMode" value={slotGenerationMode} />
		<Card.Root>
				<Card.Header class="gap-4">
					<div class="flex items-center gap-3">
						<div class="bg-primary rounded-lg p-2">
							<CalendarDaysIcon class="text-primary-foreground" />
						</div>
						<div class="flex-1">
							<Card.Title class="text-lg font-semibold">Configuration</Card.Title>
						</div>
					</div>
					<Card.Description>
						{data.existingConfig ? 'Update your' : 'Configure'} parent/teacher interviews for your school.
					</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-6">
					<!-- Whole school toggle -->
					<div class="space-y-2">
						<Label>Configure for whole school?</Label>
						<div class="flex items-center space-x-2">
							<Switch checked={wholeSchool} onCheckedChange={v => wholeSchool = v} />
							<span class="text-sm text-muted-foreground">
								{wholeSchool ? 'Yes, configure for all year levels' : 'No, select specific year levels'}
							</span>
						</div>
					</div>
					<!-- Year levels -->
					{#if !wholeSchool}
						<div class="space-y-2">
							<Label>Select year levels</Label>
							<div class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 {errors.yearLevels ? 'border border-destructive rounded-lg p-2' : ''}">
								{#each data.yearLevels as yl}
									<label class="flex items-center gap-2">
										<Checkbox value={yl.value} checked={yearLevels.includes(yl.value)} onCheckedChange={checked => {
											if (checked) yearLevels = [...yearLevels, yl.value];
											else yearLevels = yearLevels.filter(v => v !== yl.value);
										}} />
										<span>{yl.label}</span>
									</label>
								{/each}
							</div>
							{#if errors.yearLevels}
								<div class="text-destructive text-sm font-medium">{errors.yearLevels}</div>
							{/if}
						</div>
					{/if}
					<!-- Date picker -->
					<div class="space-y-2">
						<Label>Interview dates</Label>
						<Popover.Root bind:open={calendarOpen}>
							<Popover.Trigger>
								{#snippet child({ props })}
									<Button {...props} variant="outline" class="flex-1 justify-between font-normal {errors.dates ? 'border-destructive' : ''}" onclick={() => calendarOpen = true}>
										{formatSelectedDates()}
										<CalendarDaysIcon />
									</Button>
								{/snippet}
							</Popover.Trigger>
							<Popover.Content class="w-auto overflow-hidden p-0" align="start">
								<Calendar type="multiple" bind:value={selectedDates} captionLayout="dropdown" minValue={currentDate} isDateUnavailable={date => date.compare(currentDate) < 0} />
								<div class="p-3 border-t">
									{#if selectedDates.length > 0}
										<p class="text-sm text-muted-foreground mb-2">Selected: {selectedDates.map(toIsoDate).join(', ')}</p>
									{/if}
									<div class="flex gap-2">
										{#if selectedDates.length > 0}
											<Button variant="outline" size="sm" class="flex-1" onclick={() => { selectedDates = []; dateTimeRanges = {}; }}>Clear All</Button>
										{/if}
										<Button variant="outline" size="sm" class="flex-1" onclick={() => calendarOpen = false}>Done</Button>
									</div>
								</div>
							</Popover.Content>
						</Popover.Root>
						{#if errors.dates}
							<div class="text-destructive text-sm font-medium">{errors.dates}</div>
						{/if}
					</div>
					<!-- Time ranges per date -->
					{#if selectedDates.length > 0}
						<div class="space-y-4 mt-4">
							{#each selectedDates as date}
								{@const dateStr = toIsoDate(date)}
								{@const timeRange = dateTimeRanges[dateStr]}
								{#if timeRange}
									<div class="border rounded-lg p-4">
										<div class="flex items-center justify-between mb-3">
											<h4 class="font-medium">{date.toDate(getLocalTimeZone()).toLocaleDateString()}</h4>
											<Button type="button" variant="outline" size="sm" onclick={() => removeDate(date)}>Remove Date</Button>
										</div>
										<div class="space-y-3">
											<div class="grid grid-cols-2 gap-3">
												<div>
													<Label class="text-sm">Start time</Label>
													<Input type="time" bind:value={timeRange.start} class="mt-1" />
												</div>
												<div>
													<Label class="text-sm">End time</Label>
													<Input type="time" bind:value={timeRange.end} class="mt-1" />
												</div>
											</div>
											<!-- Breaks -->
											<div class="space-y-2">
												<div class="flex items-center justify-between">
													<Label class="text-sm">Breaks</Label>
													<Button type="button" variant="outline" size="sm" onclick={() => addBreakForDate(dateStr)}>Add Break</Button>
												</div>
												{#each timeRange.breaks as breakTime, breakIndex}
													<div class="grid grid-cols-2 gap-3">
														<Input type="time" bind:value={breakTime.start} placeholder="Break start" />
														<div class="flex gap-2">
															<Input type="time" bind:value={breakTime.end} placeholder="Break end" />
															<Button type="button" variant="outline" size="sm" onclick={() => removeBreakForDate(dateStr, breakIndex)}>Remove</Button>
														</div>
													</div>
												{/each}
											</div>
										</div>
									</div>
								{/if}
							{/each}
						</div>
					{/if}
					<!-- Slot generation mode toggle -->
					<div class="space-y-2">
						<Label>Slot generation mode</Label>
						<Switch checked={slotGenerationMode === 'teacher'} onCheckedChange={v => slotGenerationMode = v ? 'teacher' : 'class'} />
						<span class="ml-2">{slotGenerationMode === 'teacher' ? 'Teacher-based' : 'Class-based'}</span>
					</div>
					<!-- Interview duration -->
					<div class="space-y-2">
						<Label>Interview length (minutes)</Label>
						<Input type="number" min="1" max="120" step="1" bind:value={duration} name="duration" class={errors.duration ? 'border-destructive' : ''} />
						{#if errors.duration}
							<div class="text-destructive text-sm font-medium">{errors.duration}</div>
						{/if}
					</div>
					<!-- Auto-generation checkbox -->
					<div class="space-y-2">
						<div class="flex items-center space-x-2">
							<Checkbox checked={autoAssign} onCheckedChange={v => autoAssign = v} name="autoAssign" />
							<Label>Enable auto-generation of slot timings</Label>
						</div>
						{#if errors.autoAssign}
							<div class="text-destructive text-sm font-medium">{errors.autoAssign}</div>
						{/if}
					</div>
				</Card.Content>
				<Card.Footer class="flex justify-end gap-2">
					<Button type="submit">Save and continue</Button>
				</Card.Footer>
			</Card.Root>
	</form>
</div>
