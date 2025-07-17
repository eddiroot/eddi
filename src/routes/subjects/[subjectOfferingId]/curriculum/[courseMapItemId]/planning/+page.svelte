<script lang="ts">
        import * as Card from '$lib/components/ui/card';
       import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '$lib/components/ui/dialog';
       import { Textarea } from '$lib/components/ui/textarea';
       import { Button } from '$lib/components/ui/button';
       import { page } from '$app/state';
       let { data } = $props();
       let instruction = $state('');
</script>

<div class="p-6 space-y-8">
        <div class="space-y-2">
                <h1 class="text-3xl font-bold">Planning</h1>
                <h2 class="text-xl font-semibold">{data.courseMapItem.topic}</h2>
                {#if data.courseMapItem.description}
                        <p class="text-muted-foreground">{data.courseMapItem.description}</p>
                {/if}
                {#if data.learningAreas.length > 0}
                        <div class="flex flex-wrap gap-2">
                                {#each data.learningAreas as la}
                                        <span class="text-sm bg-muted px-2 py-1 rounded">{la.name}</span>
                                {/each}
                        </div>
                {/if}
        </div>

       <div class="flex justify-between items-center">
               <h3 class="text-2xl font-semibold">Lesson Plans</h3>
               <DialogTrigger>
                       <Button>New Plan</Button>
               </DialogTrigger>
       </div>
        {#if data.lessonPlans.length > 0}
                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {#each data.lessonPlans as plan}
                                <a href={`${page.url.pathname}/${plan.id}`} class="block">
                                        <Card.Root class="hover:shadow">
                                                <Card.Header>
                                                        <Card.Title>{plan.name}</Card.Title>
                                                </Card.Header>
                                        </Card.Root>
                                </a>
                        {/each}
                </div>
        {:else}
                <p class="text-muted-foreground italic">No lesson plans</p>
        {/if}

        <div class="mt-8 space-y-4">
                <h3 class="text-2xl font-semibold">Assessment Plans</h3>
                {#if data.assessmentPlans.length > 0}
                        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {#each data.assessmentPlans as ap}
                                        <Card.Root>
                                                <Card.Header>
                                                        <Card.Title>{ap.name}</Card.Title>
                                                </Card.Header>
                                        </Card.Root>
                                {/each}
                        </div>
                {:else}
                        <p class="text-muted-foreground italic">No assessment plans</p>
                {/if}
        </div>
</div>

<Dialog>
        <DialogContent class="max-w-lg">
                <DialogTitle class="mb-4">Create Lesson Plan</DialogTitle>
                <form method="POST" action="new/lessonPlan?/create" class="space-y-4">
                        <div>
                                <label class="block text-sm font-medium mb-1" for="instruction">Optional Instructions</label>
                                <Textarea id="instruction" name="instruction" bind:value={instruction} class="min-h-32" />
                        </div>
                        <Button type="submit">Generate</Button>
                </form>
        </DialogContent>
</Dialog>
