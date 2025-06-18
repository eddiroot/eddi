<script lang="ts">
	import { onMount } from 'svelte';
	import * as fabric from 'fabric';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	import MousePointerIcon from '@lucide/svelte/icons/mouse-pointer';
	import PenToolIcon from '@lucide/svelte/icons/pen-tool';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import SquareIcon from '@lucide/svelte/icons/square';
	import TriangleIcon from '@lucide/svelte/icons/triangle';
	import TypeIcon from '@lucide/svelte/icons/type';
	import PiIcon from '@lucide/svelte/icons/pi';
	import CalculatorIcon from '@lucide/svelte/icons/calculator';
	import MinusIcon from '@lucide/svelte/icons/minus';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import XIcon from '@lucide/svelte/icons/x';
	import DivideIcon from '@lucide/svelte/icons/divide';
	import EqualIcon from '@lucide/svelte/icons/equal';
	import EraseIcon from '@lucide/svelte/icons/eraser';
	import UndoIcon from '@lucide/svelte/icons/undo';
	import RedoIcon from '@lucide/svelte/icons/redo';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import TrashIcon from '@lucide/svelte/icons/trash';

	let socket = $state() as WebSocket;
	let canvas: fabric.Canvas;
	let selectedTool = $state('select');
	let isDrawing = $state(false);

	// Tool functions
	const setSelectTool = () => {
		selectedTool = 'select';
		canvas.isDrawingMode = false;
		canvas.selection = true;
		canvas.defaultCursor = 'default';
		canvas.hoverCursor = 'move';
	};

	const setDrawTool = () => {
		selectedTool = 'draw';
		canvas.isDrawingMode = true;
		canvas.selection = false;
		canvas.defaultCursor = 'crosshair';

		// Set up the drawing brush
		canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
		canvas.freeDrawingBrush.width = 2;
		canvas.freeDrawingBrush.color = '#000000';
	};

	const addShape = (shapeType: string) => {
		let shape: fabric.Object;
		const centerX = canvas.width! / 2;
		const centerY = canvas.height! / 2;

		switch (shapeType) {
			case 'circle':
				shape = new fabric.Circle({
					radius: 50,
					fill: 'transparent',
					stroke: '#000000',
					strokeWidth: 2,
					left: centerX - 50,
					top: centerY - 50
				});
				break;
			case 'rectangle':
				shape = new fabric.Rect({
					width: 100,
					height: 60,
					fill: 'transparent',
					stroke: '#000000',
					strokeWidth: 2,
					left: centerX - 50,
					top: centerY - 30
				});
				break;
			case 'triangle':
				shape = new fabric.Triangle({
					width: 80,
					height: 80,
					fill: 'transparent',
					stroke: '#000000',
					strokeWidth: 2,
					left: centerX - 40,
					top: centerY - 40
				});
				break;
			default:
				return;
		}

		canvas.add(shape);
		canvas.setActiveObject(shape);
		canvas.renderAll();
		sendCanvasUpdate();
	};

	const addText = () => {
		const text = new fabric.Textbox('Click to edit text', {
			left: canvas.width! / 2 - 75,
			top: canvas.height! / 2 - 10,
			width: 150,
			fontSize: 16,
			fontFamily: 'Arial',
			fill: '#000000'
		});
		canvas.add(text);
		canvas.setActiveObject(text);
		canvas.renderAll();
		sendCanvasUpdate();
	};

	const addMathSymbol = (symbol: string) => {
		const mathText = new fabric.Text(symbol, {
			left: canvas.width! / 2 - 10,
			top: canvas.height! / 2 - 10,
			fontSize: 20,
			fontFamily: 'Times New Roman',
			fill: '#000000'
		});
		canvas.add(mathText);
		canvas.setActiveObject(mathText);
		canvas.renderAll();
		sendCanvasUpdate();
	};

	const clearCanvas = () => {
		canvas.clear();
		sendCanvasUpdate();
	};

	const deleteSelected = () => {
		const activeObjects = canvas.getActiveObjects();
		if (activeObjects.length) {
			activeObjects.forEach((obj) => canvas.remove(obj));
			canvas.discardActiveObject();
			canvas.renderAll();
			sendCanvasUpdate();
		}
	};

	const downloadCanvas = () => {
		const dataURL = canvas.toDataURL({
			format: 'png',
			quality: 1,
			multiplier: 1
		});
		const link = document.createElement('a');
		link.href = dataURL;
		link.download = 'whiteboard.png';
		link.click();
	};

	const sendCanvasUpdate = () => {
		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(
				JSON.stringify({
					type: 'objects',
					objects: canvas.toJSON()
				})
			);
		}
	};

	onMount(() => {
		socket = new WebSocket('/whiteboard/ws');
		canvas = new fabric.Canvas('whiteboard');

		// Initialize drawing brush
		canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
		canvas.freeDrawingBrush.width = 2;
		canvas.freeDrawingBrush.color = '#000000';

		// Set initial tool to select
		setSelectTool();

		window.addEventListener('resize', resizeCanvas);

		function resizeCanvas() {
			canvas.setDimensions({
				width: window.innerWidth,
				height: window.innerHeight
			});
		}

		resizeCanvas();

		socket.addEventListener('message', (event) => {
			try {
				const data = JSON.parse(event.data);
				if (data.type === 'objects') {
					const objects = data.objects;
					canvas.loadFromJSON(objects, () => {
						canvas.renderAll();
						resizeCanvas();
					});
				}
			} catch (e) {
				console.error('Error parsing JSON:', e);
			}
		});

		canvas.on('object:moving', () => {
			sendCanvasUpdate();
		});

		canvas.on('object:scaling', () => {
			sendCanvasUpdate();
		});

		canvas.on('object:rotating', () => {
			sendCanvasUpdate();
		});

		canvas.on('path:created', () => {
			sendCanvasUpdate();
		});

		canvas.on('text:changed', () => {
			sendCanvasUpdate();
		});
	});
