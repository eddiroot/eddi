<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Card } from '$lib/components/ui/card';
    import { Badge } from '$lib/components/ui/badge';
    import { CheckIcon, XIcon, MinusIcon } from '@lucide/svelte/icons';
    
    interface Answer {
        id: number;
        answer: string | object;
        marks?: number;
    }
    
    interface AnswerFeedback {
        id?: number;
        answerId: number;
        feedbackLevel: 'met' | 'no' | 'partial';
        marks: number;
    }
    
    let {
        answer,
        feedback = null,
        onFeedbackChange,
        isReadOnly = false,
        maxMarks = 1
    }: {
        answer: Answer;
        feedback?: AnswerFeedback | null;
        onFeedbackChange?: (feedback: AnswerFeedback) => void;
        isReadOnly?: boolean;
        maxMarks?: number;
    } = $props();
    
    // Local state for the current assessment
    let currentFeedback = $state<AnswerFeedback>(
        feedback || {
            answerId: answer.id,
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
            newMarks = answer.marks || maxMarks;
        } else if (level === 'no') {
            newMarks = 0;
        } else if (level === 'partial') {
            // Default to half marks for partial, but allow custom input
            newMarks = Math.round(((answer.marks || maxMarks) / 2) * 10) / 10; // Round to 1 decimal place
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
        const clampedValue = Math.min(Math.max(0, value), answer.marks || maxMarks);
        
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
    
    function renderAnswer(answer: string | object): string {
        if (typeof answer === 'string') {
            return answer;
        }
        if (typeof answer === 'object' && answer !== null) {
            if ('text' in answer) return answer.text as string;
            if ('answer' in answer) return answer.answer as string;
            return JSON.stringify(answer);
        }
        return 'No answer provided';
    }
</script>

<Card class="p-4">
    <div class="flex items-start justify-between gap-4">
        <!-- Left side: Answer information -->
        <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
                <h4 class="text-sm font-medium text-gray-900 leading-tight">
                    Expected Answer
                </h4>
                <Badge variant="outline" class="text-xs shrink-0">
                    {answer.marks || maxMarks} {(answer.marks || maxMarks) === 1 ? 'mark' : 'marks'}
                </Badge>
            </div>
            
            <div class="text-sm text-gray-700 mb-3 p-3 bg-gray-50 rounded-md border">
                {renderAnswer(answer.answer)}
            </div>
            
            {#if currentFeedback.feedbackLevel !== 'no' && currentFeedback.marks > 0}
                <div class="text-xs text-gray-600">
                    Awarded: {currentFeedback.marks} / {answer.marks || maxMarks} marks
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
                            max={answer.marks || maxMarks}
                            step="0.1"
                            value={currentFeedback.marks}
                            onchange={updatePartialMarks}
                            class="w-16 h-8 text-xs text-center"
                            placeholder="0"
                        />
                        <span class="text-xs text-gray-500">/ {answer.marks || maxMarks}</span>
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
                            Partial ({currentFeedback.marks} / {answer.marks || maxMarks} marks)
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
