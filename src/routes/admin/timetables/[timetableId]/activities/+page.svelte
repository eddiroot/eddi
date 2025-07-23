<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card } from '$lib/components/ui/card';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { Badge } from '$lib/components/ui/badge';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { activityFormSchema } from './schema.js';
	import { yearLevelToLabel, convertToFullName } from '$lib/utils';
	import * as Select from '$lib/components/ui/select/index.js';
	import { DotIcon } from '@lucide/svelte';

	let { data } = $props();

	const { form: formData, enhance: formEnhance } = superForm(data.form, {
		validators: zod4(activityFormSchema),
		resetForm: false,
		dataType: 'json'
	});

	let selectedYearLevel = $state($formData.yearLevel || data.defaultYearLevel);

	const teacherOptions = data.teachers.map((teacher) => ({
		value: teacher.id,
		label: convertToFullName(teacher.firstName, teacher.middleName, teacher.lastName)
	}));

	const currentSubjects = $derived(() => {
		return data.subjectsByYearLevel[selectedYearLevel] || [];
	});

	function updateActivitiesForYearLevel(yearLevel: string) {
		$formData.yearLevel = yearLevel as any;

		const subjects = data.subjectsByYearLevel[yearLevel] || [];
		$formData.activities = subjects.map((subject) => ({
			subjectId: subject.id,
			periodsPerInstance: 1,
			totalPeriods: 5,
			teacherIds: []
		}));
	}
</script>

<h1 class="mb-4 text-3xl font-bold">Timetable Activities</h1>

<!-- Year Level Navigator -->
<Select.Root
	type="single"
	onValueChange={updateActivitiesForYearLevel}
	bind:value={selectedYearLevel}
>
	<Select.Trigger class="w-full">
		{#if selectedYearLevel}
			{yearLevelToLabel(selectedYearLevel)}
		{:else}
			Select year level...
		{/if}
	</Select.Trigger>
	<Select.Content>
		{#each data.yearLevels as yearLevel}
			<Select.Item value={yearLevel}>
				{yearLevelToLabel(yearLevel)}
			</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>

<div class="h-4"></div>

{#if currentSubjects()?.length === 0}
	<Card class="p-8 text-center">
		<h3 class="mb-2 text-lg font-semibold">No Subjects Found</h3>
		<p class="text-muted-foreground">
			No subjects are available for {yearLevelToLabel(selectedYearLevel)}. Please add subjects for
			this year level before creating activities.
		</p>
	</Card>
{:else}
	<form method="POST" action="?/createActivities" use:formEnhance>
		<input type="hidden" name="yearLevel" value={selectedYearLevel} />
		<div class="mb-8 space-y-4">
			<Accordion.Root type="single" class="w-full">
				{#each currentSubjects() as subject, index}
					<Accordion.Item value="subject-{subject.id}">
						<Accordion.Trigger class="w-full">
							<div class="flex w-full items-center justify-between">
								<div class="flex items-center gap-4">
									<h3 class="text-lg font-semibold">{subject.name}</h3>
									{#if data.activitiesBySubjectId[subject.id]?.length > 0}
										<Badge variant="outline" class="text-xs">
											{data.activitiesBySubjectId[subject.id]?.length} activities
										</Badge>
									{/if}
								</div>
							</div>
						</Accordion.Trigger>

						<Accordion.Content>
							{#if data.activitiesBySubjectId[subject.id]?.length > 0}
								<div class="mb-4">
									<h4 class="mb-3 font-medium">Existing Activities</h4>
									<div class="grid gap-3">
										{#each data.activitiesBySubjectId[subject.id] as activity}
											<div
												class="bg-background flex items-center justify-between rounded-lg border p-3"
											>
												<div class="flex items-center gap-4">
													<span class="font-medium">{activity.studentGroup.name}</span>
													<span class="text-muted-foreground text-sm">
														{convertToFullName(
															activity.teacher.firstName,
															activity.teacher.middleName,
															activity.teacher.lastName
														)}
													</span>
												</div>
												<div class="text-muted-foreground flex items-center text-sm">
													<span>{activity.activity.periodsPerInstance} periods/instance</span>
													<DotIcon />
													<span>{activity.activity.totalPeriods} total periods</span>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Activity Configuration Form -->
							<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
								<div class="space-y-2">
									<Label for="periods-per-instance-{subject.id}">Periods per Instance</Label>
									<Input
										id="periods-per-instance-{subject.id}"
										type="number"
										min="1"
										max="10"
										bind:value={$formData.activities[index].periodsPerInstance}
										placeholder="1"
									/>
								</div>

								<div class="space-y-2">
									<Label for="total-periods-{subject.id}">Total Periods</Label>
									<Input
										id="total-periods-{subject.id}"
										type="number"
										min="1"
										max="100"
										bind:value={$formData.activities[index].totalPeriods}
										placeholder="5"
									/>
								</div>

								<div class="space-y-2">
									<Label for="teachers-{subject.id}">Teachers</Label>
									<Select.Root type="multiple" bind:value={$formData.activities[index].teacherIds}>
										<Select.Trigger class="w-full">
											{#if $formData.activities[index].teacherIds?.length > 0}
												{$formData.activities[index].teacherIds
													.map((teacherId) => {
														return (
															teacherOptions.find((t) => t.value === teacherId)?.label || 'Unknown'
														);
													})
													.join(', ')}
											{:else}
												Select teachers...
											{/if}
										</Select.Trigger>
										<Select.Content>
											{#each teacherOptions as option}
												<Select.Item value={option.value}>
													{option.label}
												</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</div>
							</div>

							<!-- Hidden fields for form submission -->
							<input type="hidden" bind:value={$formData.activities[index].subjectId} />
						</Accordion.Content>
					</Accordion.Item>
				{/each}
			</Accordion.Root>
		</div>

		<div class="flex justify-end">
			<Button type="submit" size="lg">Create Activities</Button>
		</div>
	</form>
{/if}
