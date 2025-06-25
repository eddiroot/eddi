<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { SendIcon, UserIcon, BotIcon } from '@lucide/svelte/icons';
	import type { ChatMessage, ChatResponse } from './ai-sidebar.server';

	// Chat state
	let messages: ChatMessage[] = $state([]);
	let currentMessage = $state('');
	let isLoading = $state(false);
	let chatContainer: HTMLElement;

	// Get sidebar context
	const sidebar = Sidebar.useSidebar();

	// Send message to AI tutor
	async function sendMessage() {
		if (!currentMessage.trim() || isLoading) return;

		const userMessage: ChatMessage = {
			id: `user_${Date.now()}`,
			role: 'user',
			content: currentMessage.trim(),
			timestamp: new Date()
		};

		// Add user message to chat
		messages = [...messages, userMessage];
		const messageToSend = currentMessage.trim();
		currentMessage = '';
		isLoading = true;

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					message: messageToSend,
					conversationHistory: messages.slice(0, -1) // Don't include the message we just added
				})
			});

			if (!response.ok) {
				throw new Error('Failed to get response');
			}

			const chatResponse: ChatResponse = await response.json();
			
			const assistantMessage: ChatMessage = {
				id: chatResponse.messageId,
				role: 'assistant',
				content: chatResponse.response,
				timestamp: chatResponse.timestamp
			};

			messages = [...messages, assistantMessage];
		} catch (error) {
			console.error('Error sending message:', error);
			
			const errorMessage: ChatMessage = {
				id: `error_${Date.now()}`,
				role: 'assistant',
				content: 'Sorry, I encountered an error. Please try again.',
				timestamp: new Date()
			};
			
			messages = [...messages, errorMessage];
		} finally {
			isLoading = false;
		}

		// Scroll to bottom
		setTimeout(() => {
			if (chatContainer) {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}
		}, 100);
	}

	// Handle Enter key press
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	// Clear chat
	function clearChat() {
		messages = [];
	}
</script>

<Sidebar.Root side="right" collapsible="offcanvas" class="data-[state=collapsed]:w-0 data-[state=collapsed]:opacity-0 transition-all duration-200">
	{#if sidebar.rightOpen}
		<Sidebar.Header class="border-b">
			<div class="flex items-center justify-between p-4">
				<div class="flex items-center gap-2">
					<BotIcon class="h-5 w-5" />
					<h1 class="text-lg font-semibold">AI Tutor</h1>
				</div>
				{#if messages.length > 0}
					<Button variant="ghost" size="sm" onclick={clearChat}>
						Clear
					</Button>
				{/if}
			</div>
		</Sidebar.Header>
		
		<Sidebar.Content class="flex flex-col h-full">
			<!-- Chat Messages -->
			<ScrollArea class="flex-1 p-4">
				<div bind:this={chatContainer}>
					{#if messages.length === 0}
						<div class="flex flex-col items-center justify-center h-full text-center space-y-4">
							<BotIcon class="h-12 w-12 text-muted-foreground" />
							<div class="space-y-2">
								<h3 class="font-medium">AI Tutor Ready</h3>
								<p class="text-sm text-muted-foreground">Ask me anything about your studies! I'm here to guide you through problems step by step.</p>
							</div>
						</div>
					{:else}
						<div class="space-y-4">
						{#each messages as message (message.id)}
							<div class="flex gap-3 {message.role === 'user' ? 'justify-end' : 'justify-start'}">
								{#if message.role === 'assistant'}
									<div class="flex-shrink-0">
										<div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
											<BotIcon class="h-4 w-4" />
										</div>
									</div>
								{/if}
								
								<div class="max-w-[80%] {message.role === 'user' ? 'order-first' : ''}">
									<div class="rounded-lg p-3 {message.role === 'user' 
										? 'bg-primary text-primary-foreground ml-auto' 
										: 'bg-muted'}">
										<p class="text-sm whitespace-pre-wrap">{message.content}</p>
									</div>
									<p class="text-xs text-muted-foreground mt-1 {message.role === 'user' ? 'text-right' : 'text-left'}">
										{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
									</p>
								</div>
								
								{#if message.role === 'user'}
									<div class="flex-shrink-0">
										<div class="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
											<UserIcon class="h-4 w-4" />
										</div>
									</div>
								{/if}
							</div>
						{/each}
						
						{#if isLoading}
							<div class="flex gap-3 justify-start">
								<div class="flex-shrink-0">
									<div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
										<BotIcon class="h-4 w-4" />
									</div>
								</div>
								<div class="max-w-[80%]">
									<div class="rounded-lg p-3 bg-muted">
										<div class="flex space-x-1">
											<div class="h-2 w-2 bg-current rounded-full animate-bounce"></div>
											<div class="h-2 w-2 bg-current rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
											<div class="h-2 w-2 bg-current rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
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
					<Button 
						onclick={sendMessage} 
						disabled={!currentMessage.trim() || isLoading}
						size="sm"
					>
						<SendIcon class="h-4 w-4" />
					</Button>
				</div>
				<p class="text-xs text-muted-foreground mt-2">
					Press Enter to send, Shift+Enter for new line
				</p>
			</div>
		</Sidebar.Content>
	{/if}
</Sidebar.Root>
