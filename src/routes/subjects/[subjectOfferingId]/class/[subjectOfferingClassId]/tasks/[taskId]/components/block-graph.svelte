<script lang="ts">
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import { ViewMode, type GraphBlockProps } from '$lib/schemas/taskSchema';
	import { onMount } from 'svelte';
	import { evaluate } from 'mathjs';
	import type { PlotData } from 'plotly.js';

	let { config, onConfigUpdate, response, onResponseUpdate, viewMode }: GraphBlockProps = $props();

	let plotContainer: HTMLDivElement | undefined = $state();
	let Plotly: typeof import('plotly.js');

	onMount(async () => {
		const plotlyModule = await import('plotly.js');
		Plotly = plotlyModule.default;
		await updatePlot();
	});

	function generatePlotData(equation: string, xRange: { min: number; max: number }) {
		const xValues = [];
		const yValues = [];
		const step = (xRange.max - xRange.min) / 1000;

		for (let x = xRange.min; x <= xRange.max; x += step) {
			try {
				const y = evaluate(equation, { x });
				if (typeof y === 'number' && isFinite(y)) {
					xValues.push(x);
					yValues.push(y);
				}
			} catch (error) {
				// Skip invalid points
			}
		}

		return { x: xValues, y: yValues };
	}

	async function updatePlot() {
		if (!Plotly || !plotContainer) return;

		const traces: Partial<PlotData>[] = [];

		config.staticPlots.forEach((plot) => {
			try {
				const data = generatePlotData(plot.equation, config.xRange);
				if (data.x.length > 0) {
					traces.push({
						x: data.x,
						y: data.y,
						type: 'scatter',
						mode: 'lines',
						name: plot.label,
						line: { color: plot.color, width: 2 }
					});
				}
			} catch (error) {
				console.warn(`Error plotting equation "${plot.equation}":`, error);
			}
		});

		if ((viewMode === ViewMode.ANSWER || viewMode === ViewMode.REVIEW) && response.studentPlots) {
			response.studentPlots.forEach((plot) => {
				try {
					const data = generatePlotData(plot.equation, config.xRange);
					if (data.x.length > 0) {
						traces.push({
							x: data.x,
							y: data.y,
							type: 'scatter',
							mode: 'lines',
							name: plot.label,
							line: { color: plot.color, width: 2, dash: 'dash' }
						});
					}
				} catch (error) {
					console.warn(`Error plotting student equation "${plot.equation}":`, error);
				}
			});
		}

		const layout = {
			title: { text: config.title },
			xaxis: {
				title: { text: config.xAxisLabel },
				range: [config.xRange.min, config.xRange.max],
				zeroline: true,
				grid: true
			},
			yaxis: {
				title: { text: config.yAxisLabel },
				range: [config.yRange.min, config.yRange.max],
				zeroline: true,
				grid: true
			},
			showlegend: traces.length > 1,
			responsive: true,
			height: 500
		};

		await Plotly.newPlot(plotContainer, traces, layout, { displayModeBar: false });
	}

	function addStaticPlot() {
		const newPlot = {
			id: crypto.randomUUID(),
			equation: 'x',
			color: '#3b82f6',
			label: `Plot ${config.staticPlots.length + 1}`
		};

		const updatedConfig = {
			...config,
			staticPlots: [...config.staticPlots, newPlot]
		};

		onConfigUpdate(updatedConfig);
	}

	function removeStaticPlot(index: number) {
		const updatedConfig = {
			...config,
			staticPlots: config.staticPlots.filter((_, i) => i !== index)
		};

		onConfigUpdate(updatedConfig);
	}

	function updateStaticPlot(index: number, field: string, value: string) {
		const updatedPlots = [...config.staticPlots];
		updatedPlots[index] = { ...updatedPlots[index], [field]: value };

		const updatedConfig = {
			...config,
			staticPlots: updatedPlots
		};

		onConfigUpdate(updatedConfig);
	}

	function addStudentPlot() {
		if (!response) return;

		const newPlot = {
			id: crypto.randomUUID(),
			equation: 'x',
			color: '#ef4444',
			label: `My Plot ${response.studentPlots.length + 1}`
		};

		const updatedResponse = {
			...response,
			studentPlots: [...response.studentPlots, newPlot]
		};

		onResponseUpdate(updatedResponse);
	}

	function removeStudentPlot(index: number) {
		if (!response) return;

		const updatedResponse = {
			...response,
			studentPlots: response.studentPlots.filter((_, i) => i !== index)
		};

		onResponseUpdate(updatedResponse);
	}

	function updateStudentPlot(index: number, field: string, value: string) {
		if (!response) return;

		const updatedPlots = [...response.studentPlots];
		updatedPlots[index] = { ...updatedPlots[index], [field]: value };

		const updatedResponse = {
			...response,
			studentPlots: updatedPlots
		};

		onResponseUpdate(updatedResponse);
	}

	$effect(() => {
		if (config || response) {
			updatePlot();
		}
	});
