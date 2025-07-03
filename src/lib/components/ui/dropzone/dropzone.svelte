<script lang="ts">
	import { cn } from '$lib/utils';
	import CloudUploadIcon from '@lucide/svelte/icons/cloud-upload';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import Button from '../button/button.svelte';

	let dragover = $state(false);
	let fileInput: HTMLInputElement;

	let { files = $bindable(), accept = '', multiple = false, className = '', id = '' } = $props();

	function handleChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			addFiles(Array.from(target.files));
		}
	}

	function dropHandle(event: DragEvent) {
		event.preventDefault();
		dragover = false;
		if (event.dataTransfer?.files) {
			addFiles(Array.from(event.dataTransfer.files));
		}
	}

	function addFiles(newFiles: File[]) {
		if (!multiple) {
			// If not multiple, replace existing files
			const dt = new DataTransfer();
			if (newFiles.length > 0) {
				dt.items.add(newFiles[0]);
			}
			files = dt.files;
		} else {
			// If multiple, append to existing files
			const dt = new DataTransfer();

			// Add existing files
			if (files) {
				Array.from(files as FileList).forEach((file) => dt.items.add(file as File));
			}

			// Add new files
			newFiles.forEach((file) => dt.items.add(file));

			files = dt.files;
		}
	}

	function removeFile(index: number) {
		if (!files) return;

		const dt = new DataTransfer();
		Array.from(files as FileList).forEach((file, i) => {
			if (i !== index) {
				dt.items.add(file);
			}
		});
		files = dt.files;
	}

	function handleClick() {
		fileInput.click();
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		dragover = true;
	}

	function handleDragLeave() {
		dragover = false;
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
</script>

<div class="space-y-4">
	<!-- Drop Zone -->
	<div
		{id}
		class={cn(
			'hover:bg-muted hover:border-muted-foreground flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors',
			className
		)}
		role="button"
		tabindex="0"
		ondrop={dropHandle}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		onclick={handleClick}
		onkeydown={(e) => e.key === 'Enter' && handleClick()}
	>
		<div class="flex flex-col items-center justify-center pt-5 pb-6">
			<CloudUploadIcon class="text-muted-foreground mb-2 size-10" />

			<p class="text-muted-foreground mb-2 text-sm">
				<span class="font-semibold">Click to upload</span>
				or drag and drop
			</p>
			<p class="text-muted-foreground text-xs">
				{#if accept}
					Allowed file types:
				{/if}
				{accept
					? `${accept.replace(/\./g, '').replace(/,/g, ', ').toUpperCase()}`
					: 'PNG, JPG, JPEG or PDF'} (max. 10MB each)
			</p>
			{#if files && files.length > 0}
				<p class="text-primary mt-2 text-xs">
					{files.length} file{files.length !== 1 ? 's' : ''} selected
				</p>
			{/if}
		</div>

		<!-- Hidden File Input -->
		<input
			bind:this={fileInput}
			type="file"
			{accept}
			{multiple}
			onchange={handleChange}
			class="hidden"
		/>
	</div>

	<!-- Selected Files List -->
	{#if files && files.length > 0}
		<div class="-mt-2 space-y-1">
			<p class="text-muted-foreground text-xs font-medium">
				Selected Files ({files.length})
			</p>
			<div class="max-h-32 space-y-1 overflow-y-auto">
				{#each Array.from(files as File[]) as file, index}
					<div class="bg-card flex items-center justify-between rounded-md border p-1.5">
						<div class="flex min-w-0 flex-1 items-center">
							<p class="mx-2 truncate text-xs font-medium">
								{file.name}
							</p>
							<span class="text-muted-foreground flex-shrink-0 text-xs">
								({formatFileSize(file.size)})
							</span>
						</div>
						<Button
							type="button"
							variant="destructive"
							size="icon"
							onclick={() => removeFile(index)}
							title="Remove file"
							aria-label="Remove file"
						>
							<Trash2Icon />
						</Button>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
