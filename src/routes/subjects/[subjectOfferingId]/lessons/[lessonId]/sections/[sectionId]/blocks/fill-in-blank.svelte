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
        onUpdate = () => {}
    } = $props();

    let isEditing = $state(false);
    let hasSubmitted = $state(false);
    let userAnswer = $state('');

    // Edit mode state
    let sentenceText = $state('');
    let correctAnswer = $state('');

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

    function initializeEditingState() {
        sentenceText = content.sentence || '';
        correctAnswer = content.answer || '';
        
        // Reset quiz state when entering edit mode
        hasSubmitted = false;
        userAnswer = '';
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
        isEditing = false;
    }

    $effect(() => {
        if (content.sentence && content.answer) {
            // Reset quiz state when content changes
            hasSubmitted = false;
            userAnswer = '';
        }
    });
</script>

<div class="flex w-full flex-col gap-4">
    {#if isEditing}
        <!-- EDIT MODE: Shows form for creating/editing the fill-in-blank question -->
        <Card.Root>
            <Card.Header>
                <Card.Title class="flex items-center gap-2">
                    <PenToolIcon class="h-4 w-4" />
                    Edit Fill-in-the-Blank Question
                </Card.Title>
            </Card.Header>
            <Card.Content class="space-y-6">
                
                <!-- SENTENCE INPUT SECTION -->
                <div class="space-y-2">
                    <Label for="sentence-text">Sentence</Label>
                    <Textarea
                        id="sentence-text"
                        bind:value={sentenceText}
                        placeholder="Enter your sentence with _____ where the blank should be..."
                        class="interactive min-h-[80px] resize-none"
                    />
                    <p class="text-xs text-muted-foreground">
                        Use _____ (5 underscores) to indicate where the blank should appear in the sentence.
                    </p>
                </div>

                <!-- ANSWER INPUT SECTION -->
                <div class="space-y-2">
                    <Label for="correct-answer">Correct Answer</Label>
                    <Input
                        id="correct-answer"
                        bind:value={correctAnswer}
                        placeholder="Enter the correct answer..."
                        class="interactive"
                    />
                </div>

                <!-- PREVIEW SECTION -->
                {#if sentenceText && correctAnswer}
                    {@const parsed = parseSentence(sentenceText)}
                    <div class="space-y-2">
                        <Label>Preview</Label>
                        <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                            <div class="text-lg leading-relaxed flex items-center flex-wrap gap-2">
                                <span>{parsed.before}</span>
                                <span class="inline-block border-2 border-primary/30 min-w-[140px] max-w-[200px] text-center bg-background px-3 py-2 mx-2 rounded-lg shadow-sm font-medium">
                                    {correctAnswer}
                                </span>
                                <span>{parsed.after}</span>
                            </div>
                        </div>
                    </div>
                {/if}

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
        <!-- VIEW MODE: Shows the completed fill-in-blank question -->
        <div class="group relative">
            
            {#if content.sentence && content.answer}
                <!-- Display the complete question -->
                <Card.Root>
                    <Card.Content class="pt-6">
                        
                        <!-- Question Instructions -->
                        <div class="mb-6">
                            <h3 class="text-lg font-medium mb-2">Fill in the Blank</h3>
                            <p class="text-sm text-muted-foreground">Complete the sentence by filling in the blank.</p>
                        </div>
            
                        <!-- Sentence with Input -->
                        {@const parsed = parseSentence(content.sentence)}
                        <div class="mb-6">
                <div class="text-lg leading-relaxed flex items-center flex-wrap gap-2">
                    <span>{parsed.before}</span>
                    <div class="relative inline-block mx-2">
                        <Input
                            bind:value={userAnswer}
                            disabled={hasSubmitted}
                            placeholder="Your answer"
                            class={`min-w-[140px] max-w-[200px] text-center font-medium transition-all duration-200 ${
                                hasSubmitted 
                                    ? isAnswerCorrect() 
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-200 shadow-sm' 
                                        : 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-200 shadow-sm'
                                    : 'border-2 border-primary/30 focus:border-primary bg-background hover:border-primary/50 shadow-sm'
                            }`}
                            style="border-radius: 8px; padding: 8px 12px;"
                        />
                        {#if hasSubmitted}
                            <div class="absolute -right-10 top-1/2 transform -translate-y-1/2">
                                {#if isAnswerCorrect()}
                                    <div class="bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
                                        <CheckIcon class="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </div>
                                {:else}
                                    <div class="bg-red-100 dark:bg-red-900/30 p-1 rounded-full">
                                        <XIcon class="w-4 h-4 text-red-600 dark:text-red-400" />
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>
                    {#if parsed.after}
                        <span>{parsed.after}</span>
                    {/if}
                </div>
            </div>

                        <!-- Feedback Section -->
                        {#if hasSubmitted}
                            <div class={`p-4 rounded-lg border mb-6 ${
                                isAnswerCorrect() 
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            }`}>
                                {#if isAnswerCorrect()}
                                    <div class="flex items-center gap-2 text-green-800 dark:text-green-200">
                                        <CheckIcon class="w-5 h-5" />
                                        <span class="font-medium">Correct!</span>
                                    </div>
                                    <p class="text-green-700 dark:text-green-300 text-sm mt-1">
                                        Well done! You got the right answer.
                                    </p>
                                {:else}
                                    <div class="flex items-center gap-2 text-red-800 dark:text-red-200">
                                        <XIcon class="w-5 h-5" />
                                        <span class="font-medium">Incorrect</span>
                                    </div>
                                    <p class="text-red-700 dark:text-red-300 text-sm mt-1">
                                        The correct answer is: <strong>{content.answer}</strong>
                                    </p>
                                {/if}
                            </div>
                        {/if}

                        <!-- Submit/Reset Button -->
                        {#if !hasSubmitted}
                            <div class="mt-6">
                                <Button 
                                    onclick={submitAnswer}
                                    disabled={!userAnswer.trim()}
                                    class="interactive w-full"
                                >
                                    Submit Answer
                                </Button>
                            </div>
                        {:else}
                            <div class="mt-6 flex gap-2">
                                <Button onclick={resetQuiz} variant="outline" class="interactive flex-1">
                                    Try Again
                                </Button>
                            </div>
                        {/if}

                    </Card.Content>
                </Card.Root>

            {:else}
                <!-- Empty state when no question is created yet -->
                <div class="flex h-48 w-full items-center justify-center rounded-lg border border-dashed">
                    <div class="text-center">
                        <PenToolIcon class="text-muted-foreground mx-auto h-12 w-12" />
                        <p class="text-muted-foreground mt-2 text-sm">No fill-in-blank question created</p>
                        <p class="text-muted-foreground text-xs">Click edit to create a fill-in-blank question</p>
                    </div>
                </div>
            {/if}

            <!-- FLOATING EDIT BUTTON -->
            <Button
                onclick={() => {
                    initializeEditingState();
                    isEditing = true;
                }}
                class={"interactive absolute top-2 right-2"}
                variant="outline"
                size="sm"
            >
                <EditIcon/>
            </Button>

        </div>
    {/if}
</div>