<script lang="ts">
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import PenToolIcon from '@lucide/svelte/icons/pen-tool';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ViewMode } from '$lib/utils';
	import { view } from 'drizzle-orm/sqlite-core';

	interface textInputContent {
		question: string;
		placeholder?: string;
		maxLength?: number;
	}

	// Component props using Svelte 5 syntax
	let {
		content = {
			question: '',
			placeholder: 'Enter your answer here...',
			maxLength: 1000
		} as textInputContent,
		viewMode = ViewMode.VIEW,
		onUpdate = () => {}
	} = $props();

	let hasSubmitted = $state(false);
	let userAnswer = $state('');

	// Edit mode state
	let question = $state(content.question || '');
	let placeholder = $state(content.placeholder || 'Enter your answer here...');
	let maxLength = $state(content.maxLength || 1000);

	// Functions for student interaction
	function submitAnswer() {
		if (!userAnswer.trim()) return;
		hasSubmitted = true;
	}

	function resetQuiz() {
		hasSubmitted = false;
		userAnswer = '';
	}


	function saveChanges() {
		if (!question.trim()) {
			alert('Question is required');
			return;
		}

		const newContent: textInputContent = {
			question: question.trim(),
			placeholder: placeholder.trim() || 'Enter your answer here...',
			maxLength: maxLength || 1000
		};

		content = newContent;
		onUpdate(newContent);
	}

	// Update edit state when content prop changes
	$effect(() => {
		question = content.question || '';
		placeholder = content.placeholder || 'Enter your answer here...';
		maxLength = content.maxLength || 1000;
		// Reset quiz state
		hasSubmitted = false;
		userAnswer = '';
	});
</script>

<div class="flex w-full flex-col gap-4">
	{#if viewMode === ViewMode.EDIT}
		<!-- EDIT MODE: Shows form for creating/editing the text input question -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<PenToolIcon class="h-4 w-4" />
					Edit Question
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-6">
				<div class="space-y-2">
					<Label for="question-text">Question</Label>
					<Textarea
						id="question-text"
						bind:value={question}
						onblur={saveChanges}
						placeholder="Enter your question here..."
						class="min-h-[80px] resize-none"
					/>
				</div>
			</Card.Content>
		</Card.Root>
	{:else if viewMode === ViewMode.VIEW}
		<!-- STUDENT VIEW: Shows the question with text input -->
		{#if content.question}
			<Card.Root>
				<Card.Content class="pt-6">
					<!-- Question Text -->
					<div class="mb-4">
						<h3 class="mb-2 text-lg font-medium">{content.question}</h3>
						<p class="text-muted-foreground text-sm">Enter your response below</p>
					</div>

					<!-- Text Input Area -->
					<div class="space-y-4">
						<Textarea
							bind:value={userAnswer}
							placeholder={content.placeholder || 'Enter your answer here...'}
							maxlength={content.maxLength || 1000}
							class="min-h-[120px] resize-y"
							disabled={hasSubmitted}
						/>
						
						<!-- Character Count -->
						{#if content.maxLength}
							<div class="text-right">
								<span class="text-muted-foreground text-xs">
									{userAnswer.length} / {content.maxLength} characters
								</span>
							</div>
						{/if}

						<!-- Submit Button -->
						{#if !hasSubmitted}
							<div class="flex gap-2">
								<Button
									onclick={submitAnswer}
									disabled={!userAnswer.trim()}
									class="w-full"
								>
									Submit Answer
								</Button>
							</div>
						{:else}
							<div class="flex gap-2">
								<div class="rounded bg-green-100 px-4 py-2 text-green-800">
									✓ Answer Submitted
								</div>
								<button
									class="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
									onclick={resetQuiz}
								>
									Edit Answer
								</button>
							</div>
						{/if}
					</div>
				</Card.Content>
			</Card.Root>
		{/if}
	{/if}
</div>
