<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import HelpCircleIcon from '@lucide/svelte/icons/help-circle';
	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';
	import { effect as zodEffect } from 'zod';

	interface MultipleChoiceContent {
		question: string;
		options: string[];
		answer: string | string[];
		multiple: boolean;
	}

	// Component props using Svelte 5 syntax
	let {
		content = {
			question: '',
			options: [],
			answer: '',
			multiple: false
		} as MultipleChoiceContent,
		isEditMode = true,
		onUpdate = () => {}
	} = $props();

	// tempory state for preview
	let hasSubmitted = $state(false);
	let selectedAnswers = $state<Set<string>>(new Set());

	// Edit mode states
	let questionText = $state(content.question || '');
	let options = $state<string[]>(content.options || []);
	let correctAnswers = $state<Set<string>>(
		new Set(
			content.answer ? (Array.isArray(content.answer) ? content.answer : [content.answer]) : []
		)
	);

	// Functions for student interaction
	function toggleAnswer(option: string) {
		if (hasSubmitted) return; // Prevent changes after submission

		if (!content.multiple) {
			// Single choice - clear others and set this one
			selectedAnswers = new Set([option]);
		} else {
			// Multiple choice - toggle this option
			if (selectedAnswers.has(option)) {
				selectedAnswers.delete(option);
			} else {
				selectedAnswers.add(option);
			}
			selectedAnswers = new Set(selectedAnswers); // Trigger reactivity
		}
	}

	function submitAnswers() {
		hasSubmitted = true;
	}

	function resetQuiz() {
		hasSubmitted = false;
		selectedAnswers = new Set();
	}

	// Updated function with case-insensitive comparison and proper type checking
	function isAnswerCorrect(option: string): boolean {
		if (Array.isArray(content.answer)) {
			// For multiple choice, check if option matches any correct answer (case-insensitive)
			return content.answer.some((correctAnswer) => {
				// Convert both to strings and compare case-insensitively
				const answerStr = String(correctAnswer).toLowerCase();
				const optionStr = option.toLowerCase();
				return answerStr === optionStr;
			});
		} else if (content.answer !== null && content.answer !== undefined) {
			// For single choice, compare with the single correct answer (case-insensitive)
			// Convert both to strings to handle boolean/string mismatches
			const answerStr = String(content.answer).toLowerCase();
			const optionStr = option.toLowerCase();
			return answerStr === optionStr;
		}
		// If content.answer is null or undefined, return false
		return false;
	}

	function getAnswerStatus(option: string): 'correct' | 'incorrect' | 'neutral' {
		if (!hasSubmitted) return 'neutral';

		const isSelected = selectedAnswers.has(option);
		const isCorrect = isAnswerCorrect(option);

		if (isSelected && isCorrect) return 'correct';
		if (isSelected && !isCorrect) return 'incorrect';
		if (!isSelected && isCorrect) return 'correct'; // Show correct answers even if not selected
		return 'neutral';
	}

	function addNewOption() {
		options = [...options, ''];
	}

	function removeOption(index: number) {
		if (options.length <= 2) {
			return;
		}
		const removedOption = options[index];
		options = options.filter((_, i) => i !== index);
		// Remove from correct answers if it was selected
		correctAnswers.delete(removedOption);
		correctAnswers = new Set(correctAnswers);
		// Auto-save after removing
		saveChanges();
	}

	// Updated toggleCorrect function to also handle case-insensitive comparison
	function toggleCorrect(option: string) {
		// Always allow multiple correct answers - user can toggle any option
		if (correctAnswers.has(option)) {
			// Prevent removing the last correct answer
			if (correctAnswers.size === 1) {
				return;
			}
			correctAnswers.delete(option);
		} else {
			correctAnswers.add(option);
		}
		correctAnswers = new Set(correctAnswers);
		// Auto-save after toggling correct answer
		saveChanges();
	}

	// Updated saveChanges function to ensure consistent casing
	function saveChanges() {
		// Only save if we have a question
		if (!questionText.trim()) {
			return; // Don't show alert, just don't save yet
		}

		const validOptions = options.filter((opt) => opt.trim()).map((opt) => opt.trim());
		if (validOptions.length < 2) {
			return; // Don't save until we have at least 2 valid options
		}

		// Filter correct answers to only include valid options (case-insensitive matching)
		const validCorrectAnswers = Array.from(correctAnswers).filter((correctAns) =>
			validOptions.some((validOpt) => validOpt.toLowerCase() === correctAns.toLowerCase())
		);

		if (validCorrectAnswers.length === 0) {
			return; // Don't save until we have at least one correct answer
		}

		// Determine if it's multiple choice based on number of correct answers
		const isMultiple = validCorrectAnswers.length > 1;

		const newContent: MultipleChoiceContent = {
			question: questionText.trim(),
			options: validOptions,
			answer: isMultiple ? validCorrectAnswers : validCorrectAnswers[0],
			multiple: isMultiple
		};

		content = newContent;
		onUpdate(newContent);
	}

	$effect(() => {
		questionText = content.question || '';
		options = content.options || [];
		correctAnswers = new Set(
			content.answer ? (Array.isArray(content.answer) ? content.answer : [content.answer]) : []
		);

		hasSubmitted = false; // Reset quiz state when content changes
		selectedAnswers = new Set();
	});
