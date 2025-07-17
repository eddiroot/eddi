<script lang="ts">
        import { page } from '$app/state';
        let { data } = $props();
</script>

<!-- Hero Section with Lesson Plan Image -->
<div class="relative h-64 w-full overflow-hidden mb-8">
        {#if data.lessonPlan.imageBase64}
                <img 
                        src={`data:image/png;base64,${data.lessonPlan.imageBase64}`}
                        alt={data.lessonPlan.name}
                        class="absolute inset-0 w-full h-full object-cover"
                />
                <div class="absolute inset-0 bg-black/40"></div>
        {:else if data.courseMapItem.imageBase64}
                <img 
                        src={`data:image/png;base64,${data.courseMapItem.imageBase64}`}
                        alt={data.courseMapItem.topic}
                        class="absolute inset-0 w-full h-full object-cover"
                />
                <div class="absolute inset-0 bg-black/40"></div>
        {:else}
                <div class="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10"></div>
        {/if}
        
        <!-- Lesson Plan Title Overlay (centered) -->
        <div class="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
                <h1 class="text-4xl font-bold mb-2">{data.lessonPlan.name}</h1>
                <p class="text-lg opacity-90">Topic: {data.courseMapItem.topic}</p>
        </div>
</div>

<div class="max-w-4xl mx-auto px-6 space-y-12">
        <!-- Scopes Section -->
        {#if data.lessonPlan.scope?.length}
                <div class="space-y-4">
                        <h2 class="text-2xl font-semibold">Scopes</h2>
                        <ul class="list-disc ml-6 space-y-2 text-muted-foreground leading-relaxed">
                                {#each data.lessonPlan.scope as scope}
                                        <li>{scope}</li>
                                {/each}
                        </ul>
                </div>
        {/if}

        <!-- Curriculum Standards Section -->
        {#if data.standards.length > 0}
                <div class="space-y-4">
                        <h2 class="text-2xl font-semibold">Curriculum Standards Addressed</h2>
                        <ul class="list-disc ml-6 space-y-3">
                                {#each data.standards as standard}
                                        <li>
                                                <div class="font-medium">{standard.name}:</div>
                                                {#if standard.description}
                                                        <div class="text-muted-foreground mt-1">{standard.description}</div>
                                                {/if}
                                        </li>
                                {/each}
                        </ul>
                </div>
        {/if}

        <!-- Description Section -->
        {#if data.lessonPlan.description}
                <div class="space-y-4">
                        <h2 class="text-2xl font-semibold">Description</h2>
                        <p class="text-muted-foreground leading-relaxed">{data.lessonPlan.description}</p>
                </div>
        {/if}
</div>
