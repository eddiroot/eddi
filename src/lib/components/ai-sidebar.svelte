<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Select from '$lib/components/ui/select/index.js';
	import { SendIcon, UserIcon, BotIcon, Plus, MessageSquare } from '@lucide/svelte/icons';
	import type { ChatbotMessage, ChatbotChat } from '$lib/server/db/schema';

	// Extended type for chats with first message
	type ChatWithFirstMessage = ChatbotChat & {
		firstMessage?: {
			content: string;
			createdAt: string;
		};
	};
	import { formatTimestamp } from '$lib/utils';
	import { onMount } from 'svelte';

	// Props
	let { subjectOfferingId = null }: { subjectOfferingId?: number | null } = $props();

	let chatId = $state<number | null>(null);
	let messages = $state<ChatbotMessage[]>([]);
	let currentMessage = $state('');
	let isLoading = $state(false);
	let chatContainer = $state<HTMLElement | null>(null);
	let availableChats = $state<ChatWithFirstMessage[]>([]);
	let selectedChatValue = $state<string>('');

	const sidebar = Sidebar.useSidebar();

	async function loadAvailableChats() {
		try {
			const response = await fetch('/api/chatbot/chat');

			if (!response.ok) {
				throw new Error('Failed to load chats');
			}

			const { chats } = await response.json();
			availableChats = chats;
		} catch (error) {
			console.error('Error loading chats:', error);
		}
	}

	async function createNewChat() {
		try {
			const response = await fetch('/api/chatbot/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error('Failed to create a new chat');
			}

			const { chat } = await response.json();
			chatId = chat.id;
			messages = [];
			selectedChatValue = chat.id.toString();
			await loadAvailableChats(); // Refresh the chat list
			return chat;
		} catch (error) {
			console.error('Error creating new chat:', error);
			throw error;
		}
	}

	async function loadChat(chatIdToLoad: number) {
		try {
			const messagesResponse = await fetch(`/api/chatbot/messages?chatId=${chatIdToLoad}`);

			if (!messagesResponse.ok) {
				throw new Error('Failed to load chat messages');
			}

			const { messages: loadedMessages } = await messagesResponse.json();
			chatId = chatIdToLoad;
			messages = loadedMessages;
			selectedChatValue = chatIdToLoad.toString();
		} catch (error) {
			console.error('Error loading chat:', error);
			throw error;
		}
	}

	async function sendMessage() {
		if (!currentMessage.trim() || isLoading) return;

		const messageToSend = currentMessage.trim();
		currentMessage = '';
		isLoading = true;

		try {
			// Create a new chat if one doesn't exist
			if (!chatId) {
				await createNewChat();
			}

			// Send the user message
			const userMessageResponse = await fetch('/api/chatbot/message', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					message: messageToSend,
					chatId: chatId
				})
			});

			if (!userMessageResponse.ok) {
				throw new Error('Failed to create a chat message');
			}

			const { message: userMessage }: { message: ChatbotMessage } =
				await userMessageResponse.json();
			messages = [...messages, userMessage];

			// Get the AI response
			if (!chatId) {
				throw new Error('Chat ID is required');
			}

			const urlParams = new URLSearchParams({ chatId: chatId.toString() });
			if (subjectOfferingId !== null) {
				urlParams.append('subjectOfferingId', subjectOfferingId.toString());
			}

			const chatbotMessageResponse = await fetch(`/api/chatbot/message?${urlParams}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!chatbotMessageResponse.ok) {
				throw new Error('Failed to get AI response');
			}

			const { message: chatbotMessage }: { message: ChatbotMessage } =
				await chatbotMessageResponse.json();
			messages = [...messages, chatbotMessage];

			// Refresh chat list to update first message previews
			await loadAvailableChats();
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

	function startNewChat() {
		chatId = null;
		messages = [];
		selectedChatValue = '';
	}

	function getCurrentChatTitle() {
		if (!chatId) return 'New Chat';
		const currentChat = availableChats.find((chat) => chat.id === chatId);
		if (!currentChat) return 'Chat';

		// Use first message content as title if available
		if (currentChat.firstMessage && currentChat.firstMessage.content.length > 0) {
			return currentChat.firstMessage.content.length > 30
				? currentChat.firstMessage.content.substring(0, 30) + '...'
				: currentChat.firstMessage.content;
		}

		// Fall back to current conversation's first message
		const firstMessage = messages.find((m) => m.authorId !== null);
		if (firstMessage && firstMessage.content.length > 0) {
			return firstMessage.content.length > 30
				? firstMessage.content.substring(0, 30) + '...'
				: firstMessage.content;
		}

		return `Chat ${currentChat.id}`;
	}

	function getChatTitle(chat: ChatWithFirstMessage) {
		if (chat.firstMessage && chat.firstMessage.content.length > 0) {
			return chat.firstMessage.content.length > 30
				? chat.firstMessage.content.substring(0, 30) + '...'
				: chat.firstMessage.content;
		}
		return `Chat ${chat.id}`;
	}

	onMount(() => {
		loadAvailableChats();
	});

	// Handle chat selection changes
	$effect(() => {
		if (selectedChatValue && selectedChatValue !== chatId?.toString()) {
			const selectedChatId = parseInt(selectedChatValue);
			if (!isNaN(selectedChatId)) {
				loadChat(selectedChatId);
			}
		}
	});
</script>

<Sidebar.Root
	side="right"
	collapsible="offcanvas"
	class="transition-all duration-200 data-[state=collapsed]:w-0 data-[state=collapsed]:opacity-0"
>
	{#if sidebar.rightOpen}
		<Sidebar.Header class="border-b">
			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between p-2">
					<h1 class="text-lg font-semibold">ask eddi</h1>
					<Button variant="secondary" size="icon" onclick={startNewChat}>
						<Plus />
					</Button>
				</div>

				{#if availableChats.length > 0}
					<div class="px-2">
						<Select.Root type="single" bind:value={selectedChatValue}>
							<Select.Trigger class="w-full">
								<div class="flex min-w-0 flex-1 items-center gap-2">
									<MessageSquare class="h-4 w-4 flex-shrink-0" />
									<span class="truncate text-sm">{getCurrentChatTitle()}</span>
								</div>
							</Select.Trigger>
							<Select.Content>
								{#each availableChats as chat (chat.id)}
									<Select.Item value={chat.id.toString()}>
										<div class="flex items-center gap-2">
											<MessageSquare class="h-4 w-4 flex-shrink-0" />
											<div class="min-w-0 flex-1">
												<div class="truncate text-sm font-medium">
													{getChatTitle(chat)}
												</div>
												<div class="text-muted-foreground text-xs">
													{formatTimestamp(chat.createdAt)}
												</div>
											</div>
										</div>
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				{/if}
			</div>
		</Sidebar.Header>

		<Sidebar.Content class="flex h-full flex-col">
			<ScrollArea class="flex-1 p-4">
				<div bind:this={chatContainer}>
					{#if messages.length === 0}
						<p class="text-muted-foreground text-sm">
							eddi's here to guide you through problems step by step.<br /><br /> He knows about your
							subjects, classes, lessons, assessments, and more, so he can help you with any school-related
							stuff!
						</p>
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
											{formatTimestamp(message.createdAt)}
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
