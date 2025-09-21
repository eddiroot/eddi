import BookOpenIcon from '@lucide/svelte/icons/book-open';
import BrainIcon from '@lucide/svelte/icons/brain';
import HelpCircleIcon from '@lucide/svelte/icons/help-circle';
import MessageSquareIcon from '@lucide/svelte/icons/message-square';
import NotebookIcon from '@lucide/svelte/icons/notebook-pen';
import SearchIcon from '@lucide/svelte/icons/search';
import type { SidebarMode, SidebarTab } from './types';
import { BaseSidebarController } from './types';

export class LessonSidebarController extends BaseSidebarController {
	constructor() {
		const config = {
			context: 'lesson' as const,
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
		return 'explain';
	}

	getAvailableTabs(): SidebarTab[] {
		return [
			{
				id: 'chat',
				label: 'Ask Questions',
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				icon: MessageSquareIcon as any,
				enabled: true,
				order: 1
			},
			{
				id: 'notes',
				label: 'Notes',
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				icon: NotebookIcon as any,
				enabled: true,
				order: 2
			},
			{
				id: 'resources',
				label: 'Resources',
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				icon: BookOpenIcon as any,
				enabled: true,
				order: 3
			}
		];
	}

	getAvailableModes(): SidebarMode[] {
		return [
			{
				id: 'explain',
				label: 'Explain',
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				icon: HelpCircleIcon as any,
				enabled: true,
				order: 1
			},
			{
				id: 'analyze',
				label: 'Analyze',
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
			// Simulate lesson-focused AI response
			await this.simulateLessonResponse(content);
		} catch (error) {
			console.error('Error in lesson chat:', error);
			this.state.messages.push({
				id: Date.now().toString(),
				role: 'assistant',
				content: 'I apologize, but I encountered an error while processing your lesson question. Please try again.',
				timestamp: new Date()
			});
		} finally {
			this.state.isLoading = false;
		}
	}

	private async simulateLessonResponse(userMessage: string): Promise<void> {
		// Simulate API delay
		await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

		let response: string;
		const mode = this.state.activeMode;

		if (mode === 'explain') {
			response = `Let me explain this lesson concept: ${userMessage}\n\nThis relates to the current lesson content and builds on the key learning objectives. I can help break down complex ideas into manageable parts.`;
		} else if (mode === 'analyze') {
			response = `Analyzing the lesson content for: ${userMessage}\n\nI can help you examine the relationships between concepts, identify patterns, and understand the deeper connections in this lesson.`;
		} else if (mode === 'tutor') {
			response = `As your tutor for this lesson: ${userMessage}\n\nI'll guide you through the learning process step by step, provide practice opportunities, and help reinforce your understanding.`;
		} else {
			response = `I understand you're asking about: ${userMessage}\n\nHow can I help you better understand this lesson content? I can explain concepts, provide examples, or answer specific questions.`;
		}

		this.state.messages.push({
			id: Date.now().toString(),
			role: 'assistant',
			content: response,
			timestamp: new Date()
		});
	}
}