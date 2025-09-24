<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import { CalendarIcon, CheckCircleIcon, LoaderIcon, LockIcon } from '@lucide/svelte';

	let isGenerating = false;

	async function handleGenerate(event: SubmitEvent) {
		event.preventDefault();

		isGenerating = true;

		// Simulate loading for 3 seconds
		setTimeout(async () => {
			isGenerating = false;

			// After loading, submit the form
			(event.target as HTMLFormElement).submit();
		}, 3000);
	}
</script>

<div class="flex h-full justify-center px-4 pt-6 md:pt-10 xl:pt-14">
	<Card.Root class="w-full max-w-2xl border-none shadow-none">
		<Card.Header class="space-y-4 text-center">
			<div class="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
				<CheckCircleIcon class="text-primary h-8 w-8" />
			</div>
			<div class="space-y-2">
				<Card.Title class="text-3xl font-bold">Ready to Generate</Card.Title>
				<Card.Description class="text-muted-foreground text-lg">
					Your timetable configuration is complete
				</Card.Description>
			</div>
		</Card.Header>

		<Card.Content class="space-y-6">
			<div class="space-y-4">
				<div class="bg-muted/80 flex items-start gap-3 rounded-lg p-6">
					<CalendarIcon class="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
					<div class="space-y-1">
						<p class="font-medium">Timetable Generation</p>
						<p class="text-muted-foreground text-sm">
							Once you start the generation process, eddi will analyse all of your configured data
							and create an optimised timetable based on your constraints and preferences.
						</p>
					</div>
				</div>

				<div class="bg-muted/80 flex items-start gap-3 rounded-lg p-6">
					<LockIcon class="text-destructive mt-0.5 h-5 w-5 flex-shrink-0" />
					<div class="space-y-1">
						<p class="font-medium">Important Notice</p>
						<p class="text-muted-foreground text-sm">
							While the generation is in progress, the timetable will be locked and no changes can
							be made to subjects, activities, students, or rules until the process completes.
						</p>
					</div>
				</div>
			</div>

			<form
				method="POST"
				action="?/generateTimetable"
				class="flex justify-center"
				on:submit={handleGenerate}
			>
				<Button type="submit" size="lg" class="px-8 py-3" disabled={isGenerating}>
					{#if isGenerating}
						<LoaderIcon class="mr-2 h-4 w-4 animate-spin" />
						Generating...
					{:else}
						Generate Timetable
					{/if}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>

<!-- Loading Overlay -->
{#if isGenerating}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="mx-4 w-full max-w-sm rounded-lg bg-white p-8 shadow-xl">
			<div class="space-y-4 text-center">
				<div class="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
					<LoaderIcon class="text-primary h-8 w-8 animate-spin" />
				</div>
				<div class="space-y-2">
					<h3 class="text-lg font-semibold">Generating Timetable</h3>
					<p class="text-muted-foreground text-sm">
						Please wait while we create your optimized timetable...
					</p>
				</div>
			</div>
		</div>
	</div>
{/if}
