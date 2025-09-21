import BookOpenIcon from '@lucide/svelte/icons/book-open';
import BrainIcon from '@lucide/svelte/icons/brain';
import HelpCircleIcon from '@lucide/svelte/icons/help-circle';
import MessageSquareIcon from '@lucide/svelte/icons/message-square';
import SearchIcon from '@lucide/svelte/icons/search';
import SettingsIcon from '@lucide/svelte/icons/settings';
import type { SidebarMode, SidebarTab } from './types';
import { BaseSidebarController } from './types';

export class GeneralSidebarController extends BaseSidebarController {
	constructor() {
		const config = {
			context: 'general' as const,
			enabled: true,
			showFloatingButton: true,
			width: 500,
			minWidth: 450,
			maxWidth: 800,
			position: 'right' as const
		};
		super(config);
	}

	getDefaultTab(): string {
		return 'chat';
	}

	getDefaultMode(): string {
		return 'general';
	}

	getAvailableTabs(): SidebarTab[] {
		return [
			{
				id: 'chat',
				label: 'Chat',
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				icon: MessageSquareIcon as any,
				enabled: true,
				order: 1
			},
			{
				id: 'resources',
				label: 'Resources',
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				icon: BookOpenIcon as any,
				enabled: true,
				order: 2
			},
			{
				id: 'settings',
				label: 'Settings',
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				icon: SettingsIcon as any,
				enabled: true,
				order: 3
			}
		];
	}

	getAvailableModes(): SidebarMode[] {
		return [
			{
				id: 'general',
				label: 'General',
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				icon: HelpCircleIcon as any,
				enabled: true,
				order: 1
			},
			{
				id: 'research',
				label: 'Research',
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				icon: SearchIcon as any,
				enabled: true,
				order: 2
			},
			{
				id: 'tutor',
				label: 'Tutor',
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				icon: BrainIcon as any,
				enabled: true,
				order: 3
			}
		];
	}

	async handleMessage(content: string): Promise<void> {
		if (!content.trim()) return;

		// Add user message
		this.state.messages.push({
			id: Date.now().toString(),
			role: 'user',
			content: content.trim(),
			timestamp: new Date()
		});

		this.state.message = '';
		this.state.isLoading = true;

		try {
			// Simulate general AI response
			await this.simulateGeneralResponse(content);
		} catch (error) {
			console.error('Error in general chat:', error);
			this.state.messages.push({
				id: Date.now().toString(),
				role: 'assistant',
				content: 'I apologize, but I encountered an error while processing your request. Please try again.',
				timestamp: new Date()
			});
		} finally {
			this.state.isLoading = false;
		}
	}

	private async simulateGeneralResponse(userMessage: string): Promise<void> {
		// Simulate API delay
		await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

		let response: string;
		const mode = this.state.activeMode;

		if (mode === 'general') {
			response = `I understand you're asking: ${userMessage}\n\nI'm here to help with general questions and provide information on a wide range of topics. How can I assist you further?`;
		} else if (mode === 'research') {
			response = `Let me help you research: ${userMessage}\n\nI can help you find reliable sources, understand complex topics, and organize information for your studies.`;
		} else if (mode === 'tutor') {
			response = `As your AI tutor: ${userMessage}\n\nI can help break down complex concepts, provide explanations, and guide you through learning processes step by step.`;
		} else {
			response = `You asked: ${userMessage}\n\nI'm here to help! I can assist with explanations, research, tutoring, and general questions about your studies.`;
		}

		this.state.messages.push({
			id: Date.now().toString(),
			role: 'assistant',
			content: response,
			timestamp: new Date()
		});
	}
}