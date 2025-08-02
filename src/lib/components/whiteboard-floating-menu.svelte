<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import TypeIcon from '@lucide/svelte/icons/type';
	import PaletteIcon from '@lucide/svelte/icons/palette';
	import SlidersIcon from '@lucide/svelte/icons/sliders';

	interface Props {
		selectedTool: string;
		visible: boolean;
		onTextOptionsChange?: (options: TextOptions) => void;
		onShapeOptionsChange?: (options: ShapeOptions) => void;
		onDrawOptionsChange?: (options: DrawOptions) => void;
	}

	interface TextOptions {
		fontSize: number;
		fontFamily: string;
		fontWeight: string;
		color: string;
		textAlign: string;
	}

	interface ShapeOptions {
		strokeWidth: number;
		strokeColor: string;
		fillColor: string;
		cornerRadius?: number;
	}

	interface DrawOptions {
		brushSize: number;
		brushColor: string;
		brushType: string;
	}

	let { 
		selectedTool, 
		visible, 
		onTextOptionsChange,
		onShapeOptionsChange,
		onDrawOptionsChange 
	}: Props = $props();

	// Default options
	let textOptions = $state<TextOptions>({
		fontSize: 16,
		fontFamily: 'Arial',
		fontWeight: 'normal',
		color: '#000000',
		textAlign: 'left'
	});

	let shapeOptions = $state<ShapeOptions>({
		strokeWidth: 2,
		strokeColor: '#000000',
		fillColor: 'transparent',
		cornerRadius: 0
	});

	let drawOptions = $state<DrawOptions>({
		brushSize: 2,
		brushColor: '#000000',
		brushType: 'pencil'
	});

	let fontSizeValue = $state(16);
	let strokeWidthValue = $state(2);
	let brushSizeValue = $state(2);

	// Keep options in sync with slider values
	$effect(() => {
		textOptions.fontSize = fontSizeValue;
	});

	$effect(() => {
		shapeOptions.strokeWidth = strokeWidthValue;
	});

	$effect(() => {
		drawOptions.brushSize = brushSizeValue;
	});

	// Keep slider values in sync when options change externally
	$effect(() => {
		if (fontSizeValue !== textOptions.fontSize) {
			fontSizeValue = textOptions.fontSize;
		}
	});

	$effect(() => {
		if (strokeWidthValue !== shapeOptions.strokeWidth) {
			strokeWidthValue = shapeOptions.strokeWidth;
		}
	});

	$effect(() => {
		if (brushSizeValue !== drawOptions.brushSize) {
			brushSizeValue = drawOptions.brushSize;
		}
	});

	// Font families available
	const fontFamilies = [
		{ value: 'Arial', label: 'Arial' },
		{ value: 'Times New Roman', label: 'Times New Roman' },
		{ value: 'Georgia', label: 'Georgia' },
		{ value: 'Verdana', label: 'Verdana' },
		{ value: 'Courier New', label: 'Courier New' },
		{ value: 'Impact', label: 'Impact' }
	];

	const fontWeights = [
		{ value: 'normal', label: 'Normal' },
		{ value: 'bold', label: 'Bold' },
		{ value: '300', label: 'Light' },
		{ value: '600', label: 'Semi Bold' }
	];

	const textAlignments = [
		{ value: 'left', label: 'Left' },
		{ value: 'center', label: 'Center' },
		{ value: 'right', label: 'Right' },
		{ value: 'justify', label: 'Justify' }
	];

	const brushTypes = [
		{ value: 'pencil', label: 'Pencil' },
		{ value: 'circle', label: 'Circle' },
		{ value: 'spray', label: 'Spray' }
	];

	// Common colors
	const commonColors = [
		'#000000', '#FF0000', '#00FF00', '#0000FF', 
		'#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
		'#800080', '#FFC0CB', '#A52A2A', '#808080'
	];

	// Reactive updates
	$effect(() => {
		if (selectedTool === 'text' && onTextOptionsChange) {
			onTextOptionsChange(textOptions);
		}
	});

	$effect(() => {
		if (selectedTool === 'shapes' && onShapeOptionsChange) {
			onShapeOptionsChange(shapeOptions);
		}
	});

	$effect(() => {
		if (selectedTool === 'draw' && onDrawOptionsChange) {
			onDrawOptionsChange(drawOptions);
		}
	});

	const shouldShowMenu = $derived(
		visible && (selectedTool === 'text' || selectedTool === 'shapes' || selectedTool === 'draw')
	);
</script>

