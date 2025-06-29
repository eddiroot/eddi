<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { SendIcon, UserIcon, BotIcon } from '@lucide/svelte/icons';
	import type { ChatbotMessage } from '$lib/server/db/schema';
	import { formatDate } from '$lib/utils';

	let chatId = $state<string | null>(null);
	let messages = $state<ChatbotMessage[]>([]);
	let currentMessage = $state('');
	let isLoading = $state(false);
	let chatContainer = $state<HTMLElement | null>(null);

	const sidebar = Sidebar.useSidebar();

	async function sendMessage() {
		if (!currentMessage.trim() || isLoading) return;

		const messageToSend = currentMessage.trim();
		currentMessage = '';
		isLoading = true;

		try {
			const userMessageResponse = await fetch('/api/chatbot', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					message: messageToSend
				})
			});

			if (!userMessageResponse.ok) {
				throw new Error('Failed to create a chat message');
			}

			const { message: userMessage }: { message: ChatbotMessage } =
				await userMessageResponse.json();
			messages = [...messages, userMessage];

			const chatbotMessageResponse = await fetch('/api/chatbot', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					chatId: chatId
				})
			});

			const { message: chatbotMessage }: { message: ChatbotMessage } =
				await chatbotMessageResponse.json();
			messages = [...messages, chatbotMessage];
		} catch (error) {
			console.error('Error with chatbot:', error);
		} finally {
			isLoading = false;
		}

		setTimeout(() => {
			if (chatContainer) {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}
		}, 100);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}
</script>

<Sidebar.Root
	side="right"
	collapsible="offcanvas"
	class="transition-all duration-200 data-[state=collapsed]:w-0 data-[state=collapsed]:opacity-0"
>
	{#if sidebar.rightOpen}
		<Sidebar.Header class="border-b">
			<div class="flex items-center justify-between p-4">
				<div class="flex items-center gap-2">
					<BotIcon class="h-5 w-5" />
					<h1 class="text-lg font-semibold">AI Tutor</h1>
				</div>
			</div>
		</Sidebar.Header>

		<Sidebar.Content class="flex h-full flex-col">
			<!-- Chat Messages -->
			<ScrollArea class="flex-1 p-4">
				<div bind:this={chatContainer}>
					{#if messages.length === 0}
						<div class="flex h-full flex-col items-center justify-center space-y-4 text-center">
							<BotIcon class="text-muted-foreground h-12 w-12" />
							<div class="space-y-2">
								<h3 class="font-medium">AI Tutor Ready</h3>
								<p class="text-muted-foreground text-sm">
									Ask me anything about your studies! I'm here to guide you through problems step by
									step.
								</p>
							</div>
						</div>
					{:else}
						<div class="space-y-4">
							{#each messages as message}
								<div class="flex gap-3 {!!message.authorId ? 'justify-end' : 'justify-start'}">
									{#if !message.authorId}
										<div class="flex-shrink-0">
											<div
												class="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full"
											>
												<BotIcon class="h-4 w-4" />
											</div>
										</div>
									{/if}

									<div class="max-w-[80%] {!!message.authorId ? 'order-first' : ''}">
										<div
											class="rounded-lg p-3 {!!message.authorId
												? 'bg-primary text-primary-foreground ml-auto'
												: 'bg-muted'}"
										>
											<p class="text-sm whitespace-pre-wrap">{message.content}</p>
										</div>
										<p
											class="text-muted-foreground mt-1 text-xs {!!message.authorId
												? 'text-right'
												: 'text-left'}"
										>
											{formatDate(message.createdAt)}
										</p>
									</div>

									{#if !!message.authorId}
										<div class="flex-shrink-0">
											<div class="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
												<UserIcon class="h-4 w-4" />
											</div>
										</div>
									{/if}
								</div>
							{/each}

							{#if isLoading}
								<div class="flex justify-start gap-3">
									<div class="flex-shrink-0">
										<div
											class="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full"
										>
											<BotIcon class="h-4 w-4" />
										</div>
									</div>
									<div class="max-w-[80%]">
										<div class="bg-muted rounded-lg p-3">
											<div class="flex space-x-1">
												<div class="h-2 w-2 animate-bounce rounded-full bg-current"></div>
												<div
													class="h-2 w-2 animate-bounce rounded-full bg-current"
													style="animation-delay: 0.1s"
												></div>
												<div
													class="h-2 w-2 animate-bounce rounded-full bg-current"
													style="animation-delay: 0.2s"
												></div>
											</div>
										</div>
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</ScrollArea>

			<!-- Message Input -->
			<div class="border-t p-4">
				<div class="flex gap-2">
					<Input
						bind:value={currentMessage}
						placeholder="Ask me a question..."
						onkeydown={handleKeyDown}
						disabled={isLoading}
						class="flex-1"
					/>
					<Button onclick={sendMessage} disabled={!currentMessage.trim() || isLoading} size="sm">
						<SendIcon class="h-4 w-4" />
					</Button>
				</div>
				<p class="text-muted-foreground mt-2 text-xs">
					Press Enter to send, Shift+Enter for new line
				</p>
			</div>
		</Sidebar.Content>
	{/if}
</Sidebar.Root>
