<script lang="ts">
    import * as Card from '$lib/components/ui/card';

    export let learningAreaName: string;
    export let href: string | undefined = undefined;
    export let clickable = false;
</script>

<div class="w-64 mb-4">
    {#if href}
        <a {href} class="block transition-transform hover:scale-105">
            <Card.Root class="flex items-center py-2 w-fit max-w-xl ">
                <div class="flex h-full">
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
        <Card.Root class="flex items-center py-2 w-fit max-w-xl {clickable ? 'cursor-pointer hover:shadow-md' : ''}">
            <div class="flex h-full">
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
</div>