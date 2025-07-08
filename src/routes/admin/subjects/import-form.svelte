<script lang="ts">
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Dropzone from '$lib/components/ui/dropzone/dropzone.svelte';
	import { validateCSVFile, type CSVValidationResult } from '$lib/utils.js';
	import { subjectsImportSchema, type SubjectsImportSchema } from './schema.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';
	import { invalidateAll } from '$app/navigation';

	type Props = {
		data: SuperValidated<Infer<SubjectsImportSchema>>;
		open: boolean;
	};

	let { data, open = $bindable() }: Props = $props();

	const requiredColumns = ['name', 'description'];
	const optionalColumns: string[] = [];

	let csvValidationResult = $state<CSVValidationResult | null>(null);

	const { form, errors, enhance, submitting } = superForm(data, {
		validators: zodClient(subjectsImportSchema),
		resetForm: false,
		onResult: ({ result }) => {
			if (result.type === 'success') {
				invalidateAll();
				setTimeout(() => {
					open = false;
					csvValidationResult = null;
				}, 2000);
			}
		}
	});

	$effect(() => {
		if ($form.file && $form.file.size > 0) {
			validateCSVFile($form.file, requiredColumns, optionalColumns).then((result) => {
				csvValidationResult = result;
			});
		} else {
			csvValidationResult = null;
		}
	});

	function handleDialogClose() {
		if (!$submitting) {
			open = false;
			csvValidationResult = null;
		}
	}
</script>

<Dialog.Root bind:open onOpenChange={handleDialogClose}>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>Import Subjects from CSV</Dialog.Title>
			<Dialog.Description>
				Upload a CSV file to import subjects. The file must contain the required columns listed
				below.
			</Dialog.Description>
		</Dialog.Header>

		<form method="POST" enctype="multipart/form-data" use:enhance>
			<div class="space-y-6">
				<!-- Required Columns Info -->
				<div class="bg-muted rounded-lg p-4">
					<h4 class="mb-2 text-sm font-medium">Required Columns:</h4>
					<div class="flex flex-wrap gap-2">
						{#each requiredColumns as column}
							<span
								class="bg-primary/10 text-primary ring-primary/20 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
							>
								{column}
							</span>
						{/each}
					</div>
					{#if optionalColumns.length > 0}
						<h4 class="mt-3 mb-2 text-sm font-medium">Optional Columns:</h4>
						<div class="flex flex-wrap gap-2">
							{#each optionalColumns as column}
								<span
									class="bg-secondary/10 text-secondary ring-secondary/20 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
								>
									{column}
								</span>
							{/each}
						</div>
					{/if}
				</div>

				<!-- File Upload -->
				<div class="space-y-4">
					<Dropzone bind:files={$form.file} accept=".csv" />
					{#if $errors.file}
						<div class="bg-destructive/10 text-destructive flex items-center gap-2 rounded-md p-3">
							<XIcon class="size-4 flex-shrink-0" />
							<span class="text-sm">{$errors.file}</span>
						</div>
					{/if}

					<!-- Validation Results -->
					{#if csvValidationResult}
						<div class="space-y-3">
							<div class="flex items-center gap-2">
								{#if csvValidationResult.isValid}
									<CheckIcon class="text-primary size-5" />
									<span class="text-primary text-sm font-medium">CSV format is valid</span>
								{:else}
									<XIcon class="text-destructive size-5" />
									<span class="text-destructive text-sm font-medium">CSV format has issues</span>
								{/if}
							</div>

							{#if csvValidationResult.foundColumns.length > 0}
								<div>
									<h5 class="mb-1 text-sm font-medium">Found Columns:</h5>
									<div class="flex flex-wrap gap-1">
										{#each csvValidationResult.foundColumns as column}
											{@const isRequired = requiredColumns.some(
												(req) => req.toLowerCase() === column.toLowerCase()
											)}
											{@const isOptional = optionalColumns.some(
												(opt) => opt.toLowerCase() === column.toLowerCase()
											)}
											<span
												class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset
												{isRequired
													? 'bg-primary/10 text-primary ring-primary/20'
													: isOptional
														? 'bg-secondary/10 text-secondary ring-secondary/20'
														: 'bg-muted text-muted-foreground ring-border'}"
											>
												{column}
											</span>
										{/each}
									</div>
								</div>
							{/if}

							{#if csvValidationResult.missingColumns.length > 0}
								<div>
									<h5 class="text-destructive mb-1 text-sm font-medium">
										Missing Required Columns:
									</h5>
									<div class="flex flex-wrap gap-1">
										{#each csvValidationResult.missingColumns as column}
											<span
												class="bg-destructive/10 text-destructive ring-destructive/20 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
											>
												{column}
											</span>
										{/each}
									</div>
								</div>
							{/if}

							{#if csvValidationResult.extraColumns.length > 0}
								<div>
									<h5 class="text-muted-foreground mb-1 text-sm font-medium">
										Extra Columns (will be ignored):
									</h5>
									<div class="flex flex-wrap gap-1">
										{#each csvValidationResult.extraColumns as column}
											<span
												class="bg-muted text-muted-foreground ring-border inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
											>
												{column}
											</span>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<Dialog.Footer>
				<Button variant="outline" onclick={handleDialogClose} disabled={$submitting}>Cancel</Button>
				<Button
					type="submit"
					disabled={!csvValidationResult?.isValid || $submitting || !!$errors.file}
				>
					{#if $submitting}
						Processing...
					{:else}
						Import Subjects
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
