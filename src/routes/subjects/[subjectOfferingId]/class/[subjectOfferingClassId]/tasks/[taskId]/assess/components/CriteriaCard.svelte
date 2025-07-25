<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Card } from '$lib/components/ui/card';
    import { Badge } from '$lib/components/ui/badge';
    import { CheckIcon, XIcon, MinusIcon } from '@lucide/svelte/icons';
    
    interface Criteria {
        id: number;
        description: string;
        marks: number;
    }
    
    interface CriteriaFeedback {
        id?: number;
        criteriaId: number;
        feedbackLevel: 'met' | 'no' | 'partial';
        marks: number;
    }
    
    let {
        criteria,
        feedback = null,
        onFeedbackChange,
        isReadOnly = false
    }: {
        criteria: Criteria;
        feedback?: CriteriaFeedback | null;
        onFeedbackChange?: (feedback: CriteriaFeedback) => void;
        isReadOnly?: boolean;
    } = $props();
    
    // Local state for the current assessment
    let currentFeedback = $state<CriteriaFeedback>(
        feedback || {
            criteriaId: criteria.id,
            feedbackLevel: 'no',
            marks: 0
        }
    );
    
    // Watch for external feedback changes
    $effect(() => {
        if (feedback) {
            currentFeedback = { ...feedback };
        }
    });
    
    function setFeedbackLevel(level: 'met' | 'no' | 'partial') {
        let newMarks = 0;
        
        if (level === 'met') {
            newMarks = criteria.marks;
        } else if (level === 'no') {
            newMarks = 0;
        } else if (level === 'partial') {
            // Default to half marks for partial, but allow custom input
            newMarks = Math.round((criteria.marks / 2) * 10) / 10; // Round to 1 decimal place
        }
        
        currentFeedback = {
            ...currentFeedback,
            feedbackLevel: level,
            marks: newMarks
        };
        
        onFeedbackChange?.(currentFeedback);
    }
    
    function updatePartialMarks(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseFloat(target.value) || 0;
        
        // Ensure marks don't exceed maximum
        const clampedValue = Math.min(Math.max(0, value), criteria.marks);
        
        currentFeedback = {
            ...currentFeedback,
            marks: clampedValue
        };
        
        onFeedbackChange?.(currentFeedback);
    }
    
    function getButtonVariant(level: 'met' | 'no' | 'partial') {
        if (currentFeedback.feedbackLevel === level) {
            switch (level) {
                case 'met': return 'default';
                case 'no': return 'destructive';
                case 'partial': return 'secondary';
            }
        }
        return 'outline';
    }
    
    function getButtonClass(level: 'met' | 'no' | 'partial') {
        if (currentFeedback.feedbackLevel === level) {
            switch (level) {
                case 'met': return 'bg-green-500 hover:bg-green-600 text-white border-green-500';
                case 'no': return 'bg-red-500 hover:bg-red-600 text-white border-red-500';
                case 'partial': return 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500';
            }
        }
        return 'hover:bg-gray-50';
    }
</script>

<Card class="p-4">
    <div class="flex items-center justify-between gap-4">
        <!-- Left side: Criteria information -->
        <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
                <h4 class="text-sm font-medium text-gray-900 leading-tight">
                    {criteria.description}
                </h4>
                <Badge variant="outline" class="text-xs shrink-0">
                    {criteria.marks} {criteria.marks === 1 ? 'mark' : 'marks'}
                </Badge>
            </div>
            
            {#if currentFeedback.feedbackLevel !== 'no' && currentFeedback.marks > 0}
                <div class="text-xs text-gray-600">
                    Awarded: {currentFeedback.marks} / {criteria.marks} marks
                </div>
            {/if}
        </div>
        
        <!-- Right side: Assessment buttons and input -->
        <div class="flex items-center gap-2 shrink-0">
            {#if !isReadOnly}
                <!-- Met button -->
                <Button
                    variant={getButtonVariant('met')}
                    size="sm"
                    class={`${getButtonClass('met')} px-3 py-1 text-xs`}
                    onclick={() => setFeedbackLevel('met')}
                >
                    Met
                </Button>
                
                <!-- Not Met button -->
                <Button
                    variant={getButtonVariant('no')}
                    size="sm"
                    class={`${getButtonClass('no')} px-3 py-1 text-xs`}
                    onclick={() => setFeedbackLevel('no')}
                >
                    No
                </Button>
                
                <!-- Partial button -->
                <Button
                    variant={getButtonVariant('partial')}
                    size="sm"
                    class={`${getButtonClass('partial')} px-3 py-1 text-xs`}
                    onclick={() => setFeedbackLevel('partial')}
                >
                    Partial
                </Button>
                
                <!-- Partial marks input (only shown when partial is selected) -->
                {#if currentFeedback.feedbackLevel === 'partial'}
                    <div class="flex items-center gap-1">
                        <Input
                            type="number"
                            min="0"
                            max={criteria.marks}
                            step="0.1"
                            value={currentFeedback.marks}
                            onchange={updatePartialMarks}
                            class="w-16 h-8 text-xs text-center"
                            placeholder="0"
                        />
                        <span class="text-xs text-gray-500">/ {criteria.marks}</span>
                    </div>
                {/if}
            {:else}
                <!-- Read-only display -->
                <div class="flex items-center gap-2">
                    {#if currentFeedback.feedbackLevel === 'met'}
                        <Badge class="bg-green-100 text-green-800 border-green-300">
                            Met ({currentFeedback.marks} marks)
                        </Badge>
                    {:else if currentFeedback.feedbackLevel === 'no'}
                        <Badge class="bg-red-100 text-red-800 border-red-300">
                            Not Met (0 marks)
                        </Badge>
                    {:else if currentFeedback.feedbackLevel === 'partial'}
                        <Badge class="bg-yellow-100 text-yellow-800 border-yellow-300">
                            Partial ({currentFeedback.marks} / {criteria.marks} marks)
                        </Badge>
                    {:else}
                        <Badge variant="outline" class="text-gray-500">
                            Not assessed
                        </Badge>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</Card>
