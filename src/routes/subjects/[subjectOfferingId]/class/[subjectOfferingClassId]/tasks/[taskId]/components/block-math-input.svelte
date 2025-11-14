<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { ViewMode, type MathInputBlockProps } from '$lib/schema/task';
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
		if (
			studentMathField &&
			response.answer !== studentMathField.value &&
			document.activeElement !== studentMathField
		) {
			studentMathField.value = response.answer || '';
		}
	});

	async function initializeMathFields(MathfieldElement: any) {
		// Clean up existing fields first
		if (questionMathField && questionMathFieldElement) {
			try {
				questionMathFieldElement.removeChild(questionMathField);
			} catch (e) {}
			questionMathField = null;
		}
		if (questionDisplayField && questionDisplayElement) {
			try {
				questionDisplayElement.removeChild(questionDisplayField);
			} catch (e) {}
			questionDisplayField = null;
		}
		if (mathField && mathFieldElement) {
			try {
				mathFieldElement.removeChild(mathField);
			} catch (e) {}
			mathField = null;
		}
		if (studentMathField && studentMathFieldElement) {
			try {
				studentMathFieldElement.removeChild(studentMathField);
			} catch (e) {}
			studentMathField = null;
		}

		// Initialize the question mathfield in configure mode
		if (questionMathFieldElement && viewMode === ViewMode.CONFIGURE) {
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
					<Textarea
						id="text-input"
						class="min-h-[80px]"
						placeholder="Enter instructions or context for this math problem..."
						bind:value={config.text}
						oninput={() => {
							onConfigUpdate({
								...config,
								text: config.text
							});
						}}
					/>
					<p class="text-muted-foreground text-xs">
						Provide instructions or context that will be shown to students before the question.
					</p>
				</div>

				<!-- Math Symbol Buttons moved below instruction text -->
				<div class="space-y-2">
					<Label>Math Symbols</Label>

					<Tabs.Root
						value={activeTab}
						onchange={(e) => (activeTab = e.currentTarget.textContent as typeof activeTab)}
					>
						<Tabs.List>
							<Tabs.Trigger value="basic">± x ÷</Tabs.Trigger>
							<Tabs.Trigger value="functions">sin cos</Tabs.Trigger>
							<Tabs.Trigger value="greek">π α β</Tabs.Trigger>
							<Tabs.Trigger value="calculus">∫ d/dx</Tabs.Trigger>
							<Tabs.Trigger value="advanced">∑ ∞ √</Tabs.Trigger>
						</Tabs.List>

						<Tabs.Content value="basic">
							<div class="min-h-[80px] rounded-lg border p-3">
								<div class="flex flex-wrap gap-1">
									<!-- Basic operations -->
									<Button type="button" variant="ghost" onclick={() => insertSymbol('+')}>+</Button>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('-')}>−</Button>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\times')}
										>×</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\div')}
										>÷</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('=')}>=</Button>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\neq')}
										>≠</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\leq')}
										>≤</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\geq')}
										>≥</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('<')}
										>&lt;</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('>')}
										>&gt;</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\pm')}
										>±</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\mp')}
										>∓</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\%')}
										>%</Button
									>
									<!-- Fractions and powers -->
									<Button
										type="button"
										variant="ghost"
										onclick={() => insertSymbol('\\frac{#0}{#0}')}>½</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('^{#0}')}
										>x²</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('_{#0}')}
										>x₁</Button
									>
									<!-- Brackets -->
									<Button
										type="button"
										variant="ghost"
										onclick={() => insertSymbol('\\left(#0\\right)')}
									>
										( )
									</Button>
									<Button
										type="button"
										variant="ghost"
										onclick={() => insertSymbol('\\left[#0\\right]')}
									>
										[ ]
									</Button>
									<Button
										type="button"
										variant="ghost"
										onclick={() => insertSymbol('\\left\\{#0\\right\\}')}
									>
										&#123; &#125;
									</Button>
								</div>
							</div>
						</Tabs.Content>
						<Tabs.Content value="functions">
							<div class="min-h-[80px] rounded-lg border p-3">
								<div class="flex flex-wrap gap-1">
									<!-- Trigonometric functions -->
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\sin')}
										>sin</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\cos')}
										>cos</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\tan')}
										>tan</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\csc')}
										>csc</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\sec')}
										>sec</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\cot')}
										>cot</Button
									>
									<!-- Inverse trig functions -->
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\arcsin')}
										>sin⁻¹</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\arccos')}
										>cos⁻¹</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\arctan')}
										>tan⁻¹</Button
									>
									<!-- Logarithmic functions -->
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\log')}
										>log</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\ln')}
										>ln</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\log_{#0}')}
										>log₁₀</Button
									>
									<!-- Exponential -->
									<Button type="button" variant="ghost" onclick={() => insertSymbol('e^{#0}')}
										>eˣ</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\exp')}
										>exp</Button
									>
								</div>
							</div>
						</Tabs.Content>
						<Tabs.Content value="greek">
							<div class="min-h-[80px] rounded-lg border p-3">
								<div class="flex flex-wrap gap-1">
									<!-- Greek letters commonly used in secondary math -->
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\pi')}
										>π</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\alpha')}
										>α</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\beta')}
										>β</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\gamma')}
										>γ</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\delta')}
										>δ</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\epsilon')}
										>ε</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\theta')}
										>θ</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\lambda')}
										>λ</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\mu')}
										>μ</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\phi')}
										>φ</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\psi')}
										>ψ</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\omega')}
										>ω</Button
									>
									<!-- Capital Greek letters -->
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\Delta')}
										>Δ</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\Theta')}
										>Θ</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\Phi')}
										>Φ</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\Omega')}
										>Ω</Button
									>
								</div>
							</div>
						</Tabs.Content>
						<Tabs.Content value="calculus">
							<div class="min-h-[80px] rounded-lg border p-3">
								<div class="flex flex-wrap gap-1">
									<!-- Calculus operations -->
									<Button
										type="button"
										variant="ghost"
										onclick={() => insertSymbol('\\frac{d}{dx}')}>d/dx</Button
									>
									<Button
										type="button"
										variant="ghost"
										onclick={() => insertSymbol('\\frac{\\partial}{\\partial x}')}
									>
										∂/∂x
									</Button>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\int')}
										>∫</Button
									>
									<Button
										type="button"
										variant="ghost"
										onclick={() => insertSymbol('\\int_{#0}^{#0}')}>∫ᵃᵇ</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\iint')}
										>∬</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\iiint')}
										>∭</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\oint')}
										>∮</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\lim_{#0}')}
										>lim</Button
									>
									<Button
										type="button"
										variant="ghost"
										onclick={() => insertSymbol('\\lim_{x \\to \\infty}')}
									>
										lim x→∞
									</Button>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\nabla')}
										>∇</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol("f'")}
										>f'</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol("f''")}
										>f''</Button
									>
								</div>
							</div>
						</Tabs.Content>
						<Tabs.Content value="advanced">
							<div class="min-h-[80px] rounded-lg border p-3">
								<div class="flex flex-wrap gap-1">
									<!-- Advanced mathematical symbols -->
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\sum')}
										>Σ</Button
									>
									<Button
										type="button"
										variant="ghost"
										onclick={() => insertSymbol('\\sum_{#0}^{#0}')}
									>
										Σⁿₖ₌₁
									</Button>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\prod')}
										>∏</Button
									>
									<Button
										type="button"
										variant="ghost"
										onclick={() => insertSymbol('\\prod_{#0}^{#0}')}
									>
										∏ⁿₖ₌₁
									</Button>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\sqrt{#0}')}
										>√</Button
									>
									<Button
										type="button"
										variant="ghost"
										onclick={() => insertSymbol('\\sqrt[#0]{#0}')}>ⁿ√</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\infty')}
										>∞</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\emptyset')}
										>∅</Button
									>
									<!-- Set theory -->
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\in')}
										>∈</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\notin')}
										>∉</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\subset')}
										>⊂</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\supset')}
										>⊃</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\cup')}
										>∪</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\cap')}
										>∩</Button
									>
									<!-- Logic -->
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\land')}
										>∧</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\lor')}
										>∨</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\neg')}
										>¬</Button
									>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\rightarrow')}
										>→</Button
									>
									<Button
										type="button"
										variant="ghost"
										onclick={() => insertSymbol('\\leftrightarrow')}>↔</Button
									>
									<!-- Matrices -->
									<Button
										type="button"
										variant="ghost"
										onclick={() =>
											insertSymbol('\\begin{pmatrix} #0 & #0 \\\\ #0 & #0 \\end{pmatrix}')}
									>
										⎛⎞
									</Button>
									<Button
										type="button"
										variant="ghost"
										onclick={() =>
											insertSymbol('\\begin{bmatrix} #0 & #0 \\\\ #0 & #0 \\end{bmatrix}')}
									>
										⎡⎤
									</Button>
									<Button type="button" variant="ghost" onclick={() => insertSymbol('\\det')}
										>det</Button
									>
								</div>
							</div>
						</Tabs.Content>
					</Tabs.Root>
					<p class="text-muted-foreground text-xs">
						Click a symbol to insert it into the focused field.
					</p>
				</div>

				<div class="space-y-2">
					<Label for="question-math">Question</Label>
					<div
						bind:this={questionMathFieldElement}
						id="question-math"
						class="math-field-container"
					></div>
					<p class="text-muted-foreground text-xs">Enter your equation using the editor above.</p>
				</div>

				<div class="space-y-2">
					<Label for="answer-math">Answer</Label>
					<div bind:this={mathFieldElement} id="answer-math" class="math-field-container"></div>
					<p class="text-muted-foreground text-xs">
						Enter the answer. This will be used to check student responses.
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
							<div class="mb-4 text-base text-gray-700">
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
									<Tabs.Root
										value={studentActiveTab}
										onchange={(e) =>
											(studentActiveTab = e.currentTarget.textContent as typeof studentActiveTab)}
									>
										<Tabs.List>
											<Tabs.Trigger value="basic">± × ÷</Tabs.Trigger>
											<Tabs.Trigger value="functions">sin cos</Tabs.Trigger>
											<Tabs.Trigger value="greek">π α β</Tabs.Trigger>
											<Tabs.Trigger value="calculus">∫ d/dx</Tabs.Trigger>
											<Tabs.Trigger value="advanced">∑ ∞ √</Tabs.Trigger>
										</Tabs.List>

										<Tabs.Content value="basic">
											<div class="min-h-[60px] rounded border p-2">
												<div class="flex flex-wrap gap-1">
													<!-- Basic operations -->
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('+', 'student')}
													>
														+
													</Button>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('-', 'student')}
													>
														−
													</Button>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\times', 'student')}
													>
														×
													</Button>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\div', 'student')}
													>
														÷
													</Button>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('=', 'student')}
													>
														=
													</Button>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\neq', 'student')}
													>
														≠
													</Button>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\leq', 'student')}
													>
														≤
													</Button>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\geq', 'student')}
													>
														≥
													</Button>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('<', 'student')}
													>
														&lt;
													</Button>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('>', 'student')}
													>
														&gt;
													</Button>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\pm', 'student')}
													>
														±
													</Button>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\mp', 'student')}
													>
														∓
													</Button>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\%', 'student')}
													>
														%
													</Button>
													<!-- Fractions and powers -->
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\frac{#0}{#0}', 'student')}
													>
														½
													</Button>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('^{#0}', 'student')}
													>
														x²
													</Button>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('_{#0}', 'student')}
													>
														x₁
													</Button>
													<!-- Brackets -->
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\left(#0\\right)', 'student')}
													>
														( )
													</Button>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\left[#0\\right]', 'student')}
													>
														[ ]
													</Button>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\left\\{#0\\right\\}', 'student')}
													>
														&#123; &#125;
													</Button>
												</div>
											</div>
										</Tabs.Content>
										<Tabs.Content value="functions">
											<div class="min-h-[60px] rounded border p-2">
												<div class="flex flex-wrap gap-1">
													<!-- Trigonometric and logarithmic functions -->
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\sin', 'student')}>sin</Button
													>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\cos', 'student')}>cos</Button
													>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\tan', 'student')}>tan</Button
													>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\log', 'student')}>log</Button
													>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\ln', 'student')}>ln</Button
													>
												</div>
											</div>
										</Tabs.Content>
										<Tabs.Content value="greek">
											<div class="min-h-[60px] rounded border p-2">
												<div class="flex flex-wrap gap-1">
													<!-- Common Greek letters -->
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\pi', 'student')}>π</Button
													>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\alpha', 'student')}>α</Button
													>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\beta', 'student')}>β</Button
													>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\gamma', 'student')}>γ</Button
													>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\theta', 'student')}>θ</Button
													>
												</div>
											</div>
										</Tabs.Content>
										<Tabs.Content value="calculus">
											<div class="min-h-[60px] rounded border p-2">
												<div class="flex flex-wrap gap-1">
													<!-- Calculus operations -->
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\frac{d}{dx}', 'student')}>d/dx</Button
													>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\int', 'student')}>∫</Button
													>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\int_{#0}^{#0}', 'student')}>∫ᵃᵇ</Button
													>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\lim_{#0}', 'student')}>lim</Button
													>
												</div>
											</div>
										</Tabs.Content>
										<Tabs.Content value="advanced">
											<div class="min-h-[60px] rounded border p-2">
												<div class="flex flex-wrap gap-1">
													<!-- Advanced symbols -->
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\sqrt{#0}', 'student')}>√</Button
													>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\sqrt[#0]{#0}', 'student')}>ⁿ√</Button
													>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\infty', 'student')}>∞</Button
													>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\sum', 'student')}>Σ</Button
													>
													<Button
														type="button"
														variant="ghost"
														onclick={() => insertSymbol('\\sum_{#0}^{#0}', 'student')}>Σⁿₖ₌₁</Button
													>
												</div>
											</div>
										</Tabs.Content>
									</Tabs.Root>
								</div>
							{/if}

							<div bind:this={studentMathFieldElement} class="math-field-container"></div>

							{#if viewMode === ViewMode.ANSWER}
								<p class="text-muted-foreground text-sm">
									Use the math editor to enter your answer. You can type mathematical expressions
									directly or click the symbol buttons above.
								</p>
							{/if}
						</div>
					</div>

					{#if viewMode === ViewMode.REVIEW}
						<div class="mt-6 rounded-lg border p-4">
							{#if isAnswerCorrect()}
								<div class="text-success flex items-center gap-2">
									<CheckCircleIcon class="h-5 w-5" />
									<span class="font-medium">Correct Answer!</span>
								</div>
								<p class="text-muted-foreground mt-1 text-sm">
									Your mathematical expression matches the expected answer.
								</p>
							{:else}
								<div class="text-destructive flex items-center gap-2">
									<XCircleIcon class="h-5 w-5" />
									<span class="font-medium">Incorrect Answer</span>
								</div>
								<p class="text-muted-foreground mt-1 text-sm">
									Your answer doesn't match the expected solution. Review your mathematical
									expression.
								</p>
								{#if config.answer}
									<div class="mt-3 rounded-md p-3">
										<p class="text-success text-sm font-medium">Expected Answer:</p>
										<p class="text-success font-mono text-sm">{config.answer}</p>
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
		background-color: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: 6px;
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
		background-color: var(--color-background);
		display: block;
	}

	:global(math-field:focus-within) {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	/* Custom styling for read-only state */
	:global(math-field[readonly]) {
		background-color: var(--color-background);
		cursor: not-allowed;
	}

	/* Ensure proper spacing and layout */
	:global(math-field .ML__content) {
		padding: 8px;
	}
</style>
