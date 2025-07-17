<script lang="ts">
    import * as Card from '$lib/components/ui/card';
    import { Button } from '$lib/components/ui/button';
    import X from '@lucide/svelte/icons/x';

    export let learningAreaName: string;
    export let href: string | undefined = undefined;
    export let clickable = false;
    export let editMode = false;
    export let onRemove: (() => void) | undefined = undefined;
</script>

<div class="w-64 h-16 relative">
    {#if href}
        <a {href} class="block transition-transform hover:scale-105 h-full">
            <Card.Root class="flex items-center py-2 w-full h-full">
                <div class="flex h-full w-full">
                    <!-- Left side - Logo container -->
                    <div class="w-40 flex items-center justify-center bg-muted/5 pl-1">
                        <img 
                            src="/vcaa-logo.jpg" 
                            alt="VCAA Logo" 
                            class="max-h-20 max-w-full object-contain"
                        />
                    </div>
                    <!-- Right side - Learning area name -->
                    <div class="flex items-center px-3">
                        <h3 class="font-medium text-base break-words">
                            {learningAreaName}
                        </h3>
                    </div>
                </div>
            </Card.Root>
        </a>
    {:else}
        <Card.Root class="flex items-center py-2 w-full h-full {clickable ? 'cursor-pointer hover:shadow-md' : ''}">
            <div class="flex h-full w-full">
                <!-- Left side - Logo container -->
                <div class="w-40 flex items-center justify-center bg-muted/5 pl-1">
                    <img 
                        src="/vcaa-logo.jpg" 
                        alt="VCAA Logo" 
                        class="max-h-20 max-w-full object-contain"
                    />
                </div>
                <!-- Right side - Learning area name -->
                <div class="flex items-center px-3">
                    <h3 class="font-medium text-base break-words">
                        {learningAreaName}
                    </h3>
                </div>
            </div>
        </Card.Root>
    {/if}
    
    <!-- Remove button in edit mode -->
    {#if editMode && onRemove}
        <Button 
            size="sm"
            variant="destructive"
            onclick={onRemove}
            class="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 bg-red-600 hover:bg-red-700"
        >
            <X class="w-3 h-3" />
        </Button>
    {/if}
</div>