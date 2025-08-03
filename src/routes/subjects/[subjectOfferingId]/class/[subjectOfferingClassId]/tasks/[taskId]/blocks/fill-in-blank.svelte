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
		role = 'student',
		// New props for response saving
		blockId,
		taskId,
		classTaskId,
		subjectOfferingId,
		subjectOfferingClassId,
		isPublished = false,
		// New props for student response visualization
		studentResponses = [],
		showResponseChart = false
	} = $props();

	let hasSubmitted = $state(false);
	let userAnswer = $state('');

	// Teacher presentation state
	let showResponses = $state(false);
	let showCorrectAnswer = $state(false);

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

	// Response analysis for teachers
	const responseAnalysis = $derived(() => {
		console.log('Fill-in-blank responseAnalysis called:', {
			showResponseChart,
			contentAnswer: content.answer,
			showResponses,
			studentResponsesCount: studentResponses.length,
			studentResponses
		});

		if (!showResponseChart || !content.answer || !showResponses) {
			console.log('Returning empty response analysis - missing conditions');
			return { correct: [], incorrect: [], total: 0 };
		}
		
		console.log('Fill-in-blank response analysis result:');
		return studentResponses;
	});

	// Functions to control response visibility
	function toggleShowResponses() {
		console.log('toggleShowResponses called:', {
			currentShowResponses: showResponses,
			showResponseChart,
			studentResponsesCount: studentResponses.length
		});
		showResponses = !showResponses;
		if (!showResponses) {
			showCorrectAnswer = false; // Reset correct answer when hiding responses
		}
		console.log('After toggle - showResponses:', showResponses);
	}

	function toggleShowCorrectAnswer() {
		console.log('toggleShowCorrectAnswer called:', {
			currentShowCorrectAnswer: showCorrectAnswer
		});
		showCorrectAnswer = !showCorrectAnswer;
		console.log('After toggle - showCorrectAnswer:', showCorrectAnswer);
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
	{:else if viewMode === ViewMode.PRESENT && role === 'student'}
		<!-- PRESENTATION MODE: Large input for student answers -->
		<div class="w-full max-w-4xl mx-auto">
			{#if content.sentence && content.answer}
				{@const parsed = parseSentence(content.sentence)}
				<!-- Question Display -->
				<div class="mb-12 text-center">
					<h2 class="text-4xl font-bold text-gray-800 mb-8">Fill in the Blank</h2>
					
					<!-- Sentence with blank -->
					<div class="text-2xl leading-relaxed text-gray-700 mb-8 max-w-3xl mx-auto">
						<div class="flex flex-wrap items-center justify-center gap-3">
							<span>{parsed.before}</span>
							<div class="inline-block min-w-[200px] border-b-4 border-dashed border-gray-400">
								<span class="invisible">placeholder</span>
							</div>
							{#if parsed.after}
								<span>{parsed.after}</span>
							{/if}
						</div>
					</div>
				</div>

				<!-- Large Answer Input -->
				<div class="max-w-2xl mx-auto">
					<div class="relative">
						<Input
							bind:value={userAnswer}
							placeholder="Type your answer here..."
							class="w-full text-3xl p-8 text-center border-4 border-gray-300 rounded-2xl shadow-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all duration-300"
							style="min-height: 120px; font-size: 2rem; line-height: 1.2;"
							onkeydown={(e) => {
								if (e.key === 'Enter' && userAnswer.trim()) {
									console.log('Fill-in-blank Enter pressed:', {
										userAnswer: userAnswer.trim(),
										hasHandler: !!onPresentationAnswer
									});
									// Submit to presentation if handler exists
									if (onPresentationAnswer) {
										onPresentationAnswer(userAnswer.trim());
									}
								}
							}}
						/>
					</div>
				
					<!-- Submit Button -->
					<div class="mt-12 text-center">
						<Button
							onclick={() => {
								console.log('Fill-in-blank submit clicked:', {
									userAnswer: userAnswer.trim(),
									hasHandler: !!onPresentationAnswer
								});
								if (userAnswer.trim() && onPresentationAnswer) {
									onPresentationAnswer(userAnswer.trim());
								}
							}}
							disabled={!userAnswer.trim()}
							size="lg"
							class="text-xl px-12 py-6 rounded-xl"
						>
							Submit Answer
						</Button>
					</div>
				</div>

				<!-- Instruction text -->
				<div class="text-center mt-8">
					<p class="text-lg text-gray-600">
						Enter your answer and press Submit or hit Enter
					</p>
				</div>
			{:else}
				<!-- Empty state -->
				<div class="flex h-96 w-full items-center justify-center rounded-2xl border-4 border-dashed border-gray-200">
					<div class="text-center">
						<PenToolIcon class="text-gray-400 mx-auto h-16 w-16 mb-4" />
						<p class="text-gray-500 text-xl font-medium">No question available</p>
						<p class="text-gray-400 text-lg">Waiting for teacher to set up the question</p>
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<!-- PRESENTATION MODE: Teacher view with student responses -->
		<div class="w-full max-w-4xl mx-auto">
			{#if content.sentence && content.answer}
				{@const parsed = parseSentence(content.sentence)}
				<!-- Question Display -->
				<div class="text-center mb-8">
					<h2 class="text-4xl font-bold text-gray-800 mb-6">Fill in the Blank</h2>
					
					<!-- Sentence with blank -->
					<div class="text-2xl leading-relaxed text-gray-700 mb-8 max-w-3xl mx-auto">
						<div class="flex flex-wrap items-center justify-center gap-3">
							<span>{parsed.before}</span>
							<div class="inline-block min-w-[200px] border-b-4 border-dashed border-gray-400 text-center py-2">
								{#if showCorrectAnswer}
									<span class="text-green-600 font-bold">{content.answer}</span>
								{:else}
									<span class="invisible">placeholder</span>
								{/if}
							</div>
							{#if parsed.after}
								<span>{parsed.after}</span>
							{/if}
						</div>
					</div>
				</div>

				<!-- Teacher Control Buttons -->
				{#if showResponseChart}
					<div class="flex justify-center gap-4 mb-8">
						<Button 
							onclick={toggleShowResponses}
							variant={showResponses ? "default" : "outline"}
							size="lg"
							class="text-lg px-8 py-3"
						>
							{showResponses ? 'Hide Responses' : `Show Responses (${studentResponses.length})`}
						</Button>
						
						{#if showResponses}
							<Button 
								onclick={toggleShowCorrectAnswer}
								variant={showCorrectAnswer ? "default" : "outline"}
								size="lg"
								class="text-lg px-8 py-3 bg-green-600 hover:bg-green-700 text-white"
							>
								{showCorrectAnswer ? 'Hide Answer' : 'Reveal Answer'}
							</Button>
						{/if}
					</div>
				{/if}

				<!-- Simple Student Response List -->
				{#if showResponseChart && showResponses}
					<div class="mt-8 bg-white rounded-lg shadow-lg p-6">
						<div class="flex items-center justify-between mb-6">
							<h3 class="text-2xl font-semibold text-gray-800">Student Responses</h3>
							<div class="text-lg text-gray-600">
								{studentResponses.length} response{studentResponses.length !== 1 ? 's' : ''}
							</div>
						</div>

						{#if studentResponses.length > 0}
							{@const responseGroups = studentResponses.reduce((groups: Record<string, any[]>, response) => {
								const answer = response.answer || 'No answer';
								if (!groups[answer]) {
									groups[answer] = [];
								}
								groups[answer].push(response);
								return groups;
							}, {})}
							{@const maxCount = Math.max(...Object.values(responseGroups).map((group: any[]) => group.length))}
							
							<div class="space-y-4">
								{#each Object.entries(responseGroups).sort(([,a], [,b]) => (b as any[]).length - (a as any[]).length) as [answer, responses]}
									{@const count = (responses as any[]).length}
									{@const isCorrect = answer.trim() === content.answer}
									{@const fontSize = Math.min(1 + (count / maxCount) * 1.5, 2.5)}
									{@const studentNames = (responses as any[]).map((r: any) => r.studentName).filter(Boolean).join(', ')}
									
									<div class="p-6 rounded-lg border transition-all duration-200 {isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}">
										<div class="flex items-start justify-between">
											<div class="flex items-start gap-4 flex-1">
												{#if isCorrect}
													<CheckIcon class="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
												{:else}
													<XIcon class="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
												{/if}
												<div class="flex-1">
													<div 
														class="font-bold text-gray-900 leading-tight"
														style="font-size: {fontSize}rem;"
													>
														"{answer}"
													</div>
													{#if studentNames}
														<div class="text-sm text-gray-600 mt-2">
															{studentNames}
														</div>
													{/if}
												</div>
											</div>
											<div class="flex flex-col items-end gap-1 ml-4">
												<div class="text-lg font-bold {isCorrect ? 'text-green-700' : 'text-gray-700'}">
													{count}
												</div>
												<div class="text-xs text-gray-500">
													{count === 1 ? 'student' : 'students'}
												</div>
												<div class="text-xs {isCorrect ? 'text-green-600' : 'text-red-600'} font-medium">
													{isCorrect ? 'Correct' : 'Incorrect'}
												</div>
											</div>
										</div>
									</div>
								{/each}
							</div>

							{#if showCorrectAnswer}
								<div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
									<div class="text-lg font-semibold text-blue-800">
										Correct Answer: "{content.answer}"
									</div>
								</div>
							{/if}
						{:else}
							<div class="text-center py-8">
								<p class="text-gray-500 text-lg">Waiting for student responses...</p>
							</div>
						{/if}
					</div>
				{/if}
			{:else}
				<!-- Empty state -->
				<div class="text-center">
					<PenToolIcon class="text-gray-400 mx-auto h-24 w-24 mb-6" />
					<p class="text-gray-500 text-3xl font-medium">No question available</p>
					<p class="text-gray-400 text-xl">Question not yet configured</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
