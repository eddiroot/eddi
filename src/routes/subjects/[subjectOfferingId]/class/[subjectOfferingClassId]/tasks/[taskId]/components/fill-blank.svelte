<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import PenToolIcon from '@lucide/svelte/icons/pen-tool';
	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';
	import type { FillBlankBlockProps } from './blockTypes';
	import { ViewMode } from '../constants';
	import { taskStatusEnum } from '$lib/enums';

	let {
		initialConfig,
		onConfigUpdate,
		initialResponse,
		onResponseUpdate,
		viewMode,
		taskStatus
	}: FillBlankBlockProps = $props();

	let config = $state(initialConfig);
	let userAnswer = $state('');

	function submitAnswer() {
		if (!userAnswer.trim()) return;
	}

	function resetQuiz() {
		userAnswer = '';
	}

	function isAnswerCorrect(): boolean {
		return userAnswer.trim() == config.answer;
	}

	function parseSentence(sentence: string): { before: string; after: string } {
		const blankIndex = sentence.indexOf('_____');
		if (blankIndex === -1) {
			return { before: sentence, after: '' };
		}
		return {
			before: sentence.substring(0, blankIndex).trim(),
			after: sentence.substring(blankIndex + 5).trim()
		};
	}

	function saveChanges() {
		if (!config.sentence.trim()) {
			alert('Sentence text is required');
			return;
		}

		if (!config.answer.trim()) {
			alert('Correct answer is required');
			return;
		}

		if (!config.sentence.includes('_____')) {
			alert('Sentence must contain _____ to indicate where the blank should be');
			return;
		}

		onConfigUpdate({
			sentence: config.sentence.trim(),
			answer: config.answer.trim()
		});
	}
</script>

<div class="flex w-full flex-col gap-4">
	{#if viewMode === ViewMode.EDIT}
		<!-- EDIT MODE: Shows form for creating/editing the fill-in-blank question -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<PenToolIcon class="h-4 w-4" />
					Edit Fill-in-the-Blank Question
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-6">
				<div class="space-y-2">
					<Label for="sentence-text">Sentence</Label>
					<Textarea
						id="sentence-text"
						bind:value={config.sentence}
						onblur={saveChanges}
						placeholder="Enter your sentence with _____ where the blank should be..."
						class="min-h-[80px] resize-none"
					/>
					<p class="text-muted-foreground text-xs">
						Use _____ (5 underscores) to indicate where the blank should appear in the sentence.
					</p>
				</div>

				<div class="space-y-2">
					<Label for="correct-answer">Correct Answer</Label>
					<Input
						id="correct-answer"
						bind:value={config.answer}
						onblur={saveChanges}
						placeholder="Enter the correct answer..."
					/>
				</div>

				{#if config.sentence && config.answer}
					{@const parsed = parseSentence(config.sentence)}
					<div class="space-y-2">
						<Label>Preview</Label>
						<div class="dark:bg-input/30 border-input rounded-lg border bg-transparent p-4">
							<div class="flex flex-wrap items-center gap-2 text-lg leading-relaxed">
								<span>{parsed.before}</span>
								<span
									class="border-primary/50 mx-2 inline-block max-w-[200px] min-w-[140px] rounded-lg border-2 px-3 py-2 text-center font-medium shadow-sm"
								>
									{config.answer}
								</span>
								<span>{parsed.after}</span>
							</div>
						</div>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	{:else if viewMode === ViewMode.VIEW}
		<!-- VIEW MODE: Shows the interactive fill-in-blank question -->
		{#if config.sentence && config.answer}
			<Card.Root>
				<Card.Content>
					<div class="mb-6">
						<h3 class="mb-2 text-lg font-medium">Fill in the Blank</h3>
						<p class="text-muted-foreground mb-6 text-sm">
							Complete the sentence by filling in the blank.
						</p>
					</div>

					{@const parsed = parseSentence(config.sentence)}
					{@const showFeedback = taskStatus == taskStatusEnum.graded}
					<div class="mb-6">
						<div class="flex flex-wrap items-center gap-2 text-lg leading-relaxed">
							<span>{parsed.before}</span>
							<div class="relative mx-2 inline-block">
								<Input
									bind:value={userAnswer}
									disabled={showFeedback}
									placeholder="Your answer"
									class={`max-w-[200px] min-w-[140px] text-center font-medium transition-all duration-200 ${
										showFeedback
											? isAnswerCorrect()
												? 'border-success text-success shadow-sm'
												: 'border-destructive text-destructive shadow-sm'
											: 'border-primary/30 focus:border-primary bg-background hover:border-primary/50 border-2 shadow-sm'
									}`}
									style="border-radius: 8px; padding: 8px 12px;"
								/>
							</div>
							{#if parsed.after}
								<span>{parsed.after}</span>
							{/if}
						</div>
					</div>

					{#if showFeedback}
						<div class="mb-6 rounded-lg border p-4">
							{#if isAnswerCorrect()}
								<div class="text-success flex items-center gap-2">
									<CheckIcon class="h-5 w-5" />
									<span class="font-medium">Correct!</span>
								</div>
								<p class="text-success mt-1 text-sm">Well done! You got the right answer.</p>
							{:else}
								<div class="text-destructive flex items-center gap-2">
									<XIcon class="h-5 w-5" />
									<span class="font-medium">Incorrect</span>
								</div>
								<p class="text-destructive mt-1 text-sm">
									The correct answer is: <strong>{config.answer}</strong>
								</p>
							{/if}
						</div>
					{/if}

					{#if taskStatus == taskStatusEnum.published}
						{#if !initialResponse}
							<div class="mt-6">
								<Button onclick={submitAnswer} disabled={!userAnswer.trim()} class="w-full">
									Submit Answer
								</Button>
							</div>
						{:else}
							<div class="mt-6 flex gap-2">
								<Button onclick={resetQuiz} variant="outline" class="flex-1">Try Again</Button>
							</div>
						{/if}
					{/if}
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="flex h-48 w-full items-center justify-center rounded-lg border border-dashed">
				<div class="text-center">
					<PenToolIcon class="text-muted-foreground mx-auto h-12 w-12" />
					<p class="text-muted-foreground mt-2 text-sm">No fill-in-blank question created</p>
					<p class="text-muted-foreground text-xs">
						Switch to edit mode to create a fill-in-blank question
					</p>
				</div>
			</div>
		{/if}
	{:else}
		<!-- PRESENTATION MODE: Placeholder for presentation-specific rendering -->
	{/if}
</div>
