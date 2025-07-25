<script lang="ts">
    import { onMount } from 'svelte';
    import { ZoomIn, ZoomOut } from '@lucide/svelte/icons';
    import { Button } from '$lib/components/ui/button';
    
    let { url, fileName }: { url: string; fileName?: string } = $props();
    
    let pdfContainer = $state<HTMLDivElement>();
    let canvasElements: HTMLCanvasElement[] = $state([]);
    let scale = $state(1.75);
    let pdfDoc: any = null;
    let isLoading = $state(true);
    let error = $state<string | null>(null);
    
    // Zoom constraints
    const MIN_SCALE = 0.5;
    const MAX_SCALE = 3;
    const SCALE_STEP = 0.25;
    
    function zoomIn() {
        if (scale < MAX_SCALE) {
            scale = Math.min(scale + SCALE_STEP, MAX_SCALE);
            renderAllPages();
        }
    }
    
    function zoomOut() {
        if (scale > MIN_SCALE) {
            scale = Math.max(scale - SCALE_STEP, MIN_SCALE);
            renderAllPages();
        }
    }
    
    async function renderPage(pageNum: number) {
        try {
            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale });
            
            // Create or get canvas for this page
            if (!canvasElements[pageNum - 1]) {
                const canvas = document.createElement('canvas');
                canvas.className = 'mb-4 shadow-lg';
                canvasElements[pageNum - 1] = canvas;
                pdfContainer?.appendChild(canvas);
            }
            
            const canvas = canvasElements[pageNum - 1];
            const context = canvas.getContext('2d');
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };
            
            await page.render(renderContext).promise;
        } catch (err) {
            console.error(`Error rendering page ${pageNum}:`, err);
        }
    }
    
    async function renderAllPages() {
        if (!pdfDoc || !pdfContainer) return;
        
        // Clear existing canvases if rescaling
        if (canvasElements.length > 0 && pdfContainer) {
            pdfContainer.innerHTML = '';
            canvasElements = [];
        }
        
        for (let i = 1; i <= pdfDoc.numPages; i++) {
            await renderPage(i);
        }
    }
    
    onMount(async () => {
        if (!url) return;
        
        try {
            // Only run in browser environment
            if (typeof window === 'undefined') return;
            
            // Dynamically import PDF.js to ensure client-side only
            
            // @ts-ignore
            const pdfjsLib = await import('pdfjs-dist');
            
            // Set worker source using the correct version
            pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
                'pdfjs-dist/build/pdf.worker.min.mjs',
                import.meta.url
            ).toString();
            
            const loadingTask = pdfjsLib.getDocument({
                url: url,
                cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.3.93/cmaps/',
                cMapPacked: true,
            });
            
            pdfDoc = await loadingTask.promise;
            
            await renderAllPages();
            isLoading = false;
        } catch (err) {
            console.error('Error loading PDF:', err);
            error = `Failed to load PDF: ${err}`;
            isLoading = false;
        }
    });
</script>

<div class="h-full w-full relative flex flex-col">
    <!-- Floating zoom controls -->
    <div class="absolute top-4 right-4 z-10 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-1 shadow-lg border">
        <Button
            variant="ghost"
            size="sm"
            onclick={zoomOut}
            disabled={scale <= MIN_SCALE}
            class="h-8 w-8 p-0"
        >
            <ZoomOut class="h-4 w-4" />
        </Button>
        <span class="text-sm font-medium px-2 min-w-[4rem] text-center">
            {Math.round(scale * 100)}%
        </span>
        <Button
            variant="ghost"
            size="sm"
            onclick={zoomIn}
            disabled={scale >= MAX_SCALE}
            class="h-8 w-8 p-0"
        >
            <ZoomIn class="h-4 w-4" />
        </Button>
    </div>
    
    <!-- PDF content area -->
    <div class="flex-1 overflow-y-auto">
        <div class="flex justify-center pt-16 pb-8">
            <div bind:this={pdfContainer} class="max-w-10xl">
                {#if isLoading}
                    <div class="flex items-center justify-center h-96">
                        <div class="text-center">
                            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p class="text-sm text-muted-foreground">Loading PDF...</p>
                        </div>
                    </div>
                {/if}
                
                {#if error}
                    <div class="flex items-center justify-center h-96">
                        <div class="text-center text-destructive">
                            <p class="text-lg font-medium mb-2">Error Loading PDF</p>
                            <p class="text-sm">{error}</p>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
