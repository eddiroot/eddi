<script lang="ts">
	import { v4 as uuidv4 } from 'uuid';
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
	import EraseIcon from '@lucide/svelte/icons/eraser';
	import TrashIcon from '@lucide/svelte/icons/trash';

	let socket = $state() as WebSocket;
	let canvas: fabric.Canvas;
	let selectedTool = $state('select');

	const sendCanvasUpdate = (data: Object) => {
		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify(data));
		}
	};

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
					id: uuidv4(),
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
					id: uuidv4(),
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
					id: uuidv4(),
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
		sendCanvasUpdate({
			type: 'add',
			object: shape.toObject()
		});
	};

	const addText = () => {
		const text = new fabric.Textbox('Click to edit text', {
			id: uuidv4(),
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
		sendCanvasUpdate({
			type: 'add',
			object: text.toObject()
		});
	};

	const clearCanvas = () => {
		canvas.clear();
		sendCanvasUpdate({
			type: 'clear'
		});
	};

	const deleteSelected = () => {
		const activeObjects = canvas.getActiveObjects();
		if (activeObjects.length) {
			activeObjects.forEach((obj) => canvas.remove(obj));
			canvas.discardActiveObject();
			canvas.renderAll();
			sendCanvasUpdate({
				type: 'delete',
				objects: activeObjects.map((obj) => obj.toObject())
			});
		}
	};

	onMount(() => {
		socket = new WebSocket('/whiteboard/ws');
		canvas = new fabric.Canvas('whiteboard');

		canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
		canvas.freeDrawingBrush.width = 2;
		canvas.freeDrawingBrush.color = '#000000';

		setSelectTool();

		socket.addEventListener('message', (event) => {
			try {
				const data = JSON.parse(event.data);
				if (data.type === 'load') {
					data.whiteboard.objects.forEach((obj: any) => {
						canvas.add(new fabric.FabricObject(obj));
					});
					canvas.renderAll();
				} else if (data.type === 'add') {
					canvas.add(new fabric.FabricObject(data.object));
					canvas.renderAll();
				} else if (data.type === 'modify') {
					const objects = canvas.getObjects();
					// We already add an ID to each object in the canvas, so we can find it later
					// @ts-expect-error
					const obj = objects.find((o) => o.id === data.object.id);
					if (obj) {
						obj.set(data.object);
						canvas.renderAll();
					}
				} else if (data.type === 'delete') {
					const objects = canvas.getObjects();
					data.objects.forEach((objData: any) => {
						// We already add an ID to each object in the canvas, so we can find it later
						// @ts-expect-error
						const obj = objects.find((o) => o.id === objData.id);
						if (obj) {
							canvas.remove(obj);
						}
					});
					canvas.renderAll();
				} else if (data.type === 'clear') {
					canvas.clear();
				}
			} catch (e) {
				console.error('Error parsing JSON:', e);
			}
		});

		canvas.on('object:moving', ({ target }) => {
			sendCanvasUpdate({
				type: 'modify',
				object: target.toObject()
			});
		});

		canvas.on('object:scaling', ({ target }) => {
			sendCanvasUpdate({
				type: 'modify',
				object: target.toObject()
			});
		});

		canvas.on('object:rotating', ({ target }) => {
			sendCanvasUpdate({
				type: 'modify',
				object: target.toObject()
			});
		});

		canvas.on('path:created', ({ path }) => {
			sendCanvasUpdate({
				type: 'add',
				object: path.toObject()
			});
		});

		canvas.on('text:changed', ({ target }) => {
			sendCanvasUpdate({
				type: 'modify',
				object: target.toObject()
			});
		});

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Backspace' || event.key === 'Delete') {
				const activeObject = canvas.getActiveObject();
				// @ts-expect-error
				if (activeObject && (!activeObject.isType('textbox') || !activeObject.isEditing)) {
					event.preventDefault();
					deleteSelected();
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
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
		</div>
	</div>
</div>
<div class="flex h-full items-center justify-center">
	<canvas id="whiteboard" width={1200} height={800} class="border"></canvas>
</div>