</script>

<div class="flex w-full flex-col gap-4">
	{#if viewMode === ViewMode.CONFIGURE}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<TrendingUpIcon />
					Configure Graph Block
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-6">
				<!-- Graph Settings -->
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="space-y-2">
						<Label for="graph-title">Title</Label>
						<Input
							id="graph-title"
							value={config.title}
							oninput={(e) => {
								const value = (e.target as HTMLInputElement)?.value;
								onConfigUpdate({ ...config, title: value });
							}}
							placeholder="Graph title"
						/>
					</div>

					<div class="space-y-2">
						<Label for="x-axis-label">X-Axis Label</Label>
						<Input
							id="x-axis-label"
							value={config.xAxisLabel}
							oninput={(e) => {
								const value = (e.target as HTMLInputElement)?.value;
								onConfigUpdate({ ...config, xAxisLabel: value });
							}}
							placeholder="x"
						/>
					</div>

					<div class="space-y-2">
						<Label for="y-axis-label">Y-Axis Label</Label>
						<Input
							id="y-axis-label"
							value={config.yAxisLabel}
							oninput={(e) => {
								const value = (e.target as HTMLInputElement)?.value;
								onConfigUpdate({ ...config, yAxisLabel: value });
							}}
							placeholder="y"
						/>
					</div>
				</div>

				<!-- Axis Ranges -->
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label>X-Axis Range</Label>
						<div class="flex gap-2">
							<Input
								type="number"
								value={config.xRange.min}
								oninput={(e) => {
									const value = Number((e.target as HTMLInputElement)?.value);
									onConfigUpdate({
										...config,
										xRange: { ...config.xRange, min: value }
									});
								}}
								placeholder="Min"
							/>
							<Input
								type="number"
								value={config.xRange.max}
								oninput={(e) => {
									const value = Number((e.target as HTMLInputElement)?.value);
									onConfigUpdate({
										...config,
										xRange: { ...config.xRange, max: value }
									});
								}}
								placeholder="Max"
							/>
						</div>
					</div>

					<div class="space-y-2">
						<Label>Y-Axis Range</Label>
						<div class="flex gap-2">
							<Input
								type="number"
								value={config.yRange.min}
								oninput={(e) => {
									const value = Number((e.target as HTMLInputElement)?.value);
									onConfigUpdate({
										...config,
										yRange: { ...config.yRange, min: value }
									});
								}}
								placeholder="Min"
							/>
							<Input
								type="number"
								value={config.yRange.max}
								oninput={(e) => {
									const value = Number((e.target as HTMLInputElement)?.value);
									onConfigUpdate({
										...config,
										yRange: { ...config.yRange, max: value }
									});
								}}
								placeholder="Max"
							/>
						</div>
					</div>
				</div>

				<!-- Static Plots Configuration -->
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<Label class="text-base font-semibold">Static Plots (Teacher Examples)</Label>
						<Button onclick={addStaticPlot} variant="outline" size="sm">
							<PlusIcon class="mr-2" />
							Add Plot
						</Button>
					</div>

					{#each config.staticPlots as plot, index}
						<div class="space-y-3 rounded-lg border p-4">
							<div class="flex items-center justify-between">
								<span class="font-medium">Plot {index + 1}</span>
								<Button onclick={() => removeStaticPlot(index)} variant="destructive" size="sm">
									<TrashIcon />
								</Button>
							</div>

							<div class="grid grid-cols-1 gap-3 md:grid-cols-3">
								<div class="space-y-1">
									<Label>Equation (use 'x' as variable)</Label>
									<Input
										value={plot.equation}
										oninput={(e) => {
											const value = (e.target as HTMLInputElement)?.value;
											updateStaticPlot(index, 'equation', value);
										}}
										placeholder="e.g., x^2, sin(x), 2*x+1"
									/>
								</div>

								<div class="space-y-1">
									<Label>Color</Label>
									<Input
										type="color"
										value={plot.color}
										oninput={(e) => {
											const value = (e.target as HTMLInputElement)?.value;
											updateStaticPlot(index, 'color', value);
										}}
									/>
								</div>

								<div class="space-y-1">
									<Label>Label</Label>
									<Input
										value={plot.label}
										oninput={(e) => {
											const value = (e.target as HTMLInputElement)?.value;
											updateStaticPlot(index, 'label', value);
										}}
										placeholder="Plot label"
									/>
								</div>
							</div>
						</div>
					{/each}

					{#if config.staticPlots.length === 0}
						<p class="text-muted-foreground py-4 text-center text-sm">
							No static plots configured. Add some example equations for students to see.
						</p>
					{/if}
				</div>

				<!-- Preview -->
				<div class="space-y-2">
					<Label class="text-base font-semibold">Preview</Label>
					<div bind:this={plotContainer} class="rounded-lg border"></div>
				</div>
			</Card.Content>
		</Card.Root>
	{:else if viewMode === ViewMode.ANSWER || viewMode === ViewMode.REVIEW}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<TrendingUpIcon />
					{config.title}
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-6">
				<!-- Graph Display -->
				<div bind:this={plotContainer} class="rounded-lg border"></div>

				{#if viewMode === ViewMode.ANSWER}
					<!-- Student Plot Controls -->
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<Label class="text-base font-semibold">Add Your Own Plots</Label>
							<Button onclick={addStudentPlot} variant="outline" size="sm">
								<PlusIcon class="mr-2" />
								Add Plot
							</Button>
						</div>

						{#each response.studentPlots as plot, index}
							<div class="bg-muted/30 space-y-3 rounded-lg border p-4">
								<div class="flex items-center justify-between">
									<span class="font-medium">Your Plot {index + 1}</span>
									<Button onclick={() => removeStudentPlot(index)} variant="destructive" size="sm">
										<TrashIcon />
									</Button>
								</div>

								<div class="grid grid-cols-1 gap-3 md:grid-cols-3">
									<div class="space-y-1">
										<Label>Equation (use 'x' as variable)</Label>
										<Input
											value={plot.equation}
											oninput={(e) => {
												const value = (e.target as HTMLInputElement)?.value;
												updateStudentPlot(index, 'equation', value);
											}}
											placeholder="e.g., x^2, sin(x), 2*x+1"
										/>
									</div>

									<div class="space-y-1">
										<Label>Color</Label>
										<Input
											type="color"
											value={plot.color}
											oninput={(e) => {
												const value = (e.target as HTMLInputElement)?.value;
												updateStudentPlot(index, 'color', value);
											}}
										/>
									</div>

									<div class="space-y-1">
										<Label>Label</Label>
										<Input
											value={plot.label}
											oninput={(e) => {
												const value = (e.target as HTMLInputElement)?.value;
												updateStudentPlot(index, 'label', value);
											}}
											placeholder="Plot label"
										/>
									</div>
								</div>
							</div>
						{/each}

						<p class="text-muted-foreground text-sm">
							Enter mathematical equations using 'x' as the variable. Examples: x^2, sin(x), cos(x),
							2*x+1, sqrt(x)
						</p>
					</div>
				{/if}

				{#if viewMode === ViewMode.REVIEW}
					<!-- Review Mode: Show student's plots -->
					{#if response.studentPlots.length > 0}
						<div class="space-y-4">
							<Label class="text-base font-semibold">Student's Plots</Label>
							{#each response.studentPlots as plot, index}
								<div class="bg-muted/20 rounded-lg border p-3">
									<div class="grid grid-cols-3 gap-4 text-sm">
										<div>
											<span class="font-medium">Equation:</span>
											{plot.equation}
										</div>
										<div>
											<span class="font-medium">Color:</span>
											<span
												class="ml-1 inline-block h-4 w-4 rounded"
												style="background-color: {plot.color}"
											></span>
										</div>
										<div>
											<span class="font-medium">Label:</span>
											{plot.label}
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-muted-foreground py-4 text-center">No student plots submitted.</div>
					{/if}
				{/if}
			</Card.Content>
		</Card.Root>
	{:else}
		<!-- PRESENTATION MODE: Clean view for presentation -->
		<div class="space-y-4">
			<h3 class="text-lg font-semibold">{config.title}</h3>
			<div bind:this={plotContainer} class="rounded-lg border"></div>
		</div>
	{/if}
</div>
