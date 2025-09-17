<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import FileIcon from '@lucide/svelte/icons/file';
	import FileImageIcon from '@lucide/svelte/icons/file-image';
	import FileVideoIcon from '@lucide/svelte/icons/file-video';
	import FileAudioIcon from '@lucide/svelte/icons/file-audio';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import LinkIcon from '@lucide/svelte/icons/link';
	import StickyNoteIcon from '@lucide/svelte/icons/sticky-note';

	interface ResourceInfo {
		id?: number;
		name?: string; // Made optional since Resource type doesn't have this
		fileName: string;
		fileSize: number;
		resourceType: string;
	}

	let {
		resource,
		variant = 'default',
		onRemove,
		onOpen,
		showRemoveButton = true,
		className = ''
	}: {
		resource: ResourceInfo;
		variant?: 'default' | 'new' | 'existing';
		onRemove?: (id?: number) => void;
		onOpen?: (() => void) | undefined;
		showRemoveButton?: boolean;
		className?: string;
	} = $props();

	function getResourceIcon(resourceType: string) {
		switch (resourceType) {
			case 'photo':
			case 'image':
				return FileImageIcon;
			case 'video':
				return FileVideoIcon;
			case 'audio':
				return FileAudioIcon;
			case 'document':
			case 'pdf':
				return FileTextIcon;
			case 'link':
				return LinkIcon;
			case 'note':
				return StickyNoteIcon;
			default:
				return FileIcon;
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	function getResourceTypeColor(resourceType: string): string {
		switch (resourceType) {
			case 'photo':
			case 'image':
				return 'bg-purple-100 text-purple-800';
			case 'video':
				return 'bg-red-100 text-red-800';
			case 'audio':
				return 'bg-green-100 text-green-800';
			case 'document':
			case 'pdf':
				return 'bg-blue-100 text-blue-800';
			case 'link':
				return 'bg-cyan-100 text-cyan-800';
			case 'note':
				return 'bg-yellow-100 text-yellow-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	const IconComponent = getResourceIcon(resource.resourceType);

	// Handle opening resource
	async function handleOpen() {
		if (onOpen) {
			onOpen();
		} else {
			// Default behavior: open resource for viewing in new tab (no download)
			try {
				const response = await fetch(`/api/resources?resourceId=${resource.id}&action=download`);
				const result = await response.json();

				if (result.downloadUrl) {
					// Open resource in new tab/window for viewing
					window.open(result.downloadUrl, '_blank');
				} else {
					alert('Failed to generate resource view link');
				}
			} catch (error) {
				console.error('Error opening resource:', error);
				alert('Failed to open resource');
			}
		}
	}

	// Variant-specific styling
	const variantClasses = {
		default: '',
		existing: '',
		new: ''
	};

	const iconClasses = {
		default: 'text-muted-foreground',
		existing: 'text-muted-foreground',
		new: 'text-blue-500'
	};
</script>

<button 
	class="flex items-center gap-3 p-3 border rounded-lg transition-colors hover:bg-muted/50 text-left w-full {variantClasses[variant]} {className}" 
	onclick={handleOpen}
	type="button"
>
	<!-- Resource Icon -->
	<div class="flex-shrink-0">
		<div class="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
			<IconComponent class="w-5 h-5 {iconClasses[variant]}" />
		</div>
	</div>
	
	<!-- Resource Info -->
	<div class="flex-1 min-w-0">
		<div class="flex items-center gap-2 mb-1">
			<h4 class="font-medium text-sm truncate">
				{resource.fileName}
			</h4>
		</div>
		<div class="flex items-center gap-3 text-xs text-muted-foreground">
			<span>{formatFileSize(resource.fileSize)}</span>
		</div>
	</div>
	
	<!-- Remove Button -->
	{#if showRemoveButton && onRemove}
		<div class="flex-shrink-0">
			<Button
				type="button"
				variant="ghost"
				size="sm"
				class="w-8 h-8 p-0 hover:bg-red-500/20 text-muted-foreground hover:text-red-600 transition-colors"
				onclick={(e) => {
					e.stopPropagation(); // Prevent triggering the card click
					onRemove?.(resource.id);
				}}
				title="Remove resource"
				aria-label="Remove resource"
			>
				<Trash2Icon class="w-4 h-4" />
			</Button>
		</div>
	{/if}
</button>
