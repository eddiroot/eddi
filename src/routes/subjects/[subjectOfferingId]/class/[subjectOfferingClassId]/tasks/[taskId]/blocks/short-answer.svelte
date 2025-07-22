<script lang="ts">
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import PenToolIcon from '@lucide/svelte/icons/pen-tool';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ViewMode } from '$lib/utils';
	import EdraEditor from '$lib/components/edra/shadcn/editor.svelte';
	import EdraToolbar from '$lib/components/edra/shadcn/toolbar.svelte';
	import type { Content, Editor } from '@tiptap/core';
	import { createDebouncedSave, saveTaskBlockResponse, loadExistingResponse as loadExistingResponseFromAPI } from '../utils/auto-save.js';

	interface textInputContent {
		question: Content;
		placeholder?: string;
		maxLength?: number;
	}

	// Component props using Svelte 5 syntax
	let {
		content = {
			question: null,
			placeholder: 'Enter your answer here...',
			maxLength: 1000
		} as textInputContent,
		viewMode = ViewMode.VIEW,
		onUpdate = () => {},
		onPresentationAnswer = () => {},
		// New props for response saving
		blockId,
		taskId,
		classTaskId,
		subjectOfferingClassId,
		isPublished = false
	} = $props();

	let userAnswer = $state<Content>(null);

	// Edit mode state
	let question = $state<Content>(content.question || null);
	let placeholder = $state(content.placeholder || 'Enter your answer here...');
	let maxLength = $state(content.maxLength || 1000);

	// Editors for rich text editing
	let questionEditor = $state<Editor>();
	let answerEditor = $state<Editor>();

	// Auto-save function for student responses
	const debouncedSaveResponse = createDebouncedSave(async (response: unknown) => {
		if (isPublished && blockId && classTaskId) {
			await saveTaskBlockResponse(
				blockId,
				classTaskId,
				response
			);
		}
	}, 2000); // 2 second delay for auto-save

	function saveChanges() {
		if (!questionEditor || questionEditor.isEmpty) {
			alert('Question is required');
			return;
		}

		const newContent: textInputContent = {
			question: questionEditor.getJSON(),
			placeholder: placeholder.trim() || 'Enter your answer here...',
			maxLength: maxLength || 1000
		};

		content = newContent;
		onUpdate(newContent);
	}

	function onQuestionUpdate() {
		if (questionEditor && !questionEditor.isDestroyed) {
			question = questionEditor.getJSON();
			saveChanges();
		}
	}

	function onAnswerUpdate() {
		if (answerEditor && !answerEditor.isDestroyed) {
			userAnswer = answerEditor.getJSON();
			
			// Auto-save for published tasks
			if (isPublished && viewMode === ViewMode.VIEW) {
				debouncedSaveResponse(userAnswer);
			}
		}
	}

	// Update edit state when content prop changes
	$effect(() => {
		question = content.question || null;
		placeholder = content.placeholder || 'Enter your answer here...';
		maxLength = content.maxLength || 1000;
		
		// Load existing response for published tasks in view mode
		if (isPublished && viewMode === ViewMode.VIEW && blockId && classTaskId) {
			loadExistingResponse();
		} else {
			// Reset answer state for edit mode
			userAnswer = null;
			if (answerEditor) {
				answerEditor.commands.clearContent();
			}
		}
	});

	// Load existing user response using centralized function
	async function loadExistingResponse() {
		const existingResponse = await loadExistingResponseFromAPI(blockId, taskId, subjectOfferingClassId);
		if (existingResponse) {
			userAnswer = existingResponse;
			if (answerEditor && !answerEditor.isDestroyed) {
				answerEditor.commands.setContent(existingResponse);
			}
		}
	}
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
					<div class="w-full rounded-md border">
						{#if questionEditor && !questionEditor.isDestroyed}
							<EdraToolbar
								class="bg-background flex w-full items-center overflow-x-auto rounded-t-md border-b p-0.5"
								excludedCommands={['colors', 'fonts', 'headings', 'media']}
								editor={questionEditor}
							/>
						{/if}
						<EdraEditor
							bind:editor={questionEditor}
							content={question}
							class="h-[10rem] pr-4 pl-4 overflow-y-scroll"
							editorClass=""
							onUpdate={onQuestionUpdate}
							showSlashCommands={false}
						/>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	{:else if viewMode === ViewMode.VIEW}
		<!-- STUDENT VIEW: Shows the question with rich text input -->
		{#if content.question}
			<Card.Root>
				<Card.Content class="pt-6">
					<!-- Question Text -->
					<div class="mb-4">
						<div class="mb-2 text-lg font-medium">
							<EdraEditor
								content={content.question}
								class="h-min overflow-y-scroll"
								editorClass="px-0 py-0"
								editable={false}
								showSlashCommands={false}
								showLinkBubbleMenu={false}
								showTableBubbleMenu={false}
							/>
						</div>
						<p class="text-muted-foreground text-sm">Enter your response below</p>
					</div>

					<!-- Rich Text Answer Input Area -->
					<div class="space-y-4">
						<div class="w-full rounded-md border">
							{#if answerEditor && !answerEditor.isDestroyed}
								<EdraToolbar
									class="bg-background flex w-full items-center overflow-x-auto rounded-t-md border-b p-0.5"
									excludedCommands={['colors', 'fonts', 'headings', 'media']}
									editor={answerEditor}
								/>
							{/if}
							<EdraEditor
								bind:editor={answerEditor}
								content={userAnswer}
								class="h-[10rem] pr-4 pl-4 overflow-y-scroll"
								editorClass=""
								onUpdate={onAnswerUpdate}
								showSlashCommands={false}
							/>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		{/if}
	{/if}
</div>
