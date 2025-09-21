<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import XIcon from '@lucide/svelte/icons/x';
	import { onMount } from 'svelte';
	import { GeneralSidebarController } from './general-sidebar';
	import { LessonSidebarController } from './lesson-sidebar';
	import { TaskSidebarController } from './task-sidebar';
	import type { BaseSidebarController, SidebarConfig, SidebarContext, SidebarMode, SidebarState, SidebarTab } from './types';

	interface Props {
		context: SidebarContext;
		enabled?: boolean;
		showFloatingButton?: boolean;
		controller?: BaseSidebarController;
		subjectOfferingId?: number;
		onStateChange?: (controller: BaseSidebarController) => void;
	}

	let { 
		context = 'task',
		enabled = true,
		showFloatingButton = true,
		controller,
		subjectOfferingId,
		onStateChange
	}: Props = $props();

	// Initialize controller based on context if not provided
	let sidebarController: BaseSidebarController;
	if (controller) {
		sidebarController = controller;
	} else {
		console.log('Initializing AI sidebar with context:', context);
		switch (context) {
			case 'task':
				sidebarController = new TaskSidebarController();
				break;
			case 'lesson':
				sidebarController = new LessonSidebarController();
				break;
			case 'general':
				sidebarController = new GeneralSidebarController();
				break;
			default:
				sidebarController = new GeneralSidebarController();
		}
	}

	// Reactive state derived from controller - properly typed
	let currentState: SidebarState = $state(sidebarController.getState());
	let currentConfig: SidebarConfig = $state(sidebarController.getConfig());
	let availableTabs: SidebarTab[] = $state(sidebarController.getAvailableTabs());
	let availableModes: SidebarMode[] = $state(sidebarController.getAvailableModes());

	// Notify parent of state changes
	$effect(() => {
		if (onStateChange) {
			onStateChange(sidebarController);
		}
	});



	// Resize functionality
	let isResizing = $state(false);
	let startX = $state(0);
	let startWidth = $state(0);

	function handleMouseDown(e: MouseEvent) {
		isResizing = true;
		startX = e.clientX;
		startWidth = currentState.width;
		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';
		e.preventDefault();
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isResizing) return;
		
		const deltaX = startX - e.clientX;
		const viewportWidth = window.innerWidth;
		const dynamicMaxWidth = viewportWidth / 2;
		const newWidth = Math.max(currentConfig.minWidth, Math.min(dynamicMaxWidth, startWidth + deltaX));
		
		sidebarController.setWidth(newWidth);
		currentState = sidebarController.getState();
		
		// Notify parent of state change
		if (onStateChange) {
			onStateChange(sidebarController);
		}
	}

	function handleMouseUp() {
		isResizing = false;
		document.body.style.cursor = '';
		document.body.style.userSelect = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	async function sendMessage() {
		if (!currentState.message.trim()) return;
		
		await sidebarController.handleMessage(currentState.message);
		currentState = sidebarController.getState();
	}

	function handleTabClick(tabId: string) {
		sidebarController.setActiveTab(tabId);
		currentState = sidebarController.getState();
	}

	function handleModeClick(modeId: string) {
		sidebarController.setActiveMode(modeId);
		currentState = sidebarController.getState();
	}

	function handleClose() {
		sidebarController.setSidebarOpen(false);
		currentState = sidebarController.getState();
		
		// Notify parent of state change
		if (onStateChange) {
			onStateChange(sidebarController);
		}
	}

	function handleToggle() {
		sidebarController.toggleSidebar();
		currentState = sidebarController.getState();
		
		// Notify parent of state change
		if (onStateChange) {
			onStateChange(sidebarController);
		}
	}

	function formatTimestamp(date?: Date): string {
		if (!date) return '';
		const now = new Date();
		const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
		
		if (diffInMinutes < 1) return 'Just now';
		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
		const hours = Math.floor(diffInMinutes / 60);
		if (hours < 24) return `${hours}h ago`;
		return date.toLocaleDateString();
	}

	onMount(() => {
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
		
		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	});

	// Export controller for external access
	export { sidebarController };
</script>

{#if enabled}
	<!-- Floating Action Button -->
	{#if showFloatingButton && !currentState.isOpen}
		{#if availableTabs.length > 0}
			{@const FirstTabIcon = availableTabs[0].icon}
			<button
				onclick={handleToggle}
				class="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-110 hover:shadow-xl pointer-events-auto"
				aria-label="Open AI Assistant"
			>
				<FirstTabIcon class="h-6 w-6" />
			</button>
		{/if}
	{/if}

	<!-- AI Sidebar -->
	{#if currentState.isOpen}
		<div 
			class="absolute top-0 right-0 h-full z-50 bg-background shadow-lg border-l pointer-events-auto {isResizing ? '' : 'transition-all duration-300'}"
			style="width: {currentState.width}px;"
		>
			<!-- Resize Handle -->
			<button
				class="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 transition-colors z-[60] flex items-center justify-center"
				onmousedown={handleMouseDown}
				aria-label="Resize sidebar"
			>
				<div class="h-12 w-1 bg-border rounded-full"></div>
			</button>

			<!-- Sidebar Content -->
			<div class="flex flex-col h-full ml-1">
				<!-- Top Navigation Tabs -->
				<div class="flex border-b bg-background">
					{#each availableTabs.filter((tab: SidebarTab) => tab.enabled).sort((a: SidebarTab, b: SidebarTab) => a.order - b.order) as tab}
						{@const TabIcon = tab.icon}
						<button
							class="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors {currentState.activeTab === tab.id 
								? 'border-b-2 border-primary text-primary' 
								: 'text-muted-foreground hover:text-foreground'}"
							onclick={() => handleTabClick(tab.id)}
						>
							{#if tab.id === 'chat'}
								<div class="h-2 w-2 rounded-full bg-green-500"></div>
							{:else}
								<TabIcon class="h-4 w-4" />
							{/if}
							{tab.label}
						</button>
					{/each}
					
					<!-- Close Button -->
					<div class="ml-auto flex items-center px-2">
						<Button variant="ghost" size="icon" onclick={handleClose}>
							<XIcon class="h-4 w-4" />
						</Button>
					</div>
				</div>

				<!-- Content Area -->
				<div class="flex-1 flex flex-col overflow-hidden">
					{#if currentState.activeTab === 'chat'}
						<!-- Chat Messages -->
						<ScrollArea class="flex-1 p-4">
							{#if currentState.messages.length === 0}
								<!-- Default center content with card options -->
								<div class="flex flex-col items-center justify-center h-full text-center space-y-6">
									<!-- Chat icon and title -->
									<div class="space-y-4">
										<div class="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
											<MessageCircle class="h-8 w-8 text-foreground" />
										</div>
										<h3 class="text-lg font-semibold text-foreground">Learn with the AI Tutor</h3>
									</div>
									
									<!-- Card options grid -->
									<div class="grid grid-cols-2 gap-3 w-full max-w-sm">
										<button class="p-4 bg-muted/30 hover:bg-muted/50 rounded-lg border text-left transition-colors group">
											<div class="space-y-2">
												<div class="w-8 h-8 rounded bg-blue-100 flex items-center justify-center mb-2">
													<svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
													</svg>
												</div>
												<h4 class="font-medium text-sm">Elaborate</h4>
												<p class="text-xs text-muted-foreground">Get detailed explanations</p>
											</div>
										</button>
										
										<button class="p-4 bg-muted/30 hover:bg-muted/50 rounded-lg border text-left transition-colors group">
											<div class="space-y-2">
												<div class="w-8 h-8 rounded bg-green-100 flex items-center justify-center mb-2">
													<svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
													</svg>
												</div>
												<h4 class="font-medium text-sm">Generate Example</h4>
												<p class="text-xs text-muted-foreground">Create practice problems</p>
											</div>
										</button>
										
										<button class="p-4 bg-muted/30 hover:bg-muted/50 rounded-lg border text-left transition-colors group">
											<div class="space-y-2">
												<div class="w-8 h-8 rounded bg-yellow-100 flex items-center justify-center mb-2">
													<svg class="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
													</svg>
												</div>
												<h4 class="font-medium text-sm">Hint</h4>
												<p class="text-xs text-muted-foreground">Get helpful hints</p>
											</div>
										</button>
										
										<button class="p-4 bg-muted/30 hover:bg-muted/50 rounded-lg border text-left transition-colors group">
											<div class="space-y-2">
												<div class="w-8 h-8 rounded bg-purple-100 flex items-center justify-center mb-2">
													<svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
													</svg>
												</div>
												<h4 class="font-medium text-sm">Steps</h4>
												<p class="text-xs text-muted-foreground">Break down the process</p>
											</div>
										</button>
									</div>
								</div>
							{:else}
								<!-- Chat messages -->
								{#each currentState.messages as message}
								<div class="mb-4 {message.role === 'user' ? 'text-right' : 'text-left'}">
									<div class="inline-block max-w-[80%] p-3 rounded-lg {message.role === 'user' 
										? 'bg-primary text-primary-foreground' 
										: 'bg-muted'}">
										{message.content}
									</div>
									{#if message.timestamp}
										<div class="text-xs text-muted-foreground mt-1">
											{formatTimestamp(message.timestamp)}
										</div>
									{/if}
								</div>
								{/each}
							{/if}
							
							{#if currentState.isLoading}
								<div class="flex items-center gap-2 text-muted-foreground">
									<div class="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
									<span>Thinking...</span>
								</div>
							{/if}
						</ScrollArea>

						<!-- Input Area -->
						<div class=" p-4 bg-background rounded-xl border border-muted px-4 py-3">
							<div class="space-y-3 ">
								<!-- First Row: Text Input -->
								<div class="bg-muted/20">
									<Input
										bind:value={currentState.message}
										placeholder="Ask anything"
										onkeydown={handleKeydown}
										disabled={currentState.isLoading}
										class="!border-none !bg-background !shadow-none !ring-0 !ring-offset-0 !outline-none focus-visible:!border-transparent focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!shadow-none placeholder:text-muted-foreground !text-xl !p-0 !h-auto !min-h-0"
									/>
								</div>
								
								<!-- Second Row: Model Dropdown and Send Button -->
								<div class="flex items-center justify-between">
									<!-- Left side - Model Dropdown -->
									<div class="flex items-center text-sm rounded-full py-1 bg-transparent">
										<span class="text-muted-foreground">Gemini 2.5 Flash</span>
										<ChevronDownIcon class="h-4 w-4 text-muted-foreground" />
									</div>
									
									<!-- Right side - Send Button -->
									<Button 
										variant="ghost" 
										size="icon" 
										class="h-8 w-8 bg-black hover:bg-gray-800 text-white rounded-full" 
										onclick={sendMessage}
										disabled={currentState.isLoading || !currentState.message.trim()}
										aria-label="Send"
									>
										<ArrowUp class="h-4 w-4" />
									</Button>
								</div>
							</div>
						</div>
					{:else}
						<!-- Other Tab Content Placeholders -->
						<div class="flex-1 flex items-center justify-center p-8">
							<div class="text-center">
								<h3 class="text-lg font-semibold mb-2">
									{currentState.activeTab.charAt(0).toUpperCase() + currentState.activeTab.slice(1)} Coming Soon
								</h3>
								<p class="text-muted-foreground">This feature is currently under development.</p>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
{/if}