{#if shouldShowMenu}
	<div class="fixed left-8 top-1/2 transform -translate-y-1/2 z-20">
		<Card.Root class="min-w-64 max-w-80">
			{#if selectedTool === 'text'}
				<Card.Header class="pb-3">
					<Card.Title class="text-sm flex items-center gap-2">
						<TypeIcon class="h-4 w-4" />
						Text Options
					</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<!-- Font Size -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Font Size</Label>
						<div class="flex items-center gap-3">
							<Slider
								type="single"
								bind:value={fontSizeValue}
								min={8}
								max={72}
								step={1}
								class="flex-1"
							/>
							<span class="text-xs text-muted-foreground w-12 text-right">{fontSizeValue}px</span>
						</div>
					</div>

					<!-- Font Family -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Font Family</Label>
						<Select.Root type="single" bind:value={textOptions.fontFamily}>
							<Select.Trigger class="h-8">
								{textOptions.fontFamily}
							</Select.Trigger>
							<Select.Content>
								{#each fontFamilies as font}
									<Select.Item value={font.value} label={font.label} />
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<!-- Font Weight -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Font Weight</Label>
						<Select.Root type="single" bind:value={textOptions.fontWeight}>
							<Select.Trigger class="h-8">
								{fontWeights.find(w => w.value === textOptions.fontWeight)?.label || 'Normal'}
							</Select.Trigger>
							<Select.Content>
								{#each fontWeights as weight}
									<Select.Item value={weight.value} label={weight.label} />
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<Separator />

					<!-- Text Color -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Text Color</Label>
						<div class="flex gap-1 flex-wrap mb-2">
							{#each commonColors as color}
								<button
									class="w-6 h-6 rounded border-2 transition-colors hover:scale-105 {textOptions.color === color ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}"
									style="background-color: {color}"
									onclick={() => textOptions.color = color}
									aria-label="Select color {color}"
								></button>
							{/each}
						</div>
						<input
							type="color"
							bind:value={textOptions.color}
							class="w-full h-8 rounded border bg-background"
						/>
					</div>
				</Card.Content>

			{:else if selectedTool === 'shapes'}
				<Card.Header class="pb-3">
					<Card.Title class="text-sm flex items-center gap-2">
						<SlidersIcon class="h-4 w-4" />
						Shape Options
					</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<!-- Stroke Width -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Stroke Width</Label>
						<div class="flex items-center gap-3">
							<Slider
								type="single"
								bind:value={strokeWidthValue}
								min={0}
								max={20}
								step={1}
								class="flex-1"
							/>
							<span class="text-xs text-muted-foreground w-12 text-right">{strokeWidthValue}px</span>
						</div>
					</div>

					<!-- Stroke Color -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Stroke Color</Label>
						<div class="flex gap-1 flex-wrap mb-2">
							{#each commonColors as color}
								<button
									class="w-6 h-6 rounded border-2 transition-colors hover:scale-105 {shapeOptions.strokeColor === color ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}"
									style="background-color: {color}"
									onclick={() => shapeOptions.strokeColor = color}
									aria-label="Select stroke color {color}"
								></button>
							{/each}
						</div>
						<input
							type="color"
							bind:value={shapeOptions.strokeColor}
							class="w-full h-8 rounded border bg-background"
						/>
					</div>

					<Separator />

					<!-- Fill Color -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Fill Color</Label>
						<div class="flex gap-2 mb-2">
							<Button
								variant={shapeOptions.fillColor === 'transparent' ? 'default' : 'outline'}
								size="sm"
								onclick={() => shapeOptions.fillColor = 'transparent'}
								class="text-xs h-7"
							>
								No Fill
							</Button>
						</div>
						<div class="flex gap-1 flex-wrap mb-2">
							{#each commonColors as color}
								<button
									class="w-6 h-6 rounded border-2 transition-colors hover:scale-105 {shapeOptions.fillColor === color ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}"
									style="background-color: {color}"
									onclick={() => shapeOptions.fillColor = color}
									aria-label="Select fill color {color}"
								></button>
							{/each}
						</div>
						<input
							type="color"
							bind:value={shapeOptions.fillColor}
							class="w-full h-8 rounded border bg-background"
						/>
					</div>
				</Card.Content>

			{:else if selectedTool === 'draw'}
				<Card.Header class="pb-3">
					<Card.Title class="text-sm flex items-center gap-2">
						<PaletteIcon class="h-4 w-4" />
						Draw Options
					</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<!-- Brush Size -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Brush Size</Label>
						<div class="flex items-center gap-3">
							<Slider
								type="single"
								bind:value={brushSizeValue}
								min={1}
								max={50}
								step={1}
								class="flex-1"
							/>
							<span class="text-xs text-muted-foreground w-12 text-right">{brushSizeValue}px</span>
						</div>
					</div>

					<!-- Brush Color -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Brush Color</Label>
						<div class="flex gap-1 flex-wrap mb-2">
							{#each commonColors as color}
								<button
									class="w-6 h-6 rounded border-2 transition-colors hover:scale-105 {drawOptions.brushColor === color ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}"
									style="background-color: {color}"
									onclick={() => drawOptions.brushColor = color}
									aria-label="Select brush color {color}"
								></button>
							{/each}
						</div>
						<input
							type="color"
							bind:value={drawOptions.brushColor}
							class="w-full h-8 rounded border bg-background"
						/>
					</div>

					<Separator />

					<!-- Brush Type -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Brush Type</Label>
						<Select.Root type="single" bind:value={drawOptions.brushType}>
							<Select.Trigger class="h-8">
								{brushTypes.find(b => b.value === drawOptions.brushType)?.label || 'Pencil'}
							</Select.Trigger>
							<Select.Content>
								{#each brushTypes as brush}
									<Select.Item value={brush.value} label={brush.label} />
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</Card.Content>
			{/if}
		</Card.Root>
	</div>
{/if}
