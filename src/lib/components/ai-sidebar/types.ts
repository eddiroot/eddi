// AI Sidebar Types and Interfaces

export type SidebarContext = 'task' | 'lesson' | 'general' | 'assessment' | 'chat';

export interface SidebarConfig {
	context: SidebarContext;
	enabled: boolean;
	showFloatingButton: boolean;
	width: number;
	minWidth: number;
	maxWidth: number;
	position: 'right' | 'left';
}

export interface SidebarTab {
	id: string;
	label: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon: any; // Lucide icon component - using any for simplicity
	enabled: boolean;
	order: number;
}

export interface SidebarMode {
	id: string;
	label: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon: any; // Lucide icon component - using any for simplicity
	enabled: boolean;
	order: number;
}

export interface SidebarMessage {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	timestamp?: Date;
}

export interface SidebarState {
	isOpen: boolean;
	activeTab: string;
	activeMode: string;
	width: number;
	isLoading: boolean;
	studyMode: boolean;
	message: string;
	messages: SidebarMessage[];
}

export abstract class BaseSidebarController {
	protected config: SidebarConfig;
	protected state: SidebarState;

	constructor(config: SidebarConfig) {
		this.config = config;
		this.state = {
			isOpen: false,
			activeTab: this.getDefaultTab(),
			activeMode: this.getDefaultMode(),
			width: config.width,
			isLoading: false,
			studyMode: true,
			message: '',
			messages: []
		};
	}

	abstract getAvailableTabs(): SidebarTab[];
	abstract getAvailableModes(): SidebarMode[];
	abstract getDefaultTab(): string;
	abstract getDefaultMode(): string;
	abstract handleMessage(message: string): Promise<void>;

	// Common methods
	toggleSidebar(): void {
		this.state.isOpen = !this.state.isOpen;
	}

	setSidebarOpen(open: boolean): void {
		this.state.isOpen = open;
	}

	setActiveTab(tabId: string): void {
		if (this.getAvailableTabs().some(tab => tab.id === tabId && tab.enabled)) {
			this.state.activeTab = tabId;
		}
	}

	setActiveMode(modeId: string): void {
		if (this.getAvailableModes().some(mode => mode.id === modeId && mode.enabled)) {
			this.state.activeMode = modeId;
		}
	}

	setWidth(width: number): void {
		// Get current viewport width and set max to half of it (no floor for smoother resizing)
		const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
		const dynamicMaxWidth = viewportWidth / 2;
		
		const constrainedWidth = Math.max(
			this.config.minWidth,
			Math.min(dynamicMaxWidth, width)
		);
		this.state.width = constrainedWidth;
		// Also update config for consistency
		this.config.maxWidth = dynamicMaxWidth;
	}

	getState(): SidebarState {
		return { ...this.state };
	}

	getConfig(): SidebarConfig {
		return { ...this.config };
	}
}