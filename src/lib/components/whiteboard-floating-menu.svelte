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
	import MinusIcon from '@lucide/svelte/icons/minus';
	import Heading1Icon from '@lucide/svelte/icons/heading-1';
	import Heading2Icon from '@lucide/svelte/icons/heading-2';
	import Heading3Icon from '@lucide/svelte/icons/heading-3';
	import Heading4Icon from '@lucide/svelte/icons/heading-4';

	interface Props {
		selectedTool: string;
		visible: boolean;
		onTextOptionsChange?: (options: TextOptions) => void;
		onShapeOptionsChange?: (options: ShapeOptions) => void;
		onDrawOptionsChange?: (options: DrawOptions) => void;
		onLineArrowOptionsChange?: (options: LineArrowOptions) => void;
	}

	interface TextOptions {
		fontSize: number;
		fontFamily: string;
		fontWeight: string;
		colour: string;
		textAlign: string;
		opacity: number;
	}

	interface ShapeOptions {
		strokeWidth: number;
		strokeColour: string;
		fillColour: string;
		strokeDashArray: number[];
		cornerRadius?: number;
		opacity: number;
	}

	interface DrawOptions {
		brushSize: number;
		brushColour: string;
		brushType: string;
		opacity: number;
	}

	interface LineArrowOptions {
		strokeWidth: number;
		strokeColour: string;
		strokeDashArray: number[];
		opacity: number;
	}

	let { 
		selectedTool, 
		visible, 
		onTextOptionsChange,
		onShapeOptionsChange,
		onDrawOptionsChange,
		onLineArrowOptionsChange 
	}: Props = $props();

	// Default options
	let textOptions = $state<TextOptions>({
		fontSize: 16,
		fontFamily: 'Arial',
		fontWeight: 'normal',
		colour: '#4A5568',
		textAlign: 'left',
		opacity: 1
	});

	let shapeOptions = $state<ShapeOptions>({
		strokeWidth: 2,
		strokeColour: '#4A5568',
		fillColour: 'transparent',
		strokeDashArray: [],
		cornerRadius: 0,
		opacity: 1
	});

	let drawOptions = $state<DrawOptions>({
		brushSize: 6,
		brushColour: '#4A5568',
		brushType: 'pencil',
		opacity: 1
	});

	let lineArrowOptions = $state<LineArrowOptions>({
		strokeWidth: 2,
		strokeColour: '#4A5568',
		strokeDashArray: [],
		opacity: 1
	});

	let fontSizeValue = $state(16);
	let strokeWidthValue = $state(2);
	let brushSizeValue = $state(6);
	let textOpacityValue = $state(1);
	let shapeOpacityValue = $state(1);
	let drawOpacityValue = $state(1);
	let lineArrowStrokeWidthValue = $state(2);
	let lineArrowOpacityValue = $state(1);

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

	$effect(() => {
		textOptions.opacity = textOpacityValue;
	});

	$effect(() => {
		shapeOptions.opacity = shapeOpacityValue;
	});

	$effect(() => {
		drawOptions.opacity = drawOpacityValue;
	});

	$effect(() => {
		lineArrowOptions.strokeWidth = lineArrowStrokeWidthValue;
	});

	$effect(() => {
		lineArrowOptions.opacity = lineArrowOpacityValue;
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

	$effect(() => {
		if (textOpacityValue !== textOptions.opacity) {
			textOpacityValue = textOptions.opacity;
		}
	});

	$effect(() => {
		if (shapeOpacityValue !== shapeOptions.opacity) {
			shapeOpacityValue = shapeOptions.opacity;
		}
	});

	$effect(() => {
		if (drawOpacityValue !== drawOptions.opacity) {
			drawOpacityValue = drawOptions.opacity;
		}
	});

	$effect(() => {
		if (lineArrowStrokeWidthValue !== lineArrowOptions.strokeWidth) {
			lineArrowStrokeWidthValue = lineArrowOptions.strokeWidth;
		}
	});

	$effect(() => {
		if (lineArrowOpacityValue !== lineArrowOptions.opacity) {
			lineArrowOpacityValue = lineArrowOptions.opacity;
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
		{ value: '300', label: 'Light' }
	];

	// Common colours
	const commonColours = [
		'#1E1E1E', '#E53E3E', '#4299E1', '#48BB78'
	];

	// Extended colour palette
	const colourPalette = [
		// Row 1
		['#FFFFFF', '#8B96A5', '#1E1E1E', '#553C23', '#B83280'],
		// Row 2  
		['#553C9A', '#3C366B', '#2C5282', '#0987A0', '#2C7A7B'],
		// Row 3
		['#2F855A', '#4D7C0F', '#B7791F', '#C05621', '#C53030']
	] as const;

	const colourShades = {
		'#FFFFFF': [], // No shades for white
		'#8B96A5': ['#8B96A5', '#A0AEC0', '#CBD5E0', '#E2E8F0', '#F7FAFC'], // Gray
		'#1E1E1E': [], // No shades for black
		'#553C23': ['#553C23', '#7C6742', '#A69764', '#D4C99A', '#F0E6D2'], // Brown
		'#B83280': ['#B83280', '#D53F8C', '#ED64A6', '#F687B3', '#FED7E2'], // Pink
		'#553C9A': ['#553C9A', '#805AD5', '#9F7AEA', '#C3A6E3', '#E9D8FD'], // Purple
		'#3C366B': ['#3C366B', '#553C9A', '#7C3AED', '#A78BFA', '#D6BCFA'], // Indigo
		'#2C5282': ['#2C5282', '#3182CE', '#4299E1', '#90CDF4', '#BEE3F8'], // Blue
		'#0987A0': ['#0987A0', '#00B5D8', '#0BC5EA', '#76E4F7', '#C4F1F9'], // Cyan
		'#2C7A7B': ['#2C7A7B', '#319795', '#38B2AC', '#81E6D9', '#B2F5EA'], // Teal
		'#2F855A': ['#2F855A', '#38A169', '#48BB78', '#9AE6B4', '#C6F6D5'], // Green
		'#4D7C0F': ['#4D7C0F', '#65A30D', '#84CC16', '#BEF264', '#ECFCCB'], // Lime
		'#B7791F': ['#B7791F', '#D69E2E', '#F6E05E', '#FAF089', '#FEFCBF'], // Yellow
		'#C05621': ['#C05621', '#DD6B20', '#ED8936', '#FBD38D', '#FEEBCB'], // Orange
		'#C53030': ['#C53030', '#E53E3E', '#F56565', '#FEB2B2', '#FED7D7']  // Red
	} as const;

	type ColourFamily = keyof typeof colourShades;
	let selectedColourFamily = $state<ColourFamily>('#1E1E1E'); // Default to black
	let showExpandedColours = $state(false); // Toggle for expanded colour palette

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
		
		if (selectedTool === 'eraser' && onDrawOptionsChange) {
			onDrawOptionsChange(drawOptions);
		}
	});

	$effect(() => {
		if ((selectedTool === 'line' || selectedTool === 'arrow') && onLineArrowOptionsChange) {
			onLineArrowOptionsChange(lineArrowOptions);
		}
	});

	const shouldShowMenu = $derived(
		visible && (selectedTool === 'text' || selectedTool === 'shapes' || selectedTool === 'draw' || selectedTool === 'eraser' || selectedTool === 'line' || selectedTool === 'arrow')
	);
</script>

{#if shouldShowMenu}
	<div class="absolute top-1/2 transform -translate-y-1/2 z-20 left-8">
		<Card.Root class="min-w-64 max-w-80 bg-background/20 backdrop-blur-sm border-border/50">
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
						<div class="flex gap-2">
							<Button
								variant={fontSizeValue === 32 ? 'default' : 'outline'}
								size="sm"
								onclick={() => fontSizeValue = 32}
								class="flex-1 h-8 flex items-center justify-center"
							>
								<Heading1Icon class="h-4 w-4" />
							</Button>
							<Button
								variant={fontSizeValue === 24 ? 'default' : 'outline'}
								size="sm"
								onclick={() => fontSizeValue = 24}
								class="flex-1 h-8 flex items-center justify-center"
							>
								<Heading2Icon class="h-4 w-4" />
							</Button>
							<Button
								variant={fontSizeValue === 16 ? 'default' : 'outline'}
								size="sm"
								onclick={() => fontSizeValue = 16}
								class="flex-1 h-8 flex items-center justify-center"
							>
								<Heading3Icon class="h-4 w-4" />
							</Button>
							<Button
								variant={fontSizeValue === 12 ? 'default' : 'outline'}
								size="sm"
								onclick={() => fontSizeValue = 12}
								class="flex-1 h-8 flex items-center justify-center"
							>
								<Heading4Icon class="h-4 w-4" />
							</Button>
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

					<!-- Text Colour -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Text Colour</Label>
						<div class="flex gap-1 flex-wrap mb-2 items-center">
							{#each commonColours as colour}
								<button
									class="w-10 h-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {textOptions.colour === colour ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}"
									onclick={() => textOptions.colour = colour}
									aria-label="Select colour {colour}"
								>
									<div class="w-full h-full rounded-sm" style="background-color: {colour}"></div>
								</button>
							{/each}
							
							<!-- Separator line -->
							<div class="w-px h-8 bg-border mx-1"></div>
							
							<!-- Expanded colours toggle button -->
							<button
								class="w-10 h-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {showExpandedColours ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}"
								onclick={() => showExpandedColours = !showExpandedColours}
								aria-label="Toggle expanded colour palette"
							>
								<div class="w-full h-full rounded-sm bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500"></div>
							</button>
						</div>

						{#if showExpandedColours}
							<!-- Colour Palette -->
							<div class="space-y-2 mt-3">
								<Label class="text-xs font-medium">Colours</Label>
								
								<!-- Colour Grid -->
								<div class="space-y-1">
									{#each colourPalette as row}
										<div class="flex gap-1">
											{#each row as colour}
												<button
													class="w-10 h-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {selectedColourFamily === colour ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}"
													onclick={() => {
														selectedColourFamily = colour as ColourFamily;
														textOptions.colour = colour;
													}}
													aria-label="Select colour family {colour}"
												>
													<div class="w-full h-full rounded-sm" style="background-color: {colour}"></div>
												</button>
											{/each}
										</div>
									{/each}
								</div>

								<!-- Shades -->
								<div class="space-y-1">
									<Label class="text-xs font-medium text-muted-foreground">Shades</Label>
									{#if colourShades[selectedColourFamily].length === 0}
										<div class="text-xs text-muted-foreground italic py-2">
											No shades available for this colour
										</div>
									{:else}
										<div class="flex gap-1">
											{#each colourShades[selectedColourFamily] as shade}
												<button
													class="w-10 h-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {textOptions.colour === shade ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}"
													onclick={() => textOptions.colour = shade}
													aria-label="Select shade {shade}"
												>
													<div class="w-full h-full rounded-sm" style="background-color: {shade}"></div>
												</button>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</div>

					<Separator />

					<!-- Opacity -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Opacity</Label>
						<div class="flex items-center gap-3">
							<Slider
								type="single"
								bind:value={textOpacityValue}
								min={0.1}
								max={1}
								step={0.1}
								class="flex-1"
							/>
							<span class="text-xs text-muted-foreground w-12 text-right">{Math.round(textOpacityValue * 100)}%</span>
						</div>
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
						<div class="flex gap-2">
							<Button
								variant={strokeWidthValue === 1 ? 'default' : 'outline'}
								size="sm"
								onclick={() => strokeWidthValue = 1}
								class="w-10 h-10 flex items-center justify-center"
							>
								<MinusIcon class="h-3 w-3" strokeWidth={1} />
							</Button>
							<Button
								variant={strokeWidthValue === 2 ? 'default' : 'outline'}
								size="sm"
								onclick={() => strokeWidthValue = 2}
								class="w-10 h-10 flex items-center justify-center"
							>
								<MinusIcon class="h-4 w-4" strokeWidth={4} />
							</Button>
							<Button
								variant={strokeWidthValue === 3 ? 'default' : 'outline'}
								size="sm"
								onclick={() => strokeWidthValue = 3}
								class="w-10 h-10 flex items-center justify-center"
							>
								<MinusIcon class="h-5 w-5" strokeWidth={7} />
							</Button>
						</div>
					</div>

					<!-- Border Style -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Border Style</Label>
						<div class="flex gap-2">
							<Button
								variant={JSON.stringify(shapeOptions.strokeDashArray) === JSON.stringify([]) ? 'default' : 'outline'}
								size="sm"
								onclick={() => shapeOptions.strokeDashArray = []}
								class="w-10 h-10 flex items-center justify-center"
							>
								<MinusIcon class="h-4 w-4" />
							</Button>
							<Button
								variant={JSON.stringify(shapeOptions.strokeDashArray) === JSON.stringify([5, 5]) ? 'default' : 'outline'}
								size="sm"
								onclick={() => shapeOptions.strokeDashArray = [5, 5]}
								class="w-10 h-10 flex items-center justify-center"
							>
								<svg width="16" height="16" viewBox="0 0 16 16" class="h-4 w-4">
									<line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="2" stroke-dasharray="3,2" />
								</svg>
							</Button>
							<Button
								variant={JSON.stringify(shapeOptions.strokeDashArray) === JSON.stringify([2, 2]) ? 'default' : 'outline'}
								size="sm"
								onclick={() => shapeOptions.strokeDashArray = [2, 2]}
								class="w-10 h-10 flex items-center justify-center"
							>
								<svg width="16" height="16" viewBox="0 0 16 16" class="h-4 w-4">
									<line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="2" stroke-dasharray="1.5,1.5" />
								</svg>
							</Button>
						</div>
					</div>

					<!-- Stroke Colour -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Stroke Colour</Label>
						<div class="flex gap-1 flex-wrap mb-2 items-center">
							{#each commonColours as colour}
								<button
									class="w-10 h-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {shapeOptions.strokeColour === colour ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}"
									onclick={() => shapeOptions.strokeColour = colour}
									aria-label="Select stroke colour {colour}"
								>
									<div class="w-full h-full rounded-sm" style="background-color: {colour}"></div>
								</button>
							{/each}
							
							<!-- Separator line -->
							<div class="w-px h-8 bg-border mx-1"></div>
							
							<!-- Expanded colours toggle button -->
							<button
								class="w-10 h-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {showExpandedColours ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}"
								onclick={() => showExpandedColours = !showExpandedColours}
								aria-label="Toggle expanded colour palette"
							>
								<div class="w-full h-full rounded-sm bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500"></div>
							</button>
						</div>

						{#if showExpandedColours}
							<!-- Colour Palette -->
							<div class="space-y-2 mt-3">
								<Label class="text-xs font-medium">Colours</Label>
								
								<!-- Colour Grid -->
								<div class="space-y-1">
									{#each colourPalette as row}
										<div class="flex gap-1">
											{#each row as colour}
												<button
													class="w-10 h-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {selectedColourFamily === colour ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}"
													onclick={() => {
														selectedColourFamily = colour as ColourFamily;
														shapeOptions.strokeColour = colour;
													}}
													aria-label="Select colour family {colour}"
												>
													<div class="w-full h-full rounded-sm" style="background-color: {colour}"></div>
												</button>
											{/each}
										</div>
									{/each}
								</div>

								<!-- Shades -->
								<div class="space-y-1">
									<Label class="text-xs font-medium text-muted-foreground">Shades</Label>
									{#if colourShades[selectedColourFamily].length === 0}
										<div class="text-xs text-muted-foreground italic py-2">
											No shades available for this colour
										</div>
									{:else}
										<div class="flex gap-1">
											{#each colourShades[selectedColourFamily] as shade}
												<button
													class="w-10 h-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {shapeOptions.strokeColour === shade ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}"
													onclick={() => shapeOptions.strokeColour = shade}
													aria-label="Select shade {shade}"
												>
													<div class="w-full h-full rounded-sm" style="background-color: {shade}"></div>
												</button>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</div>

					<Separator />

					<!-- Fill Colour -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Fill Colour</Label>
						<div class="flex gap-2 mb-2">
							<Button
								variant={shapeOptions.fillColour === 'transparent' ? 'default' : 'outline'}
								size="sm"
								onclick={() => shapeOptions.fillColour = 'transparent'}
								class="text-xs h-7"
							>
								No Fill
							</Button>
						</div>
						<div class="flex gap-1 flex-wrap mb-2 items-center">
							{#each commonColours as colour}
								<button
									class="w-10 h-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {shapeOptions.fillColour === colour ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}"
									onclick={() => shapeOptions.fillColour = colour}
									aria-label="Select fill colour {colour}"
								>
									<div class="w-full h-full rounded-sm" style="background-color: {colour}"></div>
								</button>
							{/each}
							
							<!-- Separator line -->
							<div class="w-px h-8 bg-border mx-1"></div>
							
							<!-- Expanded colours toggle button -->
							<button
								class="w-10 h-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {showExpandedColours ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}"
								onclick={() => showExpandedColours = !showExpandedColours}
								aria-label="Toggle expanded colour palette"
							>
								<div class="w-full h-full rounded-sm bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500"></div>
							</button>
						</div>

						{#if showExpandedColours}
							<!-- Colour Palette -->
							<div class="space-y-2 mt-3">
								<Label class="text-xs font-medium">Colours</Label>
								
								<!-- Colour Grid -->
								<div class="space-y-1">
									{#each colourPalette as row}
										<div class="flex gap-1">
											{#each row as colour}
												<button
													class="w-10 h-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {selectedColourFamily === colour ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}"
													onclick={() => {
														selectedColourFamily = colour as ColourFamily;
														shapeOptions.fillColour = colour;
													}}
													aria-label="Select colour family {colour}"
												>
													<div class="w-full h-full rounded-sm" style="background-color: {colour}"></div>
												</button>
											{/each}
										</div>
									{/each}
								</div>

								<!-- Shades -->
								<div class="space-y-1">
									<Label class="text-xs font-medium text-muted-foreground">Shades</Label>
									{#if colourShades[selectedColourFamily].length === 0}
										<div class="text-xs text-muted-foreground italic py-2">
											No shades available for this colour
										</div>
									{:else}
										<div class="flex gap-1">
											{#each colourShades[selectedColourFamily] as shade}
												<button
													class="w-10 h-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {shapeOptions.fillColour === shade ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}"
													onclick={() => shapeOptions.fillColour = shade}
													aria-label="Select shade {shade}"
												>
													<div class="w-full h-full rounded-sm" style="background-color: {shade}"></div>
												</button>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</div>

					<Separator />

					<!-- Opacity -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Opacity</Label>
						<div class="flex items-center gap-3">
							<Slider
								type="single"
								bind:value={shapeOpacityValue}
								min={0.1}
								max={1}
								step={0.1}
								class="flex-1"
							/>
							<span class="text-xs text-muted-foreground w-12 text-right">{Math.round(shapeOpacityValue * 100)}%</span>
						</div>
					</div>
				</Card.Content>

			{:else if selectedTool === 'draw' || selectedTool === 'eraser'}
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
						<div class="flex gap-2">
							<Button
								variant={brushSizeValue === 2 ? 'default' : 'outline'}
								size="sm"
								onclick={() => brushSizeValue = 2}
								class="w-10 h-10 flex items-center justify-center"
							>
								<MinusIcon class="h-3 w-3" strokeWidth={1} />
							</Button>
							<Button
								variant={brushSizeValue === 6 ? 'default' : 'outline'}
								size="sm"
								onclick={() => brushSizeValue = 6}
								class="w-10 h-10 flex items-center justify-center"
							>
								<MinusIcon class="h-4 w-4" strokeWidth={4} />
							</Button>
							<Button
								variant={brushSizeValue === 12 ? 'default' : 'outline'}
								size="sm"
								onclick={() => brushSizeValue = 12}
								class="w-10 h-10 flex items-center justify-center"
							>
								<MinusIcon class="h-5 w-5" strokeWidth={7} />
							</Button>
						</div>
					</div>

					<!-- Brush Colour -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Brush Colour</Label>
						<div class="flex gap-1 flex-wrap mb-2 items-center">
							{#each commonColours as colour}
								<button
									class="w-10 h-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {drawOptions.brushColour === colour ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}"
									onclick={() => drawOptions.brushColour = colour}
									aria-label="Select brush colour {colour}"
								>
									<div class="w-full h-full rounded-sm" style="background-color: {colour}"></div>
								</button>
							{/each}
							
							<!-- Separator line -->
							<div class="w-px h-8 bg-border mx-1"></div>
							
							<!-- Expanded colours toggle button -->
							<button
								class="w-10 h-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {showExpandedColours ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}"
								onclick={() => showExpandedColours = !showExpandedColours}
								aria-label="Toggle expanded colour palette"
							>
								<div class="w-full h-full rounded-sm bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500"></div>
							</button>
						</div>

						{#if showExpandedColours}
							<!-- Colour Palette -->
							<div class="space-y-2 mt-3">
								<Label class="text-xs font-medium">Colours</Label>
								
								<!-- Colour Grid -->
								<div class="space-y-1">
									{#each colourPalette as row}
										<div class="flex gap-1">
											{#each row as colour}
												<button
													class="w-10 h-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {selectedColourFamily === colour ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}"
													onclick={() => {
														selectedColourFamily = colour as ColourFamily;
														drawOptions.brushColour = colour;
													}}
													aria-label="Select colour family {colour}"
												>
													<div class="w-full h-full rounded-sm" style="background-color: {colour}"></div>
												</button>
											{/each}
										</div>
									{/each}
								</div>

								<!-- Shades -->
								<div class="space-y-1">
									<Label class="text-xs font-medium text-muted-foreground">Shades</Label>
									{#if colourShades[selectedColourFamily].length === 0}
										<div class="text-xs text-muted-foreground italic py-2">
											No shades available for this colour
										</div>
									{:else}
										<div class="flex gap-1">
											{#each colourShades[selectedColourFamily] as shade}
												<button
													class="w-10 h-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {drawOptions.brushColour === shade ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}"
													onclick={() => drawOptions.brushColour = shade}
													aria-label="Select shade {shade}"
												>
													<div class="w-full h-full rounded-sm" style="background-color: {shade}"></div>
												</button>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</div>

					<!-- Opacity -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Opacity</Label>
						<div class="flex items-center gap-3">
							<Slider
								type="single"
								bind:value={drawOpacityValue}
								min={0.1}
								max={1}
								step={0.1}
								class="flex-1"
							/>
							<span class="text-xs text-muted-foreground w-12 text-right">{Math.round(drawOpacityValue * 100)}%</span>
						</div>
					</div>
				</Card.Content>
			{:else if selectedTool === 'line' || selectedTool === 'arrow'}
				<Card.Header class="pb-3">
					<Card.Title class="text-sm flex items-center gap-2">
						{#if selectedTool === 'line'}
							<MinusIcon class="h-4 w-4" />
							Line Options
						{:else}
							<!-- Using arrow right icon for arrow tool -->
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
							</svg>
							Arrow Options
						{/if}
					</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<!-- Stroke Width -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Stroke Width</Label>
						<div class="flex items-center gap-3">
							<Slider
								type="single"
								bind:value={lineArrowStrokeWidthValue}
								min={1}
								max={10}
								step={1}
								class="flex-1"
							/>
							<span class="text-xs text-muted-foreground w-8 text-right">{lineArrowStrokeWidthValue}px</span>
						</div>
					</div>

					<!-- Stroke Colour -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Colour</Label>
						<div class="flex gap-1">
							{#each commonColours as colour}
								<button
									class="w-8 h-8 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {lineArrowOptions.strokeColour === colour ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}"
									onclick={() => lineArrowOptions.strokeColour = colour}
									aria-label="Select colour {colour}"
								>
									<div class="w-full h-full rounded-sm" style="background-color: {colour}"></div>
								</button>
							{/each}
						</div>
					</div>

					<!-- Line Style -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Line Style</Label>
						<div class="flex gap-2">
							<Button
								variant={lineArrowOptions.strokeDashArray.length === 0 ? 'default' : 'outline'}
								size="sm"
								onclick={() => lineArrowOptions.strokeDashArray = []}
								class="flex-1 h-8"
							>
								Solid
							</Button>
							<Button
								variant={lineArrowOptions.strokeDashArray.length > 0 ? 'default' : 'outline'}
								size="sm"
								onclick={() => lineArrowOptions.strokeDashArray = [5, 5]}
								class="flex-1 h-8"
							>
								Dashed
							</Button>
						</div>
					</div>

					<!-- Opacity -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Opacity</Label>
						<div class="flex items-center gap-3">
							<Slider
								type="single"
								bind:value={lineArrowOpacityValue}
								min={0.1}
								max={1}
								step={0.1}
								class="flex-1"
							/>
							<span class="text-xs text-muted-foreground w-12 text-right">{Math.round(lineArrowOpacityValue * 100)}%</span>
						</div>
					</div>
				</Card.Content>
			{/if}
		</Card.Root>
	</div>
{/if}
