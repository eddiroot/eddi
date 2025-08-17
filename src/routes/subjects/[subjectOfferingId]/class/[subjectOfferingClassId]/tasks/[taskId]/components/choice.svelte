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
	import { ViewMode } from '../constants';
	import type { ChoiceBlockProps } from './blockTypes';
	import { taskStatusEnum } from '$lib/enums';

	let {
		initialConfig,
		onConfigUpdate,
		initialResponse,
		onResponseUpdate,
		viewMode,
		taskStatus
	}: ChoiceBlockProps = $props();

	let config = $state(initialConfig);
	let selectedAnswers = $state<string[]>([]);

	let isMultiAnswer = $derived(() => {
		return config.options.filter((option) => option.isAnswer).length > 1;
	});

	function toggleAnswer(option: string) {
		if (taskStatus == taskStatusEnum.locked || taskStatus == taskStatusEnum.graded) return;

		if (!isMultiAnswer()) {
			// Single choice - clear others and set this one
			selectedAnswers = [option];
		} else {
			if (selectedAnswers.includes(option)) {
				selectedAnswers = selectedAnswers.filter((ans) => ans !== option);
			} else {
				selectedAnswers = [...selectedAnswers, option];
			}
		}
	}

	function getCorrectAnswers() {
		return config.options.filter((opt) => opt.isAnswer).map((opt) => opt.text);
	}

	function isAnswerCorrect(option: string): boolean {
		return config.options.some(
			(opt) => opt.text.toLowerCase() === option.toLowerCase() && opt.isAnswer
		);
	}

	async function addOption() {
		config.options.push({ text: '', isAnswer: false });
		onConfigUpdate(config);
	}

	async function removeOption(option: string) {
		config.options = config.options.filter((opt) => opt.text !== option);
		onConfigUpdate(config);
	}

	async function toggleCorrect(option: string) {
		const index = config.options.findIndex((opt) => opt.text === option);
		if (index !== -1) {
			config.options[index].isAnswer = !config.options[index].isAnswer;
			onConfigUpdate(config);
		}
	}
</script>

<div class="flex w-full flex-col gap-4">
	{#if viewMode === ViewMode.EDIT}
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
						bind:value={config.question}
						onblur={async () => {
							await onConfigUpdate(config);
						}}
						placeholder="Enter your multiple choice question..."
						class="min-h-[80px] resize-none"
					/>
				</div>

				<!-- ANSWER OPTIONS SECTION -->
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<Label>Answer Options</Label>
						<Button variant="outline" size="sm" onclick={addOption} class="flex items-center gap-2">
							<PlusIcon class="h-4 w-4" />
							Add Option
						</Button>
					</div>
					<div class="space-y-3">
						{#each config.options as option, index}
							<div class="flex items-start gap-3 rounded-lg border p-3">
								<!-- Correct Answer Checkbox -->
								<button
									type="button"
									onclick={() => toggleCorrect(option.text)}
									class="mt-1 text-green-600 transition-colors hover:text-green-700"
									title={getCorrectAnswers().includes(option.text)
										? 'Mark as incorrect'
										: 'Mark as correct'}
									disabled={!option.text.trim()}
								>
									{#if getCorrectAnswers().includes(option.text)}
										<CheckCircleIcon class="h-5 w-5" />
									{:else}
										<CircleIcon class="h-5 w-5" />
									{/if}
								</button>

								<!-- Answer Text Input -->
								<div class="flex-1">
									<Input
										bind:value={config.options[index].text}
										onblur={async () => {
											await onConfigUpdate(config);
										}}
										placeholder={`Option ${index + 1}`}
										class="w-full"
									/>
								</div>

								<!-- Delete Button (only show if more than 2 options) -->
								{#if config.options.length > 2}
									<Button variant="ghost" size="sm" onclick={() => removeOption(option.text)}>
										<TrashIcon />
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
	{:else if viewMode === ViewMode.VIEW}
		<!-- VIEW MODE: Shows the completed multiple choice question -->
		<div class="group relative">
			{#if config.question && config.options?.length > 0}
				<!-- Display the complete question -->
				<Card.Root>
					<Card.Content>
						<!-- Question Text -->
						<div class="mb-6">
							<h3 class="mb-2 text-lg font-medium">{config.question}</h3>
							{#if isMultiAnswer()}
								<p class="text-muted-foreground text-sm">Select all correct answers</p>
							{:else}
								<p class="text-muted-foreground text-sm">Select one answer</p>
							{/if}
						</div>

						<!-- Answer Options -->
						<div class="space-y-3">
							{#each config.options as option, index}
								{@const isSelected = selectedAnswers.includes(option.text)}
								{@const isCorrect = isAnswerCorrect(option.text)}
								{@const showFeedback = taskStatus === taskStatusEnum.graded}
								<button
									class={`interactive flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all duration-200
                                        ${!showFeedback ? 'cursor-pointer' : 'cursor-default'}
                                        ${isSelected && !showFeedback ? 'border-blue-200' : ''}
                                        ${isSelected && isCorrect && showFeedback ? 'border-2 border-green-500 bg-green-50' : ''}
                                        ${isSelected && !isCorrect && showFeedback ? 'border-red-200 bg-red-50' : ''}
                                        ${!isSelected && isCorrect && showFeedback ? 'border-2 border-dashed border-yellow-400 bg-yellow-50' : ''}
                                    `}
									onclick={() => toggleAnswer(option.text)}
									disabled={showFeedback}
								>
									<div class="mt-1 flex-shrink-0">
										{#if isMultiAnswer()}
											{#if !showFeedback}
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
											{#if !showFeedback}
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
                                            ${isSelected && isCorrect && showFeedback ? 'font-semibold text-green-800' : ''}
                                            ${isSelected && !isCorrect && showFeedback ? 'text-red-800' : ''}
                                            ${!isSelected && isCorrect && showFeedback ? 'font-medium text-yellow-800' : ''}
                                        `}
										>
											{option}
										</span>
										{#if !isSelected && isCorrect && showFeedback}
											<span class="ml-2 text-xs font-medium text-yellow-700">(Correct Answer)</span>
										{/if}
									</span>
								</button>
							{/each}
						</div>
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
	{:else}
		<!-- No config placeholder -->
		<div></div>
	{/if}
</div>
