<script lang="ts">
        import * as Card from '$lib/components/ui/card';
        import { page } from '$app/state';
        let { data } = $props();
</script>

<div class="p-6 space-y-6">
        <div>
                <h1 class="text-3xl font-bold mb-2">{data.lessonPlan.name}</h1>
                <p class="text-muted-foreground">Topic: {data.courseMapItem.topic}</p>
        </div>

        {#if data.lessonPlan.description}
                <Card.Root>
                        <Card.Header>
                                <Card.Title>Description</Card.Title>
                        </Card.Header>
                        <Card.Content class="prose max-w-none">
                                {data.lessonPlan.description}
                        </Card.Content>
                </Card.Root>
        {/if}

        {#if data.lessonPlan.scope?.length}
                <Card.Root>
                        <Card.Header>
                                <Card.Title>Scopes</Card.Title>
                        </Card.Header>
                        <Card.Content>
                                <ul class="list-disc ml-6 space-y-1">
                                        {#each data.lessonPlan.scope as s}
                                                <li>{s}</li>
                                        {/each}
                                </ul>
                        </Card.Content>
                </Card.Root>
        {/if}

        {#if data.standards.length > 0}
                <Card.Root>
                        <Card.Header>
                                <Card.Title>Learning Area Standards</Card.Title>
                        </Card.Header>
                        <Card.Content>
                                <ul class="list-disc ml-6 space-y-2">
                                        {#each data.standards as std}
                                                <li>
                                                        <div class="font-medium">{std.name}</div>
                                                        {#if std.description}
                                                                <div class="text-sm">{std.description}</div>
                                                        {/if}
                                                </li>
                                        {/each}
                                </ul>
                        </Card.Content>
                </Card.Root>
        {/if}
</div>
