<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import {
		type BlockMatchingResponse,
		ViewMode,
		type MatchingBlockProps
	} from '$lib/schemas/taskSchema';

	let {
		initialConfig,
		onConfigUpdate,
		initialResponse,
		onResponseUpdate,
		viewMode
	}: MatchingBlockProps = $props();

	let config = $state(initialConfig);
	let response = $state<BlockMatchingResponse>(
		initialResponse || {
			matches: []
		}
	);

	// Do not remove. Updates config state when block order is changed.
	$effect(() => {
		config = initialConfig;
	});

	// Do not remove. Updates response state when new student selected.
	$effect(() => {
		response = initialResponse || {
			matches: []
		};
	});

	function addPair() {
		config = { ...config, pairs: [...config.pairs, { left: '', right: '' }] };
		onConfigUpdate(config);
	}

	function removePair(index: number) {
		if (config.pairs.length <= 1) return;
		config = { ...config, pairs: config.pairs.filter((_, i) => i !== index) };
		onConfigUpdate(config);
	}

	function updatePair(index: number, field: 'left' | 'right', value: string) {
		if (index < 0 || index >= config.pairs.length) return;
		const updatedPairs = [...config.pairs];
		updatedPairs[index] = { ...updatedPairs[index], [field]: value };
		config = { ...config, pairs: updatedPairs };
		onConfigUpdate(config);
	}
</script>

{#if viewMode === ViewMode.CONFIGURE}
	<Card.Root class="p-4">
		<Card.Header>
			<Card.Title class="text-lg font-semibold">Matching Exercise</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-4">
			<!-- Instructions -->
			<div class="space-y-2">
				<Label for="instructions">Instructions</Label>
				<Textarea
					id="instructions"
					bind:value={config.instructions}
					onblur={async () => {
						await onConfigUpdate(config);
					}}
					placeholder="Enter instructions for the matching exercise..."
					class="min-h-20"
				/>
			</div>

			<!-- Pairs -->
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<Label class="text-sm font-medium">Matching Pairs</Label>
					<Button variant="outline" size="sm" onclick={addPair}>
						<PlusIcon class="mr-2 h-4 w-4" />
						Add Pair
					</Button>
				</div>

				{#each config.pairs as pair, index (index)}
					<div class="flex items-center gap-4 rounded-lg border p-3">
						<div class="flex-1">
							<Label class="text-muted-foreground text-xs">Left Item</Label>
							<Input
								bind:value={pair.left}
								onblur={async () => {
									await onConfigUpdate(config);
								}}
								placeholder="Left item..."
								class="mt-1"
							/>
						</div>

						<div class="text-muted-foreground">↔</div>

						<div class="flex-1">
							<Label class="text-muted-foreground text-xs">Right Item</Label>
							<Input
								bind:value={pair.right}
								onblur={async () => {
									await onConfigUpdate(config);
								}}
								placeholder="Right item..."
								class="mt-1"
							/>
						</div>

						{#if config.pairs.length > 1}
							<Button
								variant="outline"
								size="sm"
								onclick={() => removePair(index)}
								class="text-destructive hover:text-destructive"
							>
								<TrashIcon class="h-4 w-4" />
							</Button>
						{/if}
					</div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>
{:else if viewMode === ViewMode.ANSWER}
	<!-- Preview Mode -->
	<Card.Root class="p-6">
		<Card.Header>
			<Card.Title class="text-lg font-semibold">Matching Exercise</Card.Title>
			{#if config.instructions}
				<Card.Description class="text-muted-foreground text-sm whitespace-pre-wrap"
					>{config.instructions}</Card.Description
				>
			{/if}
		</Card.Header>
		<Card.Content class="space-y-6">
			{#if config.pairs.length > 0 && config.pairs.some((pair) => pair.left.trim() && pair.right.trim())}
				<div class="grid grid-cols-1 items-start gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-8">
					<!-- Left Items (Fixed Order) -->
					<div class="space-y-3">
						<h3 class="text-muted-foreground text-sm font-medium">Items to match:</h3>
						<div class="min-h-[200px] space-y-2">
							{#each config.pairs.filter((pair) => pair.left.trim() && pair.right.trim()) as pair, index}
								<div
									class="bg-muted/20 flex min-h-12 items-center justify-between rounded-lg border p-3"
								>
									<div class="flex items-center gap-3">
										<span class="text-muted-foreground w-6 text-sm font-medium">{index + 1}.</span>
										<span class="font-medium">{pair.left}</span>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<!-- Arrow Column (hidden on mobile) -->
					<div class="hidden min-h-[200px] flex-col items-center justify-center px-2 md:flex">
						<div class="text-muted-foreground">
							<ArrowRightIcon class="h-6 w-6" />
						</div>
						<div class="text-muted-foreground writing-mode-vertical mt-2 text-center text-xs">
							Match order
						</div>
					</div>

					<!-- Right Items -->
					<div class="space-y-3">
						<h3 class="text-muted-foreground text-sm font-medium">Matching answers:</h3>
						<div class="min-h-[200px] space-y-2">
							{#each config.pairs.filter((pair) => pair.left.trim() && pair.right.trim()) as pair, index}
								<div
									class="bg-secondary/50 flex min-h-12 items-center justify-between rounded-lg border p-3"
								>
									<div class="flex items-center gap-3">
										<span class="text-muted-foreground w-6 text-sm font-medium">{index + 1}.</span>
										<span class="font-medium">{pair.right}</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{:else}
				<p class="text-muted-foreground">
					No matching pairs configured. Switch to edit mode to add pairs.
				</p>
			{/if}
		</Card.Content>
	</Card.Root>
{/if}
