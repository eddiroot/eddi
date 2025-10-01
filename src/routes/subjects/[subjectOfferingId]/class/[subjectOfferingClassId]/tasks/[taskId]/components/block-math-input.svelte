<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import Label from '$lib/components/ui/label/label.svelte';
	import {
		ViewMode,
		type MathInputBlockProps
	} from '$lib/schemas/taskSchema';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import SigmaIcon from '@lucide/svelte/icons/sigma';
	import XCircleIcon from '@lucide/svelte/icons/x-circle';
	import { onDestroy, onMount } from 'svelte';

	let { config, onConfigUpdate, response, onResponseUpdate, viewMode }: MathInputBlockProps =
		$props();

	let questionMathFieldElement = $state<HTMLElement>();
	let questionMathField: any;
	let questionDisplayElement = $state<HTMLElement>();
	let questionDisplayField: any;
	let mathFieldElement = $state<HTMLElement>();
	let mathField: any;
	let studentMathFieldElement = $state<HTMLElement>();
	let studentMathField: any;
	
	let activeMathField = $state<'question' | 'answer'>('question');
	let mathLiveLoaded = $state(false);
	let activeTab = $state<'basic' | 'functions' | 'greek' | 'calculus' | 'advanced'>('basic');
	let studentActiveTab = $state<'basic' | 'functions' | 'greek' | 'calculus' | 'advanced'>('basic');

	function checkElementsReady(): boolean {
		if (viewMode === ViewMode.CONFIGURE) {
			return !!(questionMathFieldElement && mathFieldElement);
		} else if (viewMode === ViewMode.ANSWER || viewMode === ViewMode.REVIEW) {
			return !!(questionDisplayElement && studentMathFieldElement);
		} else if (viewMode === ViewMode.PRESENT) {
			return !!(questionDisplayElement && studentMathFieldElement);
		}
		return true;
	}

	onMount(async () => {
		// Dynamically import MathLive to avoid SSR issues
		try {
			const { MathfieldElement } = await import('mathlive');

			// Completely disable font loading to avoid 404 errors
			MathfieldElement.fontsDirectory = null;
			MathfieldElement.soundsDirectory = null;

			// Disable virtual keyboard globally if available
			try {
				if (window.mathVirtualKeyboard) {
					window.mathVirtualKeyboard.hide();
					window.mathVirtualKeyboard.container = null;
				}
			} catch (e) {
				// Virtual keyboard might not be available yet, that's ok
			}

			mathLiveLoaded = true;
		} catch (error) {
			console.error('Failed to load MathLive:', error);
		}
	});

	// Reactive effect to initialize MathLive when elements are ready
	$effect(() => {
		if (!mathLiveLoaded) return;
		
		// Only track viewMode changes, not config/response changes to avoid reinitializing on every input
		const currentViewMode = viewMode;
		
		// Use a small timeout to ensure DOM elements are bound
		const timeoutId = setTimeout(async () => {
			console.log('Initializing MathLive fields for viewMode:', currentViewMode);
			console.log('Element availability:', {
				questionMathFieldElement: !!questionMathFieldElement,
				questionDisplayElement: !!questionDisplayElement,
				mathFieldElement: !!mathFieldElement,
				studentMathFieldElement: !!studentMathFieldElement
			});
			
			try {
				const { MathfieldElement } = await import('mathlive');
				await initializeMathFields(MathfieldElement);
			} catch (error) {
				console.error('Failed to initialize MathLive fields:', error);
			}
		}, 150); // Slightly longer delay

		// Cleanup function
		return () => clearTimeout(timeoutId);
	});

	// Separate effect to update existing field values when config/response changes
	// This avoids reinitializing and losing focus
	$effect(() => {
		if (!mathLiveLoaded) return;
		
		// Update question field value when config.question changes
		if (questionMathField && config.question !== questionMathField.value) {
			const wasFocused = document.activeElement === questionMathField;
			const selection = wasFocused ? questionMathField.selection : null;
			questionMathField.value = config.question || '';
			if (wasFocused && selection) {
				requestAnimationFrame(() => {
					questionMathField.focus();
					questionMathField.selection = selection;
				});
			}
		}
		
		// Update answer field value when config.answer changes
		if (mathField && config.answer !== mathField.value) {
			const wasFocused = document.activeElement === mathField;
			const selection = wasFocused ? mathField.selection : null;
			mathField.value = config.answer || '';
			if (wasFocused && selection) {
				requestAnimationFrame(() => {
					mathField.focus();
					mathField.selection = selection;
				});
			}
		}
		
		// Update question display field when config.question changes
		if (questionDisplayField && config.question !== questionDisplayField.value) {
			questionDisplayField.value = config.question || '';
		}
		
		// Update student field value when response.answer changes (but only if not currently focused)
		if (studentMathField && response.answer !== studentMathField.value && document.activeElement !== studentMathField) {
			studentMathField.value = response.answer || '';
		}
	});

	async function initializeMathFields(MathfieldElement: any) {
		console.log('initializeMathFields called with viewMode:', viewMode);
		
		// Clean up existing fields first
		if (questionMathField && questionMathFieldElement) {
			try { questionMathFieldElement.removeChild(questionMathField); } catch(e) {}
			questionMathField = null;
		}
		if (questionDisplayField && questionDisplayElement) {
			try { questionDisplayElement.removeChild(questionDisplayField); } catch(e) {}
			questionDisplayField = null;
		}
		if (mathField && mathFieldElement) {
			try { mathFieldElement.removeChild(mathField); } catch(e) {}
			mathField = null;
		}
		if (studentMathField && studentMathFieldElement) {
			try { studentMathFieldElement.removeChild(studentMathField); } catch(e) {}
			studentMathField = null;
		}

		// Initialize the question mathfield in configure mode
		if (questionMathFieldElement && viewMode === ViewMode.CONFIGURE) {
			console.log('Initializing question mathfield for CONFIGURE mode');
			questionMathField = new MathfieldElement();
			questionMathField.value = config.question || '';
			questionMathField.style.border = 'none'; // Container already has border
			questionMathField.style.borderRadius = '6px';
			questionMathField.style.padding = '8px';
			questionMathField.style.minHeight = '60px';
			questionMathField.style.width = '100%';
			questionMathField.options = {
				virtualKeyboardMode: 'off',
				virtualKeyboard: 'none',
				smartMode: true,
				smartFence: true,
				smartSuperscript: true
			};

			questionMathField.addEventListener('focus', () => {
				activeMathField = 'question';
			});

			questionMathField.addEventListener('input', () => {
				// Use a microtask to avoid synchronous updates during input
				queueMicrotask(() => {
					onConfigUpdate({
						...config,
						question: questionMathField.value
					});
				});
			});

			questionMathFieldElement.appendChild(questionMathField);
		}

		// Initialize the answer configuration mathfield
		if (mathFieldElement && viewMode === ViewMode.CONFIGURE) {
			mathField = new MathfieldElement();
			mathField.value = config.answer || '';
			mathField.style.border = 'none'; // Container already has border
			mathField.style.borderRadius = '6px';
			mathField.style.padding = '8px';
			mathField.style.minHeight = '40px';
			mathField.style.width = '100%';
			mathField.options = {
				virtualKeyboardMode: 'off',
				virtualKeyboard: 'none',
				smartMode: true,
				smartFence: true,
				smartSuperscript: true
			};

			mathField.addEventListener('focus', () => {
				activeMathField = 'answer';
			});

			mathField.addEventListener('input', () => {
				// Use a microtask to avoid synchronous updates during input
				queueMicrotask(() => {
					onConfigUpdate({
						...config,
						answer: mathField.value
					});
				});
			});

			mathFieldElement.appendChild(mathField);
		}

		// Initialize the question display field for answer/review modes
		if (questionDisplayElement && (viewMode === ViewMode.ANSWER || viewMode === ViewMode.REVIEW)) {
			console.log('Initializing question display field for', viewMode, 'mode');
			questionDisplayField = new MathfieldElement();
			questionDisplayField.value = config.question || '';
			questionDisplayField.style.border = 'none';
			questionDisplayField.style.borderRadius = '6px';
			questionDisplayField.style.padding = '8px';
			questionDisplayField.style.minHeight = '40px';
			questionDisplayField.style.width = '100%';
			questionDisplayField.style.fontSize = '18px';
			questionDisplayField.options = {
				virtualKeyboardMode: 'off',
				virtualKeyboard: 'none',
				readOnly: true,
				smartMode: true,
				smartFence: true,
				smartSuperscript: true
			};

			questionDisplayElement.appendChild(questionDisplayField);
		}

		// Initialize the student answer mathfield
		if (studentMathFieldElement && (viewMode === ViewMode.ANSWER || viewMode === ViewMode.REVIEW)) {
			studentMathField = new MathfieldElement();
			studentMathField.value = response.answer || '';
			studentMathField.style.border = 'none'; // Container already has border
			studentMathField.style.borderRadius = '6px';
			studentMathField.style.padding = '8px';
			studentMathField.style.minHeight = '40px';
			studentMathField.style.width = '100%';
			
			const isReadOnly = viewMode === ViewMode.REVIEW;
			studentMathField.options = {
				virtualKeyboardMode: 'off',
				virtualKeyboard: 'none',
				smartMode: true,
				smartFence: true,
				smartSuperscript: true,
				readOnly: isReadOnly
			};

			// Add event listener for both modes, but only allow updates in ANSWER mode
			studentMathField.addEventListener('input', () => {
				if (viewMode === ViewMode.ANSWER) {
					// Use a microtask to avoid synchronous updates during input
					queueMicrotask(() => {
						onResponseUpdate({
							...response,
							answer: studentMathField.value
						});
					});
				}
			});

			studentMathFieldElement.appendChild(studentMathField);
		}

		// Initialize for present mode if needed
		// TODO: Implement PRESENT mode properly with question display and student input
		if (questionDisplayElement && viewMode === ViewMode.PRESENT) {
			questionDisplayField = new MathfieldElement();
			questionDisplayField.value = config.question || '';
			questionDisplayField.style.border = 'none';
			questionDisplayField.style.borderRadius = '6px';
			questionDisplayField.style.padding = '8px';
			questionDisplayField.style.minHeight = '40px';
			questionDisplayField.style.width = '100%';
			questionDisplayField.style.fontSize = '24px';
			questionDisplayField.options = {
				virtualKeyboardMode: 'off',
				virtualKeyboard: 'none',
				readOnly: true,
				smartMode: true,
				smartFence: true,
				smartSuperscript: true
			};

			questionDisplayElement.appendChild(questionDisplayField);
		}

		if (studentMathFieldElement && viewMode === ViewMode.PRESENT) {
			studentMathField = new MathfieldElement();
			studentMathField.value = response.answer || '';
			studentMathField.style.border = 'none'; // Container already has border
			studentMathField.style.borderRadius = '6px';
			studentMathField.style.padding = '12px';
			studentMathField.style.minHeight = '60px';
			studentMathField.style.width = '100%';
			studentMathField.style.fontSize = '18px';
			studentMathField.options = {
				virtualKeyboardMode: 'off',
				virtualKeyboard: 'none',
				smartMode: true,
				smartFence: true,
				smartSuperscript: true
			};

			studentMathField.addEventListener('input', () => {
				// Use a microtask to avoid synchronous updates during input
				queueMicrotask(() => {
					onResponseUpdate({
						...response,
						answer: studentMathField.value
					});
				});
			});

			studentMathFieldElement.appendChild(studentMathField);
		}
	}

	onDestroy(() => {
		// Clean up MathLive instances to prevent memory leaks
		if (questionMathField && questionMathFieldElement) {
			questionMathFieldElement.removeChild(questionMathField);
			questionMathField = null;
		}
		if (questionDisplayField && questionDisplayElement) {
			questionDisplayElement.removeChild(questionDisplayField);
			questionDisplayField = null;
		}
		if (mathField && mathFieldElement) {
			mathFieldElement.removeChild(mathField);
			mathField = null;
		}
		if (studentMathField && studentMathFieldElement) {
			studentMathFieldElement.removeChild(studentMathField);
			studentMathField = null;
		}
	});

	function isAnswerCorrect(): boolean {
		if (!config.answer || !response.answer) return false;
		// Basic LaTeX comparison - in a real implementation, you might want
		// to use a more sophisticated math comparison library
		return config.answer.trim() === response.answer.trim();
	}

	function insertSymbol(symbol: string, field?: 'question' | 'answer' | 'student') {
		let targetField;
		
		if (field === 'question') {
			targetField = questionMathField;
		} else if (field === 'answer') {
			targetField = mathField;
		} else if (field === 'student') {
			targetField = studentMathField;
		} else {
			// Use the currently active field in configure mode
			if (viewMode === ViewMode.CONFIGURE) {
				targetField = activeMathField === 'question' ? questionMathField : mathField;
			} else {
				targetField = studentMathField;
			}
		}
		
		if (targetField && !targetField.readOnly) {
			targetField.insert(symbol);
			targetField.focus();
		}
	}
