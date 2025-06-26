<script lang="ts">
    import { cn } from "$lib/utils";
    
    let dragover = $state(false);
    let fileInput: HTMLInputElement;

    let { 
        files = $bindable(),
        accept = '', 
        multiple = false, 
        className = '', 
        id = '' 
    } = $props();

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
                Array.from(files as FileList).forEach(file => dt.items.add(file as File));
            }
            
            // Add new files
            newFiles.forEach(file => dt.items.add(file));
            
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
            "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
            "hover:bg-gray-50 dark:hover:bg-gray-800",
            dragover ? "border-primary bg-primary/5" : "border-gray-300 dark:border-gray-600",
            "dark:hover:border-gray-500",
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
            <svg 
                aria-hidden="true" 
                class="mb-3 h-10 w-10 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
            >
                <path 
                    stroke-linecap="round" 
                    stroke-linejoin="round" 
                    stroke-width="2" 
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
            </svg>

            <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span class="font-semibold">Click to upload</span>
                or drag and drop
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
                {accept ? `${accept.replace(/\./g, '').replace(/,/g, ', ').toUpperCase()}` : 'PNG, JPG, JPEG or PDF'} (MAX. 10MB each)
            </p>
            {#if files && files.length > 0}
                <p class="mt-2 text-xs text-primary">
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
        <div class="space-y-1 -mt-2">
            <p class="text-xs font-medium text-gray-700 dark:text-gray-300">
                Selected Files ({files.length})
            </p>
            <div class="space-y-1 max-h-32 overflow-y-auto">
                {#each Array.from(files as File[]) as file, index}
                    <div class="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-800 rounded-md border">
                        <div class="flex items-center min-w-0 flex-1">
                            <p class="text-xs font-medium text-gray-900 dark:text-gray-100 truncate mr-2">
                                {file.name}
                            </p>
                            <span class="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                ({formatFileSize(file.size)})
                            </span>
                        </div>
                        <button
                            type="button"
                            onclick={() => removeFile(index)}
                            class="ml-2 p-0.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors flex-shrink-0"
                            title="Remove file"
                            aria-label="Remove file"
                        >
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>