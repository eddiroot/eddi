<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import EditIcon from "@lucide/svelte/icons/edit";
    import CheckIcon from "@lucide/svelte/icons/check";
    import XIcon from "@lucide/svelte/icons/x";

    let {
        isEditing = $bindable(false),
        onSave,
        onCancel
    }: {
        isEditing: boolean;
        onSave?: () => void;
        onCancel?: () => void;
    } = $props();

    function handleEdit() {
        isEditing = true;
    }

    function handleSave() {
        onSave?.();
        isEditing = false;
    }

    function handleCancel() {
        onCancel?.();
        isEditing = false;
    }
</script>

<div class="flex gap-1">
    {#if !isEditing}
        <Button 
            variant="ghost" 
            size="sm" 
            onclick={handleEdit}
            class="h-6 w-6 p-0 opacity-50 hover:opacity-100"
        >
            <EditIcon class="h-3 w-3" />
        </Button>
    {:else}
        <Button 
            variant="ghost" 
            size="sm" 
            onclick={handleSave}
            class="h-6 w-6 p-0 text-green-600 hover:text-green-700"
        >
            <CheckIcon class="h-3 w-3" />
        </Button>
        <Button 
            variant="ghost" 
            size="sm" 
            onclick={handleCancel}
            class="h-6 w-6 p-0 text-red-600 hover:text-red-700"
        >
            <XIcon class="h-3 w-3" />
        </Button>
    {/if}
</div>