</script>

<!-- Floating Menubar -->
<div class="fixed top-16 left-1/2 z-50 -translate-x-1/2 transform">
	<div
		class="bg-background/95 supports-[backdrop-filter]:bg-background/60 rounded-lg border p-2 shadow-lg backdrop-blur"
	>
		<div class="flex items-center gap-1">
			<!-- Selection Tool -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button
						variant={selectedTool === 'select' ? 'default' : 'ghost'}
						size="icon"
						onclick={setSelectTool}
						class="h-9 w-9"
					>
						<MousePointerIcon class="h-4 w-4" />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Select Tool</p>
				</Tooltip.Content>
			</Tooltip.Root>

			<!-- Draw Tool -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button
						variant={selectedTool === 'draw' ? 'default' : 'ghost'}
						size="icon"
						onclick={setDrawTool}
						class="h-9 w-9"
					>
						<PenToolIcon class="h-4 w-4" />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Draw Tool</p>
				</Tooltip.Content>
			</Tooltip.Root>

			<div class="bg-border mx-1 h-6 w-px"></div>

			<!-- Shapes Dropdown -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<Button variant="ghost" size="icon" class="h-9 w-9">
						<SquareIcon class="h-4 w-4" />
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					<DropdownMenu.Item onclick={() => addShape('rectangle')}>
						<SquareIcon class="h-4 w-4" />
						Rectangle
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => addShape('circle')}>
						<CircleIcon class="h-4 w-4" />
						Circle
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => addShape('triangle')}>
						<TriangleIcon class="h-4 w-4" />
						Triangle
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			<!-- Text Tool -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button variant="ghost" size="icon" onclick={addText} class="h-9 w-9">
						<TypeIcon class="h-4 w-4" />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Add Text</p>
				</Tooltip.Content>
			</Tooltip.Root>

			<!-- Math Symbols Dropdown -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<Button variant="ghost" size="icon" class="h-9 w-9">
						<PiIcon class="h-4 w-4" />
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					<DropdownMenu.Item onclick={() => addMathSymbol('π')}>
						<PiIcon class="h-4 w-4" />
						Pi (π)
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => addMathSymbol('+')}>
						<PlusIcon class="h-4 w-4" />
						Plus (+)
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => addMathSymbol('-')}>
						<MinusIcon class="h-4 w-4" />
						Minus (-)
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => addMathSymbol('×')}>
						<XIcon class="h-4 w-4" />
						Multiply (×)
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => addMathSymbol('÷')}>
						<DivideIcon class="h-4 w-4" />
						Divide (÷)
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => addMathSymbol('=')}>
						<EqualIcon class="h-4 w-4" />
						Equals (=)
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => addMathSymbol('∑')}>
						<CalculatorIcon class="h-4 w-4" />
						Sum (∑)
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => addMathSymbol('∫')}>
						<CalculatorIcon class="h-4 w-4" />
						Integral (∫)
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => addMathSymbol('√')}>
						<CalculatorIcon class="h-4 w-4" />
						Square Root (√)
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => addMathSymbol('∞')}>
						<CalculatorIcon class="h-4 w-4" />
						Infinity (∞)
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => addMathSymbol('α')}>
						<CalculatorIcon class="h-4 w-4" />
						Alpha (α)
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => addMathSymbol('β')}>
						<CalculatorIcon class="h-4 w-4" />
						Beta (β)
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => addMathSymbol('θ')}>
						<CalculatorIcon class="h-4 w-4" />
						Theta (θ)
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			<div class="bg-border mx-1 h-6 w-px"></div>

			<!-- Delete Selected -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button variant="ghost" size="icon" onclick={deleteSelected} class="h-9 w-9">
						<TrashIcon class="h-4 w-4" />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Delete Selected</p>
				</Tooltip.Content>
			</Tooltip.Root>

			<!-- Clear Canvas -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button variant="ghost" size="icon" onclick={clearCanvas} class="h-9 w-9">
						<EraseIcon class="h-4 w-4" />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Clear Canvas</p>
				</Tooltip.Content>
			</Tooltip.Root>

			<div class="bg-border mx-1 h-6 w-px"></div>

			<!-- Download -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button variant="ghost" size="icon" onclick={downloadCanvas} class="h-9 w-9">
						<DownloadIcon class="h-4 w-4" />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Download as PNG</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</div>
	</div>
</div>

<canvas id="whiteboard"></canvas>

<style>
	#whiteboard {
		display: block;
		cursor: default;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
	}
</style>