</script>

<div class="flex w-full flex-col gap-4">
	{#if isEditMode}
		<!-- EDIT MODE: Shows form for creating/editing the multiple choice question -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<HelpCircleIcon class="h-4 w-4" />
					Edit Multiple Choice Question
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-6">
				<!-- QUESTION INPUT SECTION -->
				<div class="space-y-2">
					<Label for="question-text">Question</Label>
					<Textarea
						id="question-text"
						bind:value={questionText}
						onblur={saveChanges}
						placeholder="Enter your multiple choice question..."
						class="min-h-[80px] resize-none"
					/>
				</div>

				<!-- ANSWER OPTIONS SECTION -->
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<Label>Answer Options</Label>
						<Button
							variant="outline"
							size="sm"
							onclick={addNewOption}
							class="flex items-center gap-2"
						>
							<PlusIcon class="h-4 w-4" />
							Add Option
						</Button>
					</div>
					<div class="space-y-3">
						{#each options as option, index}
							<div class="flex items-start gap-3 rounded-lg border p-3">
								<!-- Correct Answer Checkbox -->
								<button
									type="button"
									onclick={() => toggleCorrect(option)}
									class="mt-1 text-green-600 transition-colors hover:text-green-700"
									title={correctAnswers.has(option) ? 'Mark as incorrect' : 'Mark as correct'}
									disabled={!option.trim()}
								>
									{#if correctAnswers.has(option)}
										<CheckCircleIcon class="h-5 w-5" />
									{:else}
										<CircleIcon class="h-5 w-5" />
									{/if}
								</button>

								<!-- Answer Text Input -->
								<div class="flex-1">
									<Input
										bind:value={options[index]}
										onblur={saveChanges}
										placeholder={`Option ${index + 1}`}
										class="w-full"
									/>
								</div>

								<!-- Delete Button (only show if more than 2 options) -->
								{#if options.length > 2}
									<Button
										variant="ghost"
										size="sm"
										onclick={() => removeOption(index)}
										class="text-red-600 hover:bg-red-50 hover:text-red-700"
									>
										<TrashIcon class="h-4 w-4" />
									</Button>
								{/if}
							</div>
						{/each}
					</div>

					<p class="text-muted-foreground text-xs">
						Click the circle icon to mark correct answers. You can select multiple correct answers.
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	{:else}
		<!-- VIEW MODE: Shows the completed multiple choice question -->
		<div class="group relative">
			{#if content.question && content.options?.length > 0}
				<!-- Display the complete question -->
				<Card.Root>
					<Card.Content>
						<!-- Question Text -->
						<div class="mb-6">
							<h3 class="mb-2 text-lg font-medium">{content.question}</h3>
							{#if content.multiple}
								<p class="text-muted-foreground text-sm">Select all correct answers</p>
							{:else}
								<p class="text-muted-foreground text-sm">Select one answer</p>
							{/if}
						</div>

						<!-- Answer Options -->
						<div class="space-y-3">
							{#each content.options as option, index}
								{@const answerStatus = getAnswerStatus(option)}
								{@const isSelected = selectedAnswers.has(option)}
								{@const isCorrect = isAnswerCorrect(option)}
								<button
									class={`interactive flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all duration-200
                                        ${!hasSubmitted ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'}
                                        ${isSelected && !hasSubmitted ? 'border-blue-200 bg-blue-50' : ''}
                                        ${isSelected && isCorrect && hasSubmitted ? 'border-2 border-green-500 bg-green-50' : ''}
                                        ${isSelected && !isCorrect && hasSubmitted ? 'border-red-200 bg-red-50' : ''}
                                        ${!isSelected && isCorrect && hasSubmitted ? 'border-2 border-dashed border-yellow-400 bg-yellow-50' : ''}
                                    `}
									onclick={() => toggleAnswer(option)}
									disabled={hasSubmitted}
								>
									<!-- Selection indicator -->
									<div class="mt-1 flex-shrink-0">
										{#if content.multiple}
											<!-- Checkbox style for multiple choice -->
											{#if !hasSubmitted}
												{#if isSelected}
													<div
														class="flex h-5 w-5 items-center justify-center rounded border-2 border-blue-600 bg-blue-600"
													>
														<CheckIcon class="h-3 w-3 text-white" />
													</div>
												{:else}
													<div class="h-5 w-5 rounded border-2 border-gray-300"></div>
												{/if}
											{:else if isSelected && isCorrect}
												<div
													class="flex h-5 w-5 items-center justify-center rounded border-2 border-green-600 bg-green-600"
												>
													<CheckIcon class="h-3 w-3 text-white" />
												</div>
											{:else if isSelected && !isCorrect}
												<div
													class="flex h-5 w-5 items-center justify-center rounded border-2 border-red-600 bg-red-600"
												>
													<XIcon class="h-3 w-3 text-white" />
												</div>
											{:else if !isSelected && isCorrect}
												<div
													class="flex h-5 w-5 items-center justify-center rounded border-2 border-yellow-400 bg-yellow-400"
												>
													<CheckIcon class="h-3 w-3 text-yellow-900" />
												</div>
											{:else}
												<div class="h-5 w-5 rounded border-2 border-gray-300"></div>
											{/if}
										{:else}
											<!-- Radio button style for single choice -->
											{#if !hasSubmitted}
												{#if isSelected}
													<div
														class="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600"
													>
														<div class="h-2 w-2 rounded-full bg-white"></div>
													</div>
												{:else}
													<div class="h-5 w-5 rounded-full border-2 border-gray-300"></div>
												{/if}
											{:else if isSelected && isCorrect}
												<div
													class="flex h-5 w-5 items-center justify-center rounded-full bg-green-600"
												>
													<CheckIcon class="h-3 w-3 text-white" />
												</div>
											{:else if isSelected && !isCorrect}
												<div
													class="flex h-5 w-5 items-center justify-center rounded-full bg-red-600"
												>
													<XIcon class="h-3 w-3 text-white" />
												</div>
											{:else if !isSelected && isCorrect}
												<div
													class="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400"
												>
													<CheckIcon class="h-3 w-3 text-yellow-900" />
												</div>
											{:else}
												<div class="h-5 w-5 rounded-full border-2 border-gray-300"></div>
											{/if}
										{/if}
									</div>

									<!-- Option text with letter prefix -->
									<span class="flex-1">
										<span class="mr-2 text-sm font-medium text-gray-600">
											{String.fromCharCode(65 + index)}.
										</span>
										<span
											class={`
                                            ${isSelected && isCorrect && hasSubmitted ? 'font-semibold text-green-800' : ''}
                                            ${isSelected && !isCorrect && hasSubmitted ? 'text-red-800' : ''}
                                            ${!isSelected && isCorrect && hasSubmitted ? 'font-medium text-yellow-800' : ''}
                                        `}
										>
											{option}
										</span>
										{#if !isSelected && isCorrect && hasSubmitted}
											<span class="ml-2 text-xs font-medium text-yellow-700">(Correct Answer)</span>
										{/if}
									</span>
								</button>
							{/each}
						</div>

						<!-- Submit/Reset Button -->
						{#if !hasSubmitted}
							<div class="mt-6">
								<Button
									onclick={submitAnswers}
									disabled={selectedAnswers.size === 0}
									class="w-full"
								>
									Submit Answer{selectedAnswers.size > 1 ? 's' : ''}
								</Button>
							</div>
						{:else}
							<div class="mt-6 flex gap-2">
								<Button onclick={resetQuiz} variant="outline" class="flex-1">Try Again</Button>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			{:else}
				<!-- Empty state when no question is created yet -->
				<div class="flex h-48 w-full items-center justify-center rounded-lg border border-dashed">
					<div class="text-center">
						<HelpCircleIcon class="text-muted-foreground mx-auto h-12 w-12" />
						<p class="text-muted-foreground mt-2 text-sm">No question created</p>
						<p class="text-muted-foreground text-xs">
							Click edit to create a multiple choice question
						</p>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
