<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import EditIcon from '@lucide/svelte/icons/edit';
	import PenToolIcon from '@lucide/svelte/icons/pen-tool';
	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';
	import { ViewMode } from '$lib/utils';
	import { createDebouncedSave, saveTaskBlockResponse, loadExistingResponse as loadExistingResponseFromAPI } from '../utils/auto-save.js';

	interface FillInBlankContent {
		sentence: string;
		answer: string;
	}

	// Component props using Svelte 5 syntax
	let {
		content = {
			sentence: '',
			answer: ''
		} as FillInBlankContent,
		viewMode = ViewMode.VIEW,
		onUpdate = () => {},
		onPresentationAnswer = () => {},
		// New props for response saving
		blockId,
		taskId,
		classTaskId,
		subjectOfferingId,
		subjectOfferingClassId,
		isPublished = false
	} = $props();

	let hasSubmitted = $state(false);
	let userAnswer = $state('');

	// Edit mode state - simple initialization like markdown
	let sentenceText = $state(content.sentence || '');
	let correctAnswer = $state(content.answer || '');

	// Auto-save function for student responses
	const debouncedSaveResponse = createDebouncedSave(async (response: unknown) => {
		if (isPublished && classTaskId && blockId) {
			await saveTaskBlockResponse(
				blockId,
				classTaskId,
				response
			);
		}
	});

	// Functions for student interaction
	function submitAnswer() {
		if (!userAnswer.trim()) return;
		hasSubmitted = true;
	}

	function resetQuiz() {
		hasSubmitted = false;
		userAnswer = '';
	}

	function isAnswerCorrect(): boolean {
		return userAnswer.trim().toLowerCase() === content.answer.toLowerCase();
	}

	// Parse sentence to display with blank
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
		if (!sentenceText.trim()) {
			alert('Sentence text is required');
			return;
		}

		if (!correctAnswer.trim()) {
			alert('Correct answer is required');
			return;
		}

		if (!sentenceText.includes('_____')) {
			alert('Sentence must contain _____ to indicate where the blank should be');
			return;
		}

		const newContent: FillInBlankContent = {
			sentence: sentenceText.trim(),
			answer: correctAnswer.trim()
		};

		content = newContent;
		onUpdate(newContent);
	}

	// Update edit state when content prop changes (like markdown)
	$effect(() => {
		sentenceText = content.sentence || '';
		correctAnswer = content.answer || '';
		// Reset quiz state
		hasSubmitted = false;
		userAnswer = '';

		// Load existing response for published tasks in view mode
		if (isPublished && viewMode === ViewMode.VIEW) {
			loadExistingResponse();
		}
	});

	// Auto-save when user types answer in published tasks
	$effect(() => {
		if (isPublished && viewMode === ViewMode.VIEW && userAnswer) {
			debouncedSaveResponse(userAnswer);
		}
	});

	// Load existing user response using centralized function
	async function loadExistingResponse() {
		if (!isPublished || !blockId) return;
		
		const existingResponse = await loadExistingResponseFromAPI(blockId, taskId, subjectOfferingClassId);
		if (existingResponse) {
			userAnswer = existingResponse;
		}
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
						bind:value={sentenceText}
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
						bind:value={correctAnswer}
						onblur={saveChanges}
						placeholder="Enter the correct answer..."
					/>
				</div>

				{#if sentenceText && correctAnswer}
					{@const parsed = parseSentence(sentenceText)}
					<div class="space-y-2">
						<Label>Preview</Label>
						<div class="dark:bg-input/30 border-input rounded-lg border bg-transparent p-4">
							<div class="flex flex-wrap items-center gap-2 text-lg leading-relaxed">
								<span>{parsed.before}</span>
								<span
									class="border-primary/50 mx-2 inline-block max-w-[200px] min-w-[140px] rounded-lg border-2 px-3 py-2 text-center font-medium shadow-sm"
								>
									{correctAnswer}
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
		{#if content.sentence && content.answer}
			<Card.Root>
				<Card.Content>
					<div class="mb-6">
						<h3 class="mb-2 text-lg font-medium">Fill in the Blank</h3>
						<p class="text-muted-foreground mb-6 text-sm">
							Complete the sentence by filling in the blank.
						</p>
					</div>

					{@const parsed = parseSentence(content.sentence)}
					{@const showFeedback = hasSubmitted && !isPublished}
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
												? 'border-green-500 bg-green-50 text-green-800 shadow-sm dark:bg-green-900/20 dark:text-green-200'
												: 'border-red-500 bg-red-50 text-red-800 shadow-sm dark:bg-red-900/20 dark:text-red-200'
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
						<div
							class={`mb-6 rounded-lg border p-4 ${
								isAnswerCorrect()
									? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
									: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
							}`}
						>
							{#if isAnswerCorrect()}
								<div class="flex items-center gap-2 text-green-800 dark:text-green-200">
									<CheckIcon class="h-5 w-5" />
									<span class="font-medium">Correct!</span>
								</div>
								<p class="mt-1 text-sm text-green-700 dark:text-green-300">
									Well done! You got the right answer.
								</p>
							{:else}
								<div class="flex items-center gap-2 text-red-800 dark:text-red-200">
									<XIcon class="h-5 w-5" />
									<span class="font-medium">Incorrect</span>
								</div>
								<p class="mt-1 text-sm text-red-700 dark:text-red-300">
									The correct answer is: <strong>{content.answer}</strong>
								</p>
							{/if}
						</div>
					{/if}

					<!-- Submit/Reset Button - Only show for non-published tasks -->
					{#if !isPublished}
						{#if !hasSubmitted}
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
