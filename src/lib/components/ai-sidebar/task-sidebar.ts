import BookOpenIcon from '@lucide/svelte/icons/book-open';
import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
import ClockIcon from '@lucide/svelte/icons/clock';
import FileTextIcon from '@lucide/svelte/icons/file-text';
import MapIcon from '@lucide/svelte/icons/map';
import MessageSquareIcon from '@lucide/svelte/icons/message-square';
import PodcastIcon from '@lucide/svelte/icons/podcast';
import SearchIcon from '@lucide/svelte/icons/search';
import SparklesIcon from '@lucide/svelte/icons/sparkles';
import { BaseSidebarController, type SidebarConfig, type SidebarMode, type SidebarTab } from './types';

export class TaskSidebarController extends BaseSidebarController {
	constructor(config?: Partial<SidebarConfig>) {
		const defaultConfig: SidebarConfig = {
			context: 'task',
			enabled: true,
			showFloatingButton: true,
			width: 500,
			minWidth: 450,
			maxWidth: 800,
			position: 'right',
			...config
		};
		super(defaultConfig);
	}

	getAvailableTabs(): SidebarTab[] {
		return [
			{
				id: 'chat',
				label: 'Chat',
				icon: MessageSquareIcon,
				enabled: true,
				order: 1
			},
			{
				id: 'flashcards',
				label: 'Flashcards',
				icon: BookOpenIcon,
				enabled: true,
				order: 2
			},
			{
				id: 'quizzes',
				label: 'Quizzes',
				icon: ClipboardListIcon,
				enabled: true,
				order: 3
			},
			{
				id: 'podcast',
				label: 'Podcast',
				icon: PodcastIcon,
				enabled: true,
				order: 4
			},
			{
				id: 'summary',
				label: 'Summary',
				icon: FileTextIcon,
				enabled: true,
				order: 5
			}
		];
	}

	getAvailableModes(): SidebarMode[] {
		return [
			{
				id: 'quiz',
				label: 'Quiz',
				icon: SparklesIcon,
				enabled: true,
				order: 1
			},
			{
				id: 'mind-map',
				label: 'Mind Map',
				icon: MapIcon,
				enabled: true,
				order: 2
			},
			{
				id: 'flashcards',
				label: 'Flashcards',
				icon: BookOpenIcon,
				enabled: true,
				order: 3
			},
			{
				id: 'search',
				label: 'Search',
				icon: SearchIcon,
				enabled: true,
				order: 4
			},
			{
				id: 'timeline',
				label: 'Timeline',
				icon: ClockIcon,
				enabled: true,
				order: 5
			}
		];
	}

	getDefaultTab(): string {
		return 'chat';
	}

	getDefaultMode(): string {
		return 'quiz';
	}

	async handleMessage(message: string): Promise<void> {
		if (!message.trim()) return;

		this.state.isLoading = true;
		this.state.messages = [...this.state.messages, { 
			id: Date.now().toString(),
			role: 'user', 
			content: message,
			timestamp: new Date()
		}];

		try {
			// TODO: Implement actual AI API call for task context
			// For now, simulate a response
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			this.state.messages = [...this.state.messages, { 
				id: (Date.now() + 1).toString(),
				role: 'assistant', 
				content: `I can help you with this task. You asked: "${message}". Let me provide some guidance based on the current learning material.`,
				timestamp: new Date()
			}];
		} catch (error) {
			console.error('Failed to send message:', error);
			this.state.messages = [...this.state.messages, { 
				id: (Date.now() + 2).toString(),
				role: 'assistant', 
				content: 'Sorry, I encountered an error. Please try again.',
				timestamp: new Date()
			}];
		} finally {
			this.state.isLoading = false;
			this.state.message = '';
		}
	}
}