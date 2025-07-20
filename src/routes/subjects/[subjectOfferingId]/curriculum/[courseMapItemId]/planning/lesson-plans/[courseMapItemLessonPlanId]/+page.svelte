<script lang="ts">
        import * as Card from '$lib/components/ui/card';
        import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '$lib/components/ui/sheet';
        import { Textarea } from '$lib/components/ui/textarea';
        import { Button } from '$lib/components/ui/button';
        import { Input } from '$lib/components/ui/input';
        import { Label } from '$lib/components/ui/label';
        import Calendar from '@lucide/svelte/icons/calendar';
        import Clock from '@lucide/svelte/icons/clock';
        import BookOpen from '@lucide/svelte/icons/book-open';
        import Archive from '@lucide/svelte/icons/archive';
        import Plus from '@lucide/svelte/icons/plus';
        import Edit from '@lucide/svelte/icons/edit';
        import Check from '@lucide/svelte/icons/check';
        import X from '@lucide/svelte/icons/x';
        import { page } from '$app/state';
        import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import ResourcesPopover from '../../components/ResourcesPopover.svelte';
	import ResourceFileInput from '../../components/ResourceFileInput.svelte';        let { data, form } = $props();
        
        // Edit mode state
        let editMode = $state(false);
        let editedName = $state(data.lessonPlan.name);
        let editedDescription = $state(data.lessonPlan.description || '');
        let editedScopes = $state([...(data.lessonPlan.scope || [])]);
        let editedStandards = $state([...data.standards]);
        let resourceFileInput: any;
        
        // Update edited values when data changes (only when not in edit mode)
        $effect(() => {
                if (!editMode) {
                        editedName = data.lessonPlan.name;
                        editedDescription = data.lessonPlan.description || '';
                        editedScopes = [...(data.lessonPlan.scope || [])];
                        editedStandards = [...data.standards];
                }
        });

        // Function to save all changes
        async function saveChanges() {
                try {
                        const formData = new FormData();
                        formData.set('name', editedName);
                        formData.set('description', editedDescription);
                        formData.set('scopes', JSON.stringify(editedScopes));
                        formData.set('standardIds', JSON.stringify(editedStandards.map(s => s.id)));

                        const response = await fetch('?/updateLessonPlan', {
                                method: 'POST',
                                body: formData
                        });

                        const result = await response.json();
                        if (result.type === 'success') {
                                editMode = false;
                                invalidateAll();
                        } else {
                                alert('Failed to save changes');
                        }
                } catch (error) {
                        console.error('Error saving changes:', error);
                        alert('Failed to save changes');
                }
        }

        // Function to cancel changes
        function cancelChanges() {
                editMode = false;
                // Reset to original values
                editedName = data.lessonPlan.name;
                editedDescription = data.lessonPlan.description || '';
                editedScopes = [...(data.lessonPlan.scope || [])];
                editedStandards = [...data.standards];
        }

        // Scope management functions
        function addScope() {
                editedScopes = [...editedScopes, ''];
        }

        function removeScope(index: number) {
                editedScopes = editedScopes.filter((_, i) => i !== index);
        }

        function updateScope(index: number, value: string) {
                editedScopes = [...editedScopes];
                editedScopes[index] = value;
        }

        // Standard management functions
        function removeStandardLocally(standardId: number) {
                editedStandards = editedStandards.filter(s => s.id !== standardId);
        }

        function addStandardLocally(standard: any) {
                // Check if standard is already added to prevent duplicates
                if (!editedStandards.some(s => s.id === standard.id)) {
                        editedStandards = [...editedStandards, standard];
                }
        }

        // Resource management functions
        function handleAddResource() {
                resourceFileInput?.triggerUpload();
        }

        function handleResourceAdded() {
                invalidateAll();
        }

        async function handleRemoveResource(resourceId: number) {
                try {
                        const formData = new FormData();
                        formData.set('resourceId', resourceId.toString());

                        const response = await fetch('?/removeResource', {
                                method: 'POST',
                                body: formData
                        });

                        const result = await response.json();
                        if (result.type === 'success') {
                                invalidateAll();
                        } else {
                                alert('Failed to remove resource');
                        }
                } catch (error) {
                        console.error('Error removing resource:', error);
                        alert('Failed to remove resource');
                }
        }

        async function handleOpenResource(resource: any) {
                try {
                        const response = await fetch(`/api/resources?resourceId=${resource.id}&action=download`);
                        const result = await response.json();
                        
                        if (result.downloadUrl) {
                                // Open resource in new tab/window
                                window.open(result.downloadUrl, '_blank');
                        } else {
                                alert('Failed to generate resource link');
                        }
                } catch (error) {
                        console.error('Error opening resource:', error);
                        alert('Failed to open resource');
                }
        }

        // Refresh data helper
        function refreshData() {
                invalidateAll();
        }
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
                <div 
                        class="absolute inset-0"
                        style="background-color: {data.courseMapItem.color || '#6B7280'}"
                ></div>
                <div class="absolute inset-0 bg-gradient-to-br from-black/20 via-black/30 to-black/50"></div>
        {/if}
        
        <!-- Lesson Plan Title Overlay (centered) -->
        <div class="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
                {#if editMode}
                        <Input 
                                bind:value={editedName} 
                                class="text-4xl font-bold mb-2 bg-white/10 border-white/20 text-white text-center placeholder:text-white/70"
                                placeholder="Lesson plan name"
                        />
                {:else}
                        <h1 class="text-4xl font-bold mb-2">{data.lessonPlan.name}</h1>
                {/if}
                <div class="flex flex-wrap items-center justify-center gap-6 text-sm">
                        <div class="flex items-center gap-1">
                                <BookOpen class="w-4 h-4" />
                                {data.courseMapItem.topic}
                        </div>
                        <div class="flex items-center gap-1">
                                <Archive class="w-4 h-4" />
                                <ResourcesPopover 
                                        resources={data.resources} 
                                        onAddResource={handleAddResource}
                                        onRemoveResource={handleRemoveResource}
                                        onOpenResource={handleOpenResource}
                                />
                        </div>
                </div>
        </div>
        
        <!-- Edit Button -->
        <div class="absolute top-4 right-4">
                {#if editMode}
                        <div class="flex gap-2">
                                <Button 
                                        size="sm" 
                                        variant="default"
                                        onclick={saveChanges}
                                        class="bg-green-600 hover:bg-green-700 text-white font-medium px-4"
                                >
                                        <Check class="w-4 h-4 mr-2" />
                                        Save
                                </Button>
                                <Button 
                                        size="sm" 
                                        variant="outline"
                                        onclick={cancelChanges}
                                        class="bg-white hover:bg-gray-50 text-gray-700 font-medium px-4"
                                >
                                        <X class="w-4 h-4 mr-2" />
                                        Cancel
                                </Button>
                        </div>
                {:else}
                        <Button 
                                size="default" 
                                variant="secondary"
                                onclick={() => editMode = true}
                                class="font-medium px-6 py-2 shadow-lg"
                        >
                                <Edit class="w-4 h-4 mr-2" />
                                Edit
                        </Button>
                {/if}
        </div>
</div>

<div class="max-w-4xl mx-auto px-6 space-y-12">
        <!-- Scopes Section -->
        <div class="space-y-4">
                <div class="flex items-center justify-between">
                        <h2 class="text-2xl font-semibold">Scopes</h2>
                        {#if editMode}
                                <Button 
                                        size="sm" 
                                        variant="outline"
                                        onclick={addScope}
                                        class="gap-2"
                                >
                                        <Plus class="w-4 h-4" />
                                        Add Scope
                                </Button>
                        {/if}
                </div>
                {#if editMode}
                        <div class="space-y-3">
                                {#each editedScopes as scope, index}
                                        <div class="flex gap-2 items-start">
                                                <Textarea 
                                                        value={editedScopes[index]}
                                                        placeholder="Enter scope..."
                                                        class="flex-1 min-h-[80px]"
                                                        oninput={(e) => updateScope(index, (e.target as HTMLTextAreaElement).value)}
                                                />
                                                <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        onclick={() => removeScope(index)}
                                                        class="text-red-600 hover:text-red-700 mt-2"
                                                >
                                                        <X class="w-4 h-4" />
                                                </Button>
                                        </div>
                                {/each}
                        </div>
                {:else if data.lessonPlan.scope?.length}
                        <ul class="list-disc ml-6 space-y-2 text-muted-foreground leading-relaxed">
                                {#each data.lessonPlan.scope as scope}
                                        <li>{scope}</li>
                                {/each}
                        </ul>
                {:else}
                        <p class="text-muted-foreground">No scopes defined yet.</p>
                {/if}
        </div>

        <!-- Curriculum Standards Section -->
        <div class="space-y-6">
                <div class="flex items-center justify-between">
                        <h2 class="text-2xl font-semibold">Curriculum Standards Addressed</h2>
                        {#if data.availableStandards.length > 0}
                                {@const unassignedStandards = data.availableStandards.filter(
                                        (available) => !(editMode ? editedStandards : data.standards).some((assigned) => assigned.id === available.id)
                                )}
                                {#if unassignedStandards.length > 0 && editMode}
                                        <Sheet>
                                                <SheetTrigger>
                                                        <Button variant="outline" size="sm" class="gap-2">
                                                                <Plus class="w-4 h-4" />
                                                                Curriculum Standard
                                                        </Button>
                                                </SheetTrigger>
                                                <SheetContent class="w-[600px] max-w-[90vw] p-0 flex flex-col">
                                                        <div class="p-6 border-b">
                                                                <SheetHeader class="space-y-2">
                                                                        <SheetTitle>Add Curriculum Standard</SheetTitle>
                                                                        <p class="text-sm text-muted-foreground">
                                                                                Select a curriculum standard to associate with this lesson plan.
                                                                        </p>
                                                                </SheetHeader>
                                                        </div>
                                                        
                                                        <div class="flex-1 overflow-y-auto p-6">
                                                                <div class="space-y-4">
                                                                        {#each unassignedStandards as standard}
                                                                                <div class="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                                                                        <div class="flex-1">
                                                                                                <h4 class="font-medium text-sm mb-1">{standard.name}</h4>
                                                                                                {#if standard.description}
                                                                                                        <p class="text-xs text-muted-foreground">{standard.description}</p>
                                                                                                {/if}
                                                                                        </div>
                                                                                        <Button 
                                                                                                type="button" 
                                                                                                size="sm" 
                                                                                                variant="outline"
                                                                                                onclick={() => addStandardLocally(standard)}
                                                                                        >
                                                                                                Add
                                                                                        </Button>
                                                                                </div>
                                                                        {/each}
                                                                </div>
                                                        </div>
                                                </SheetContent>
                                        </Sheet>
                                {/if}
                        {/if}
                </div>
                
                {#if data.standards.length > 0 || editedStandards.length > 0}
                        {#if editMode}
                                <div class="space-y-3">
                                        {#each editedStandards as standard}
                                                <div class="flex items-start justify-between p-4 border rounded-lg">
                                                        <div class="flex-1">
                                                                <div class="font-medium">{standard.name}</div>
                                                                {#if standard.description}
                                                                        <div class="text-muted-foreground mt-1 text-sm">{standard.description}</div>
                                                                {/if}
                                                        </div>
                                                        <Button 
                                                                size="sm" 
                                                                variant="outline"
                                                                onclick={() => removeStandardLocally(standard.id)}
                                                                class="text-red-600 hover:text-red-700"
                                                        >
                                                                <X class="w-4 h-4" />
                                                        </Button>
                                                </div>
                                        {/each}
                                </div>
                        {:else}
                                <ul class="list-disc ml-6 space-y-2 text-muted-foreground leading-relaxed">
                                        {#each data.standards as standard}
                                                <li>
                                                        <span class="font-medium text-foreground">{standard.name}</span>
                                                        {#if standard.description}
                                                                <span class="block text-sm mt-1">{standard.description}</span>
                                                        {/if}
                                                </li>
                                        {/each}
                                </ul>
                        {/if}
                {:else}
                        <div class="text-center py-8">
                                <p class="text-muted-foreground">No curriculum standards assigned yet.</p>
                        </div>
                {/if}
        </div>

        <!-- Description Section -->
        <div class="space-y-4 pb-12">
                <h2 class="text-2xl font-semibold">Description</h2>
                {#if editMode}
                        <Textarea 
                                bind:value={editedDescription}
                                placeholder="Enter lesson plan description..."
                                class="min-h-[100px] resize-y"
                        />
                {:else if data.lessonPlan.description}
                        <p class="text-muted-foreground leading-relaxed">{data.lessonPlan.description}</p>
                {:else}
                        <p class="text-muted-foreground">No description provided yet.</p>
                {/if}
        </div>
</div>

<!-- Resource File Input -->
<ResourceFileInput
        bind:this={resourceFileInput}
        courseMapItemId={data.lessonPlan.id}
        onResourceAdded={handleResourceAdded}
/>
