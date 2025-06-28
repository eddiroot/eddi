<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import EditIcon from '@lucide/svelte/icons/edit';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import HelpCircleIcon from '@lucide/svelte/icons/help-circle';
	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';

	interface AnswerOption {
		id: string;           
		text: string;        
		isCorrect: boolean;   
	}

	interface MultipleChoiceContent {
		question: string;           
		options: AnswerOption[];    
		explanation?: string; 
	}

	// Component props using Svelte 5 syntax
	let {
		content = {
			question: '',
			options: [],
			explanation: ''
		} as MultipleChoiceContent,
		onUpdate = () => {}
	} = $props();

	let isEditing = $state(false);
	let hasSubmitted = $state(false);
	let selectedAnswers = $state<Set<string>>(new Set());

	let questionText = $state('');
	let options = $state<AnswerOption[]>([]);
	let explanation = $state('');

	// Functions for student interaction
	function toggleAnswer(optionId: string) {
		if (hasSubmitted) return; // Prevent changes after submission
		
		if (selectedAnswers.has(optionId)) {
			selectedAnswers.delete(optionId);
		} else {
			selectedAnswers.add(optionId);
		}
		selectedAnswers = new Set(selectedAnswers); // Trigger reactivity
	}

	function submitAnswers() {
		hasSubmitted = true;
	}

	function resetQuiz() {
		hasSubmitted = false;
		selectedAnswers = new Set();
	}

	function isAnswerCorrect(optionId: string): boolean {
		return content.options?.find(opt => opt.id === optionId)?.isCorrect || false;
	}

	function getAnswerStatus(optionId: string): 'correct' | 'incorrect' | 'neutral' {
		if (!hasSubmitted) return 'neutral';
		
		const isSelected = selectedAnswers.has(optionId);
		const isCorrect = isAnswerCorrect(optionId);
		
		if (isSelected && isCorrect) return 'correct';
		if (isSelected && !isCorrect) return 'incorrect';
		if (!isSelected && isCorrect) return 'correct'; // Show correct answers even if not selected
		return 'neutral';
	}

    /**
	 * Generates a simple unique ID for new answer options
	 * In a real app, you might use crypto.randomUUID() or a proper UUID library
	 */
	function generateUniqueId(): string {
		return `option_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

    function initializeEditingState() {
        questionText = content.question || '';
        explanation = content.explanation || '';
        options = content.options?.map(option => ({
            id: option.id,
            text: option.text,
            isCorrect: option.isCorrect
        })) || [];

        // Ensure we have at least 2 options to start with
        if (options.length < 2) {
            options = [
                { id: generateUniqueId(), text: '', isCorrect: false },
                { id: generateUniqueId(), text: '', isCorrect: false }
            ];
        }

        // Reset quiz state when entering edit mode
        hasSubmitted = false;
        selectedAnswers = new Set();
    }
        
    function addNewOption() {
        options = [
            ...options,
            { id: generateUniqueId(), text: '', isCorrect: false }
        ];
    }

    function removeOption(optionId: string) {
        if (options.length <= 2) {
            // Could show a toast notification here: "Multiple choice needs at least 2 options"
            return;
        }
        options = options.filter(option => option.id !== optionId);
    }

    function toggleCorrect(optionId: string) {
        const currentlyCorrect = options.filter(opt => opt.isCorrect);
        const targetOption = options.find(opt => opt.id === optionId);
        // Prevent unchecking the last correct answer
        if (targetOption?.isCorrect && currentlyCorrect.length === 1) {
            // Could show a toast: "At least one answer must be correct"
            return;
        } 
        // Toggle the correct status
        options = options.map(option =>
            option.id === optionId 
                ? { ...option, isCorrect: !option.isCorrect }
                : option
        );
    }
	
	function saveChanges() {
		if (!questionText.trim()) {
			// In a real app, you'd show proper error handling
			alert('Question text is required');
			return;
		}

		const validOptions = options.filter(opt => opt.text.trim());
		if (validOptions.length < 2) {
			alert('At least 2 options with text are required');
			return;
		}

		const correctOptions = validOptions.filter(opt => opt.isCorrect);
		if (correctOptions.length === 0) {
			alert('At least one option must be marked as correct');
			return;
		}

		const newContent: MultipleChoiceContent = {
			question: questionText.trim(),
			options: validOptions,
			explanation: explanation.trim()
		};

		content = newContent;
		onUpdate(newContent);
		isEditing = false;
	}

</script>

<div class="flex w-full flex-col gap-4">
	{#if isEditing}
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
						placeholder="Enter your multiple choice question..."
						class="interactive min-h-[80px] resize-none"
					/>
					<p class="text-xs text-muted-foreground">
						Write a clear, specific question for students to answer
					</p>
				</div>

				<!-- ANSWER OPTIONS SECTION -->
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<Label>Answer Options</Label>
						<Button
							variant="outline"
							size="sm"
							onclick={addNewOption}
							class="interactive flex items-center gap-2"
						>
							<PlusIcon class="h-4 w-4" />
							Add Option
						</Button>
					</div>
					<div class="space-y-3">
						{#each options as option, index (option.id)}
							<div class="flex items-start gap-3 p-3 border rounded-lg">
								
								<!-- Correct Answer Checkbox -->
								<button
									type="button"
									onclick={() => toggleCorrect(option.id)}
									class="interactive mt-1 text-green-600 hover:text-green-700 transition-colors"
									title={option.isCorrect ? 'Mark as incorrect' : 'Mark as correct'}
								>
									{#if option.isCorrect}
										<CheckCircleIcon class="h-5 w-5" />
									{:else}
										<CircleIcon class="h-5 w-5" />
									{/if}
								</button>

								<!-- Answer Text Input -->
								<div class="flex-1">
									<Input
										bind:value={option.text}
										placeholder={`Option ${index + 1}`}
										class="interactive w-full"
									/>
								</div>

								<!-- Delete Button (only show if more than 2 options) -->
								{#if options.length > 2}
									<Button
										variant="ghost"
										size="sm"
										onclick={() => removeOption(option.id)}
										class="interactive text-red-600 hover:text-red-700 hover:bg-red-50"
									>
										<TrashIcon class="h-4 w-4" />
									</Button>
								{/if}
							</div>
						{/each}
					</div>

					<p class="text-xs text-muted-foreground">
						Click the circle icon to mark correct answers. At least one answer must be correct.
					</p>
				</div>

				<!-- EXPLANATION SECTION (OPTIONAL) -->
				<div class="space-y-2">
					<Label for="explanation-text">Explanation (Optional)</Label>
					<Textarea
						id="explanation-text"
						bind:value={explanation}
						placeholder="Explain why the correct answer(s) are right..."
						class="interactive min-h-[60px] resize-none"
					/>
					<p class="text-xs text-muted-foreground">
						This explanation will be shown to students after they answer
					</p>
				</div>

				<!-- SAVE/CANCEL BUTTONS -->
				<div class="flex gap-2">
					<Button onclick={saveChanges} class="interactive">Save Question</Button>
					<Button variant="outline" onclick={() => (isEditing = false)} class="interactive">
						Cancel
					</Button>
				</div>

			</Card.Content>
		</Card.Root>

	{:else}
		<!-- VIEW MODE: Shows the completed multiple choice question -->
		<div class="group relative">
			
			{#if content.question && content.options?.length > 0}
				<!-- Display the complete question -->
				<Card.Root>
					<Card.Content class="pt-6">
						
						<!-- Question Text -->
						<div class="mb-6">
							<h3 class="text-lg font-medium mb-2">{content.question}</h3>
						</div>

						<!-- Answer Options -->
						<div class="space-y-3">
							{#each content.options as option, index}
								{@const answerStatus = getAnswerStatus(option.id)}
								{@const isSelected = selectedAnswers.has(option.id)}
								{@const isCorrect = isAnswerCorrect(option.id)}
								<button
									class={`interactive flex items-start gap-3 p-3 border rounded-lg transition-all duration-200 w-full text-left
										${!hasSubmitted ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'}
										${isSelected && !hasSubmitted ? 'bg-blue-50 border-blue-200' : ''}
										${isSelected && isCorrect && hasSubmitted ? 'bg-green-50 border-green-500 border-2' : ''}
										${isSelected && !isCorrect && hasSubmitted ? 'bg-red-50 border-red-200' : ''}
										${!isSelected && isCorrect && hasSubmitted ? 'bg-yellow-50 border-yellow-400 border-2 border-dashed' : ''}
									`}
									onclick={() => toggleAnswer(option.id)}
									disabled={hasSubmitted}
								>
									<!-- Selection indicator circle -->
									<div class="mt-1 flex-shrink-0">
										{#if !hasSubmitted}
											{#if isSelected}
												<div class="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
													<div class="w-2 h-2 rounded-full bg-white"></div>
												</div>
											{:else}
												<div class="w-5 h-5 rounded-full border-2 border-gray-300"></div>
											{/if}
										{:else}
											<!-- Post-submission feedback icons -->
											{#if isSelected && isCorrect}
												<!-- Correct guess - solid green check -->
												<div class="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
													<CheckIcon class="w-3 h-3 text-white" />
												</div>
											{:else if isSelected && !isCorrect}
												<!-- Incorrect guess - red X -->
												<div class="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center">
													<XIcon class="w-3 h-3 text-white" />
												</div>
											{:else if !isSelected && isCorrect}
												<!-- Unselected correct answer - outlined check with yellow background -->
												<div class="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center">
													<CheckIcon class="w-3 h-3 text-yellow-900" />
												</div>
											{:else}
												<!-- Unselected incorrect answer - neutral -->
												<div class="w-5 h-5 rounded-full border-2 border-gray-300"></div>
											{/if}
										{/if}
									</div>
									
									<!-- Option text with letter prefix -->
									<span class="flex-1">
										<span class="font-medium text-sm text-gray-600 mr-2">
											{String.fromCharCode(65 + index)}.
										</span>
										<span class={`
											${isSelected && isCorrect && hasSubmitted ? 'text-green-800 font-semibold' : ''}
											${isSelected && !isCorrect && hasSubmitted ? 'text-red-800' : ''}
											${!isSelected && isCorrect && hasSubmitted ? 'text-yellow-800 font-medium' : ''}
										`}>
											{option.text}
										</span>
										{#if !isSelected && isCorrect && hasSubmitted}
											<span class="ml-2 text-xs text-yellow-700 font-medium">(Correct Answer)</span>
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
									class="interactive w-full"
								>
									Submit Answer{selectedAnswers.size > 1 ? 's' : ''}
								</Button>
							</div>
						{:else}
							<div class="mt-6 flex gap-2">
								<Button onclick={resetQuiz} variant="outline" class="interactive flex-1">
									Try Again
								</Button>
							</div>
						{/if}

						<!-- Show explanation only after submission -->
						{#if hasSubmitted && content.explanation}
							<div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
								<p class="text-sm text-blue-800">
									<strong>Explanation:</strong> {content.explanation}
								</p>
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
						<p class="text-muted-foreground text-xs">Click edit to create a multiple choice question</p>
					</div>
				</div>
			{/if}

			<!-- FLOATING EDIT BUTTON -->
			<Button
				onclick={() => {
					initializeEditingState();  // Populate editing state
					isEditing = true;          // Enter edit mode
				}}
				class="interactive absolute top-2 right-2"
				size="sm"
			>
				<EditIcon class="h-4 w-4" />
			</Button>

		</div>
	{/if}
</div>
