<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { responseSchema, type ResponseSchema } from './response-schema.js';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import CheckCircle from '@lucide/svelte/icons/check-circle';

	let {
		data,
		threadType
	}: {
		data: { form: SuperValidated<Infer<ResponseSchema>> };
		threadType: string;
	} = $props();

	const form = superForm(data.form, {
		validators: zodClient(responseSchema),
		resetForm: false
	});

	const { form: formData, enhance, submit } = form;

	// Set default response type based on thread type
	$effect(() => {
		if (!$formData.type) {
			$formData.type = threadType === 'question' || threadType === 'qanda' ? 'answer' : 'comment';
		}
	});

	function getResponseTypeDescription(type: string): string {
		switch (type) {
			case 'answer':
				return 'Provide a helpful answer to solve this question';
			case 'comment':
				return 'Share your thoughts or ask for clarification';
			default:
				return '';
		}
	}

	function getPlaceholderText(type: string): string {
		switch (type) {
			case 'answer':
				return 'Write your answer here...';
			case 'comment':
				return 'Write your comment here...';
			default:
				return 'Write your response here...';
		}
	}
</script>

<div class="mt-6 border-t pt-6">
	<div class="mb-4">
		<h3 class="text-lg font-semibold">Add a Response</h3>
		<p class="text-muted-foreground text-sm">
			{threadType === 'question' || threadType === 'qanda'
				? 'Help answer this question or add a comment'
				: 'Share your thoughts on this discussion'}
		</p>
	</div>

	<form method="POST" action="?/addResponse" class="space-y-4" use:enhance>
		{#if threadType === 'question' || threadType === 'qanda'}
			<Form.Field {form} name="type">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Response Type</Form.Label>
						<Select.Root
							type="single"
							value={$formData.type}
							onValueChange={(value: string | undefined) => {
								if (value && (value === 'answer' || value === 'comment')) {
									$formData.type = value;
								}
							}}
						>
							<Select.Trigger {...props}>
								<div class="flex items-center gap-2">
									{#if $formData.type === 'answer'}
										<CheckCircle class="h-4 w-4 text-green-600" />
										Answer
									{:else}
										<MessageSquare class="h-4 w-4 text-blue-600" />
										Comment
									{/if}
								</div>
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="answer" label="Answer">
									<div class="flex items-center gap-2">
										<CheckCircle class="h-4 w-4 text-green-600" />
										<div class="flex flex-col">
											<span class="font-medium">Answer</span>
											<span class="text-muted-foreground text-xs">Provide a solution</span>
										</div>
									</div>
								</Select.Item>
								<Select.Item value="comment" label="Comment">
									<div class="flex items-center gap-2">
										<MessageSquare class="h-4 w-4 text-blue-600" />
										<div class="flex flex-col">
											<span class="font-medium">Comment</span>
											<span class="text-muted-foreground text-xs">Ask or discuss</span>
										</div>
									</div>
								</Select.Item>
							</Select.Content>
						</Select.Root>
						<input type="hidden" name="type" value={$formData.type} />
					{/snippet}
				</Form.Control>
				<Form.Description>{getResponseTypeDescription($formData.type)}</Form.Description>
				<Form.FieldErrors />
			</Form.Field>
		{/if}

		<Form.Field {form} name="content">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>
						{$formData.type === 'answer' ? 'Your Answer' : 'Your Comment'}
					</Form.Label>
					<Textarea
						{...props}
						bind:value={$formData.content}
						placeholder={getPlaceholderText($formData.type)}
						class="min-h-24"
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<div class="flex justify-end">
			<Button type="submit" class="flex items-center gap-2">
				{#if $formData.type === 'answer'}
					<CheckCircle class="h-4 w-4" />
					Post Answer
				{:else}
					<MessageSquare class="h-4 w-4" />
					Post Comment
				{/if}
			</Button>
		</div>
	</form>
</div>
