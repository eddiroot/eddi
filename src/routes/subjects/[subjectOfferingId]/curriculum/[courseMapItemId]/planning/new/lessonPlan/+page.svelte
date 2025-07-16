<script lang="ts">
        import { Textarea } from '$lib/components/ui/textarea';
        import { Button } from '$lib/components/ui/button';
        let { data } = $props();
</script>

<div class="p-6 max-w-xl mx-auto space-y-4">
        <h1 class="text-2xl font-bold">Generate Lesson Plan</h1>
        <form method="POST" action="?/create" class="space-y-4">
                <div>
                        <label class="block text-sm font-medium mb-1" for="instruction">Optional Instructions</label>
                        <Textarea id="instruction" name="instruction" class="min-h-32" />
                </div>
                <Button type="submit">Generate</Button>
        </form>
</div>