</script>

<div class="flex w-full flex-col gap-4">
	{#if viewMode === ViewMode.CONFIGURE}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<SigmaIcon />
					Configure Math Input Block
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-6">
				<div class="space-y-2">
					<Label for="text-input">Instruction Text</Label>
					<textarea 
						id="text-input"
						class="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
						placeholder="Enter instructions or context for this math problem..."
						bind:value={config.text}
						oninput={() => {
							onConfigUpdate({
								...config,
								text: config.text
							});
						}}
					></textarea>
					<p class="text-muted-foreground text-xs">
						Provide instructions or context that will be shown to students before the question.
					</p>
				</div>

				<!-- Math Symbol Buttons moved below instruction text -->
				<div class="space-y-2">
					<Label>Math Symbols</Label>
					
					<!-- Tab navigation -->
					<div class="flex border-b border-gray-200">
						<button 
							type="button"
							class="px-3 py-2 text-sm font-medium border-b-2 {activeTab === 'basic' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
							onclick={() => activeTab = 'basic'}
						>
							± × ÷
						</button>
						<button 
							type="button"
							class="px-3 py-2 text-sm font-medium border-b-2 {activeTab === 'functions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
							onclick={() => activeTab = 'functions'}
						>
							sin cos
						</button>
						<button 
							type="button"
							class="px-3 py-2 text-sm font-medium border-b-2 {activeTab === 'greek' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
							onclick={() => activeTab = 'greek'}
						>
							π α β
						</button>
						<button 
							type="button"
							class="px-3 py-2 text-sm font-medium border-b-2 {activeTab === 'calculus' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
							onclick={() => activeTab = 'calculus'}
						>
							∫ d/dx
						</button>
						<button 
							type="button"
							class="px-3 py-2 text-sm font-medium border-b-2 {activeTab === 'advanced' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
							onclick={() => activeTab = 'advanced'}
						>
							∑ ∞ √
						</button>
					</div>

					<!-- Symbol content based on active tab -->
					<div class="p-3 bg-gray-50 rounded-lg border min-h-[80px]">
						{#if activeTab === 'basic'}
							<div class="flex flex-wrap gap-1">
								<!-- Basic operations -->
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('+')}
								>
									+
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('-')}
								>
									−
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\times')}
								>
									×
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\div')}
								>
									÷
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('=')}
								>
									=
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\neq')}
								>
									≠
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\leq')}
								>
									≤
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\geq')}
								>
									≥
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('<')}
								>
									&lt;
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('>')}
								>
									&gt;
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\pm')}
								>
									±
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\mp')}
								>
									∓
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\%')}
								>
									%
								</button>
								<!-- Fractions and powers -->
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\frac{#0}{#0}')}
								>
									½
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('^{#0}')}
								>
									x²
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('_{#0}')}
								>
									x₁
								</button>
								<!-- Brackets -->
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\left(#0\\right)')}
								>
									( )
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\left[#0\\right]')}
								>
									[ ]
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\left\\{#0\\right\\}')}
								>
									&#123; &#125;
								</button>
							</div>
						{:else if activeTab === 'functions'}
							<div class="flex flex-wrap gap-1">
								<!-- Trigonometric functions -->
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\sin')}
								>
									sin
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\cos')}
								>
									cos
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\tan')}
								>
									tan
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\csc')}
								>
									csc
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\sec')}
								>
									sec
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\cot')}
								>
									cot
								</button>
								<!-- Inverse trig functions -->
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\arcsin')}
								>
									sin⁻¹
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\arccos')}
								>
									cos⁻¹
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\arctan')}
								>
									tan⁻¹
								</button>
								<!-- Logarithmic functions -->
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\log')}
								>
									log
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\ln')}
								>
									ln
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\log_{#0}')}
								>
									log₁₀
								</button>
								<!-- Exponential -->
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('e^{#0}')}
								>
									eˣ
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\exp')}
								>
									exp
								</button>
							</div>
						{:else if activeTab === 'greek'}
							<div class="flex flex-wrap gap-1">
								<!-- Greek letters commonly used in secondary math -->
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\pi')}
								>
									π
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\alpha')}
								>
									α
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\beta')}
								>
									β
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\gamma')}
								>
									γ
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\delta')}
								>
									δ
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\epsilon')}
								>
									ε
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\theta')}
								>
									θ
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\lambda')}
								>
									λ
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\mu')}
								>
									μ
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\phi')}
								>
									φ
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\psi')}
								>
									ψ
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\omega')}
								>
									ω
								</button>
								<!-- Capital Greek letters -->
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\Delta')}
								>
									Δ
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\Theta')}
								>
									Θ
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\Phi')}
								>
									Φ
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\Omega')}
								>
									Ω
								</button>
							</div>
						{:else if activeTab === 'calculus'}
							<div class="flex flex-wrap gap-1">
								<!-- Calculus operations -->
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\frac{d}{dx}')}
								>
									d/dx
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\frac{\\partial}{\\partial x}')}
								>
									∂/∂x
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\int')}
								>
									∫
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\int_{#0}^{#0}')}
								>
									∫ᵃᵇ
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\iint')}
								>
									∬
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\iiint')}
								>
									∭
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\oint')}
								>
									∮
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\lim_{#0}')}
								>
									lim
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\lim_{x \\to \\infty}')}
								>
									lim x→∞
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\nabla')}
								>
									∇
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('f\'')}
								>
									f'
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('f\'\'')}
								>
									f''
								</button>
							</div>
						{:else if activeTab === 'advanced'}
							<div class="flex flex-wrap gap-1">
								<!-- Advanced mathematical symbols -->
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\sum')}
								>
									Σ
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\sum_{#0}^{#0}')}
								>
									Σⁿₖ₌₁
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\prod')}
								>
									∏
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\prod_{#0}^{#0}')}
								>
									∏ⁿₖ₌₁
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\sqrt{#0}')}
								>
									√
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\sqrt[#0]{#0}')}
								>
									ⁿ√
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\infty')}
								>
									∞
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\emptyset')}
								>
									∅
								</button>
								<!-- Set theory -->
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\in')}
								>
									∈
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\notin')}
								>
									∉
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\subset')}
								>
									⊂
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\supset')}
								>
									⊃
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\cup')}
								>
									∪
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\cap')}
								>
									∩
								</button>
								<!-- Logic -->
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\land')}
								>
									∧
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\lor')}
								>
									∨
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\neg')}
								>
									¬
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\rightarrow')}
								>
									→
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\leftrightarrow')}
								>
									↔
								</button>
								<!-- Matrices -->
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\begin{pmatrix} #0 & #0 \\\\ #0 & #0 \\end{pmatrix}')}
								>
									⎛⎞
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\begin{bmatrix} #0 & #0 \\\\ #0 & #0 \\end{bmatrix}')}
								>
									⎡⎤
								</button>
								<button 
									type="button"
									class="px-2 py-1 text-sm border rounded hover:bg-white bg-white shadow-sm"
									onclick={() => insertSymbol('\\det')}
								>
									det
								</button>
							</div>
						{/if}
					</div>
					<p class="text-muted-foreground text-xs">
						Click any symbol to insert it into the currently focused field (question or answer).
					</p>
				</div>

				<div class="space-y-2">
					<Label for="question-math">Question</Label>
					<div bind:this={questionMathFieldElement} id="question-math" class="math-field-container"></div>
					<p class="text-muted-foreground text-xs">
						Enter your math question using the editor above. Students will see this question when answering.
					</p>
				</div>

				<div class="space-y-2">
					<Label for="answer-math">Correct Answer</Label>
					<div bind:this={mathFieldElement} id="answer-math" class="math-field-container"></div>
					<p class="text-muted-foreground text-xs">
						Enter the correct mathematical answer. This will be used to check student responses.
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	{:else if viewMode === ViewMode.ANSWER || viewMode === ViewMode.REVIEW}
		{#if config.question}
			<Card.Root>
				<Card.Content class="space-y-4">
					<div class="space-y-4">
						<!-- Display instruction text if provided -->
						{#if config.text}
							<div class="text-base text-gray-700 mb-4">
								<p>{config.text}</p>
							</div>
						{/if}
						
						<!-- Display question as rendered math -->
						<div class="text-lg font-medium">
							<div bind:this={questionDisplayElement} class="question-display-container"></div>
						</div>
						
						<div class="space-y-2">
							<Label>Your Answer</Label>
							
							{#if viewMode === ViewMode.ANSWER}
								<!-- Student Math Symbol Buttons with Tabs -->
								<div class="space-y-2">
									<!-- Tab navigation for students -->
									<div class="flex border-b border-gray-200">
										<button 
											type="button"
											class="px-3 py-2 text-sm font-medium border-b-2 {studentActiveTab === 'basic' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
											onclick={() => studentActiveTab = 'basic'}
										>
											± × ÷
										</button>
										<button 
											type="button"
											class="px-3 py-2 text-sm font-medium border-b-2 {studentActiveTab === 'functions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
											onclick={() => studentActiveTab = 'functions'}
										>
											sin cos
										</button>
										<button 
											type="button"
											class="px-3 py-2 text-sm font-medium border-b-2 {studentActiveTab === 'greek' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
											onclick={() => studentActiveTab = 'greek'}
										>
											π α β
										</button>
										<button 
											type="button"
											class="px-3 py-2 text-sm font-medium border-b-2 {studentActiveTab === 'calculus' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
											onclick={() => studentActiveTab = 'calculus'}
										>
											∫ d/dx
										</button>
										<button 
											type="button"
											class="px-3 py-2 text-sm font-medium border-b-2 {studentActiveTab === 'advanced' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
											onclick={() => studentActiveTab = 'advanced'}
										>
											∑ ∞ √
										</button>
									</div>

									<!-- Symbol content based on active tab -->
									<div class="p-2 bg-gray-50 rounded border min-h-[60px]">
										{#if studentActiveTab === 'basic'}
											<div class="flex flex-wrap gap-1">
												<!-- Basic operations -->
												<button 
													type="button"
													class="px-2 py-1 text-sm border rounded hover:bg-gray-50"
													onclick={() => insertSymbol('+', 'student')}
												>
													+
												</button>
												<button 
													type="button"
													class="px-2 py-1 text-sm border rounded hover:bg-gray-50"
													onclick={() => insertSymbol('-', 'student')}
												>
													−
												</button>
												<button 
													type="button"
													class="px-2 py-1 text-sm border rounded hover:bg-gray-50"
													onclick={() => insertSymbol('\\times', 'student')}
												>
													×
												</button>
												<button 
													type="button"
													class="px-2 py-1 text-sm border rounded hover:bg-gray-50"
													onclick={() => insertSymbol('\\div', 'student')}
												>
													÷
												</button>
												<button 
													type="button"
													class="px-2 py-1 text-sm border rounded hover:bg-gray-50"
													onclick={() => insertSymbol('=', 'student')}
												>
													=
												</button>
												<button 
													type="button"
													class="px-2 py-1 text-sm border rounded hover:bg-gray-50"
													onclick={() => insertSymbol('\\neq', 'student')}
												>
													≠
												</button>
												<button 
													type="button"
													class="px-2 py-1 text-sm border rounded hover:bg-gray-50"
													onclick={() => insertSymbol('\\leq', 'student')}
												>
													≤
												</button>
												<button 
													type="button"
													class="px-2 py-1 text-sm border rounded hover:bg-gray-50"
													onclick={() => insertSymbol('\\geq', 'student')}
												>
													≥
												</button>
												<button 
													type="button"
													class="px-2 py-1 text-sm border rounded hover:bg-gray-50"
													onclick={() => insertSymbol('<', 'student')}
												>
													&lt;
												</button>
												<button 
													type="button"
													class="px-2 py-1 text-sm border rounded hover:bg-gray-50"
													onclick={() => insertSymbol('>', 'student')}
												>
													&gt;
												</button>
												<button 
													type="button"
													class="px-2 py-1 text-sm border rounded hover:bg-gray-50"
													onclick={() => insertSymbol('\\pm', 'student')}
												>
													±
												</button>
												<button 
													type="button"
													class="px-2 py-1 text-sm border rounded hover:bg-gray-50"
													onclick={() => insertSymbol('\\mp', 'student')}
												>
													∓
												</button>
												<button 
													type="button"
													class="px-2 py-1 text-sm border rounded hover:bg-gray-50"
													onclick={() => insertSymbol('\\%', 'student')}
												>
													%
												</button>
												<!-- Fractions and powers -->
												<button 
													type="button"
													class="px-2 py-1 text-sm border rounded hover:bg-gray-50"
													onclick={() => insertSymbol('\\frac{#0}{#0}', 'student')}
												>
													½
												</button>
												<button 
													type="button"
													class="px-2 py-1 text-sm border rounded hover:bg-gray-50"
													onclick={() => insertSymbol('^{#0}', 'student')}
												>
													x²
												</button>
												<button 
													type="button"
													class="px-2 py-1 text-sm border rounded hover:bg-gray-50"
													onclick={() => insertSymbol('_{#0}', 'student')}
												>
													x₁
												</button>
												<!-- Brackets -->
												<button 
													type="button"
													class="px-2 py-1 text-sm border rounded hover:bg-gray-50"
													onclick={() => insertSymbol('\\left(#0\\right)', 'student')}
												>
													( )
												</button>
												<button 
													type="button"
													class="px-2 py-1 text-sm border rounded hover:bg-gray-50"
													onclick={() => insertSymbol('\\left[#0\\right]', 'student')}
												>
													[ ]
												</button>
												<button 
													type="button"
													class="px-2 py-1 text-sm border rounded hover:bg-gray-50"
													onclick={() => insertSymbol('\\left\\{#0\\right\\}', 'student')}
												>
													&#123; &#125;
												</button>
											</div>
										{:else if studentActiveTab === 'functions'}
											<div class="flex flex-wrap gap-1">
												<!-- Trigonometric and logarithmic functions -->
												<button type="button" class="px-2 py-1 text-sm border rounded hover:bg-gray-50" onclick={() => insertSymbol('\\sin', 'student')}>sin</button>
												<button type="button" class="px-2 py-1 text-sm border rounded hover:bg-gray-50" onclick={() => insertSymbol('\\cos', 'student')}>cos</button>
												<button type="button" class="px-2 py-1 text-sm border rounded hover:bg-gray-50" onclick={() => insertSymbol('\\tan', 'student')}>tan</button>
												<button type="button" class="px-2 py-1 text-sm border rounded hover:bg-gray-50" onclick={() => insertSymbol('\\log', 'student')}>log</button>
												<button type="button" class="px-2 py-1 text-sm border rounded hover:bg-gray-50" onclick={() => insertSymbol('\\ln', 'student')}>ln</button>
											</div>
										{:else if studentActiveTab === 'greek'}
											<div class="flex flex-wrap gap-1">
												<!-- Common Greek letters -->
												<button type="button" class="px-2 py-1 text-sm border rounded hover:bg-gray-50" onclick={() => insertSymbol('\\pi', 'student')}>π</button>
												<button type="button" class="px-2 py-1 text-sm border rounded hover:bg-gray-50" onclick={() => insertSymbol('\\alpha', 'student')}>α</button>
												<button type="button" class="px-2 py-1 text-sm border rounded hover:bg-gray-50" onclick={() => insertSymbol('\\beta', 'student')}>β</button>
												<button type="button" class="px-2 py-1 text-sm border rounded hover:bg-gray-50" onclick={() => insertSymbol('\\gamma', 'student')}>γ</button>
												<button type="button" class="px-2 py-1 text-sm border rounded hover:bg-gray-50" onclick={() => insertSymbol('\\theta', 'student')}>θ</button>
											</div>
										{:else if studentActiveTab === 'calculus'}
											<div class="flex flex-wrap gap-1">
												<!-- Calculus operations -->
												<button type="button" class="px-2 py-1 text-sm border rounded hover:bg-gray-50" onclick={() => insertSymbol('\\frac{d}{dx}', 'student')}>d/dx</button>
												<button type="button" class="px-2 py-1 text-sm border rounded hover:bg-gray-50" onclick={() => insertSymbol('\\int', 'student')}>∫</button>
												<button type="button" class="px-2 py-1 text-sm border rounded hover:bg-gray-50" onclick={() => insertSymbol('\\int_{#0}^{#0}', 'student')}>∫ᵃᵇ</button>
												<button type="button" class="px-2 py-1 text-sm border rounded hover:bg-gray-50" onclick={() => insertSymbol('\\lim_{#0}', 'student')}>lim</button>
											</div>
										{:else if studentActiveTab === 'advanced'}
											<div class="flex flex-wrap gap-1">
												<!-- Advanced symbols -->
												<button type="button" class="px-2 py-1 text-sm border rounded hover:bg-gray-50" onclick={() => insertSymbol('\\sqrt{#0}', 'student')}>√</button>
												<button type="button" class="px-2 py-1 text-sm border rounded hover:bg-gray-50" onclick={() => insertSymbol('\\sqrt[#0]{#0}', 'student')}>ⁿ√</button>
												<button type="button" class="px-2 py-1 text-sm border rounded hover:bg-gray-50" onclick={() => insertSymbol('\\infty', 'student')}>∞</button>
												<button type="button" class="px-2 py-1 text-sm border rounded hover:bg-gray-50" onclick={() => insertSymbol('\\sum', 'student')}>Σ</button>
												<button type="button" class="px-2 py-1 text-sm border rounded hover:bg-gray-50" onclick={() => insertSymbol('\\sum_{#0}^{#0}', 'student')}>Σⁿₖ₌₁</button>
											</div>
										{/if}
									</div>
								</div>
							{/if}
							
							<div bind:this={studentMathFieldElement} class="math-field-container"></div>
							
							{#if viewMode === ViewMode.ANSWER}
								<p class="text-muted-foreground text-sm">
									Use the math editor to enter your answer. You can type mathematical expressions directly or click the symbol buttons above.
								</p>
							{/if}
						</div>
					</div>

					{#if viewMode === ViewMode.REVIEW}
						<div class="mt-6 rounded-lg border p-4">
							{#if isAnswerCorrect()}
								<div class="text-green-600 flex items-center gap-2">
									<CheckCircleIcon class="h-5 w-5" />
									<span class="font-medium">Correct Answer!</span>
								</div>
								<p class="text-muted-foreground mt-1 text-sm">
									Your mathematical expression matches the expected answer.
								</p>
							{:else}
								<div class="text-red-600 flex items-center gap-2">
									<XCircleIcon class="h-5 w-5" />
									<span class="font-medium">Incorrect Answer</span>
								</div>
								<p class="text-muted-foreground mt-1 text-sm">
									Your answer doesn't match the expected solution. Review your mathematical expression.
								</p>
								{#if config.answer}
									<div class="mt-3 rounded-md bg-green-50 p-3">
										<p class="text-sm font-medium text-green-800">Expected Answer:</p>
										<p class="text-sm font-mono text-green-700">{config.answer}</p>
									</div>
								{/if}
							{/if}
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="flex h-48 w-full items-center justify-center rounded-lg border border-dashed">
				<div class="text-center">
					<SigmaIcon class="text-muted-foreground mx-auto h-12 w-12" />
					<p class="text-muted-foreground mt-2 text-sm">No math question created</p>
					<p class="text-muted-foreground text-xs">
						Switch to edit mode to create a math input question
					</p>
				</div>
			</div>
		{/if}
	{:else if viewMode === ViewMode.PRESENT}
		<!-- TODO: Implement PRESENT mode properly with question display and student input -->
	{/if}
</div>

<style>
	/* Math field container styling */
	:global(.math-field-container) {
		min-height: 40px;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		background: white;
	}

	/* Question mathfield should be taller to accommodate longer questions */
	:global(#question-math.math-field-container) {
		min-height: 60px;
	}

	/* Question display container styling */
	:global(.question-display-container) {
		background: transparent;
		border: none;
	}

	/* Global styles for MathLive */
	:global(math-field) {
		font-size: 16px;
		line-height: 1.5;
		min-height: 40px;
		width: 100%;
		display: block;
	}

	:global(math-field:focus-within) {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	/* Ensure virtual keyboard styling is consistent */
	:global(.ML__keyboard) {
		z-index: 1000;
	}

	/* Completely hide virtual keyboard and its toggle button */
	:global(.ML__virtual-keyboard-toggle),
	:global(.ML__virtual-keyboard),
	:global(.ML__keyboard-toggle),
	:global([data-tooltip="Toggle Virtual Keyboard"]) {
		display: none !important;
		visibility: hidden !important;
	}

	/* Custom styling for read-only state */
	:global(math-field[readonly]) {
		background-color: #f8f9fa;
		cursor: not-allowed;
	}

	/* Ensure proper spacing and layout */
	:global(math-field .ML__content) {
		padding: 8px;
	}
</style>
