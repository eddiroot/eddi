<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import { Loader2 } from 'lucide-svelte';
	import { YEAR_LEVELS, ACADEMIC_TERMS } from '../curriculum-utils';
	import type { CourseMapItem } from '$lib/server/db/schema';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	export let item: CourseMapItem;
	export let open: boolean = false;

	let title = '';
	let description = '';
	let yearLevel = '';
	let termNumber = '1';
	let academicYear = new Date().getFullYear();
	let startWeekNumber = 1;
	let lengthInWeeks = 1;
	let isSubmitting = false;

	// Initialize form when dialog opens
	$: if (open && item) {
		title = item.title;
		description = item.description || '';
		yearLevel = item.yearLevel;
		termNumber = item.termNumber.toString();
		academicYear = item.academicYear;
		startWeekNumber = item.startWeekNumber;
		lengthInWeeks = item.lengthInWeeks;
		isSubmitting = false;
	}

	$: yearLevelOptions = YEAR_LEVELS.filter((yl: any) => yl.value !== 'all');
</script>

<Dialog bind:open>
	<DialogContent class="sm:max-w-[500px]">
		<DialogHeader>
			<DialogTitle>Edit Course Map Item</DialogTitle>
			<DialogDescription>
				Update the details of this course map item.
			</DialogDescription>
		</DialogHeader>

		<form 
			method="POST" 
			action="?/update"
			use:enhance={() => {
				isSubmitting = true;			return ({ result }) => {
				isSubmitting = false;
				if (result.type === 'success') {
					toast.success('Course map item updated successfully');
					open = false;
					invalidateAll();
				} else if (result.type === 'failure') {
					const message = (result.data as any)?.message || 'Failed to update course map item';
					toast.error(String(message));
				}
			};
			}}
			class="space-y-4"
		>
			<input type="hidden" name="id" value={item.id} />
			<input type="hidden" name="subjectId" value={item.subjectId} />
			<input type="hidden" name="academicYear" value={academicYear} />

			<!-- Title -->
			<div class="space-y-2">
				<Label for="title">Title *</Label>
				<Input
					id="title"
					name="title"
					bind:value={title}
					placeholder="Enter course map item title"
					required
				/>
			</div>

			<!-- Description -->
			<div class="space-y-2">
				<Label for="description">Description</Label>
				<Textarea
					id="description"
					name="description"
					bind:value={description}
					placeholder="Enter description (optional)"
					rows={3}
				/>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<!-- Year Level -->
				<div class="space-y-2">
					<Label for="yearLevel">Year Level *</Label>
					<Select.Root
						type="single"
						bind:value={yearLevel}
						onValueChange={(value: string) => {
							if (value) {
								yearLevel = value;
							}
						}}
						required
					>
						<Select.Trigger>
							{yearLevelOptions.find((o: any) => o.value === yearLevel)?.label || 'Select year level...'}
						</Select.Trigger>
						<Select.Content>
							{#each yearLevelOptions as option}
								<Select.Item value={option.value}>{option.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<input type="hidden" name="yearLevel" value={yearLevel} />
				</div>

				<!-- Term -->
				<div class="space-y-2">
					<Label for="term">Term *</Label>
					<Select.Root
						type="single"
						bind:value={termNumber}
					>
						<Select.Trigger>
							{ACADEMIC_TERMS.find(t => t.value.toString() === termNumber)?.label || 'Select term...'}
						</Select.Trigger>
						<Select.Content>
							{#each ACADEMIC_TERMS as term}
								<Select.Item value={term.value.toString()}>
									{term.label} (Weeks {term.startWeek}-{term.endWeek})
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<input type="hidden" name="termNumber" value={termNumber} />
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<!-- Start Week -->
				<div class="space-y-2">
					<Label for="startWeek">Start Week *</Label>
					<Input
						id="startWeek"
						name="startWeekNumber"
						type="number"
						bind:value={startWeekNumber}
						min="1"
						max="20"
						required
					/>
				</div>

				<!-- Length -->
				<div class="space-y-2">
					<Label for="length">Length (weeks) *</Label>
					<Input
						id="length"
						name="lengthInWeeks"
						type="number"
						bind:value={lengthInWeeks}
						min="1"
						max="20"
						required
					/>
				</div>
			</div>

			<!-- Preview -->
			{#if title && startWeekNumber && lengthInWeeks}
				<div class="p-3 bg-muted/50 rounded-lg">
					<h4 class="text-sm font-medium mb-1">Preview</h4>
					<p class="text-sm text-muted-foreground">
						<strong>{title}</strong> will run for 
						{lengthInWeeks} week{lengthInWeeks !== 1 ? 's' : ''} 
						(Week {startWeekNumber}{lengthInWeeks > 1 ? ` - ${startWeekNumber + lengthInWeeks - 1}` : ''})
					</p>
				</div>
			{/if}

			<!-- Buttons -->
			<div class="flex justify-end gap-3 pt-4">
				<Button type="button" variant="outline" onclick={() => open = false} disabled={isSubmitting}>
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{#if isSubmitting}
						<Loader2 class="h-4 w-4 mr-2 animate-spin" />
					{/if}
					Update Item
				</Button>
			</div>
		</form>
	</DialogContent>
</Dialog>
